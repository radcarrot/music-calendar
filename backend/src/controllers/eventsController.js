import { query } from '../config/database.js';
import { syncEventToGoogle, deleteEventFromGoogle } from '../services/googleCalendar.js';

// Get all events for the logged-in user
export const getEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const sql = `
            SELECT e.id, e.user_id, e.title, TO_CHAR(e.event_date, 'YYYY-MM-DD') as event_date,
                   e.start_time::text, e.end_time::text,
                   e.description, e.category, e.external_url, e.google_calendar_event_id, e.created_at, 
                   COALESCE(json_agg(json_build_object('id', a.id, 'name', a.name, 'image_url', a.image_url)) FILTER (WHERE a.id IS NOT NULL), '[]') as artists
            FROM events e
            LEFT JOIN event_artists ea ON e.id = ea.event_id
            LEFT JOIN artists a ON ea.artist_id = a.id
            WHERE e.user_id = $1
            GROUP BY e.id
            ORDER BY e.event_date ASC
        `;
        const result = await query(sql, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create a new event
export const createEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, event_date, description, category, external_url, artist_ids, start_time, end_time, sync_to_google } = req.body;

        if (!title || !event_date) {
            return res.status(400).json({ error: 'Title and event_date are required' });
        }

        // Insert event with time fields
        const insertEventSql = `
            INSERT INTO events (user_id, title, event_date, description, category, external_url, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const eventResult = await query(insertEventSql, [
            userId, title, event_date, description, category, external_url,
            start_time || null, end_time || null
        ]);
        const newEvent = eventResult.rows[0];

        // Process artist tags if any
        const artistNames = [];
        if (artist_ids && Array.isArray(artist_ids) && artist_ids.length > 0) {
            for (const artistId of artist_ids) {
                const artistCheck = await query('SELECT id, name FROM artists WHERE id = $1', [artistId]);
                if (artistCheck.rows.length > 0) {
                    await query('INSERT INTO event_artists (event_id, artist_id) VALUES ($1, $2)', [newEvent.id, artistId]);
                    artistNames.push(artistCheck.rows[0].name);
                }
            }
        }

        // Sync with Google Calendar (if user wants it, default true)
        if (sync_to_google !== false) {
            syncEventToGoogle(userId, {
                title,
                event_date,
                description,
                category,
                external_url,
                start_time: start_time || null,
                end_time: end_time || null,
                artist_names: artistNames
            }).then(googleEventId => {
                if (googleEventId) {
                    query('UPDATE events SET google_calendar_event_id = $1 WHERE id = $2', [googleEventId, newEvent.id])
                        .catch(err => console.error('Failed to update event with Google ID:', err));
                }
            });
        }

        // Fetch the inserted event with its artists
        const fetchSql = `
            SELECT e.id, e.user_id, e.title, TO_CHAR(e.event_date, 'YYYY-MM-DD') as event_date,
                   e.start_time::text, e.end_time::text,
                   e.description, e.category, e.external_url, e.google_calendar_event_id, e.created_at, 
                   COALESCE(json_agg(json_build_object('id', a.id, 'name', a.name, 'image_url', a.image_url)) FILTER (WHERE a.id IS NOT NULL), '[]') as artists
            FROM events e
            LEFT JOIN event_artists ea ON e.id = ea.event_id
            LEFT JOIN artists a ON ea.artist_id = a.id
            WHERE e.id = $1
            GROUP BY e.id
        `;
        const finalResult = await query(fetchSql, [newEvent.id]);

        res.status(201).json(finalResult.rows[0]);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete an event (with IDOR protection)
export const deleteEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const eventId = req.params.id;

        const result = await query('DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING id, google_calendar_event_id', [eventId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found or you do not have permission to delete it' });
        }

        const deletedEvent = result.rows[0];

        if (deletedEvent.google_calendar_event_id) {
            deleteEventFromGoogle(userId, deletedEvent.google_calendar_event_id)
                .catch(err => console.error('Error in async Google Calendar deletion:', err));
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
