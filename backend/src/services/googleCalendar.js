import { google } from 'googleapis';
import { query } from '../config/database.js';
import { decrypt } from '../utils/crypto.js';

export const getGoogleClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.BACKEND_URL}/api/auth/google/callback`
    );
};

// Google Calendar color IDs mapped to BeatDrop event categories
const CATEGORY_COLORS = {
    'Album Drop': '9',        // Blueberry (blue)
    'Single': '5',            // Banana (yellow)
    'Concert': '11',          // Tomato (red)
    'Listening Party': '2',   // Sage (green)
    'Miscellaneous': '8',     // Graphite (dark gray)
};

/**
 * Build the Google Calendar event description from event data
 */
function buildDescription(localEvent) {
    const parts = [];

    if (localEvent.description) {
        parts.push(localEvent.description);
    }

    if (localEvent.category) {
        parts.push(`📁 Category: ${localEvent.category}`);
    }

    if (localEvent.artist_names && localEvent.artist_names.length > 0) {
        parts.push(`🎤 Artists: ${localEvent.artist_names.join(', ')}`);
    }

    if (localEvent.external_url) {
        parts.push(`🔗 Stream: ${localEvent.external_url}`);
    }

    parts.push('');
    parts.push('(Added via BeatDrop 🎵)');

    return parts.join('\n');
}

export const syncEventToGoogle = async (userId, localEvent) => {
    try {
        const result = await query('SELECT google_access_token, google_refresh_token FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user || (!user.google_access_token && !user.google_refresh_token)) {
            return null;
        }

        const oauth2Client = getGoogleClient();

        oauth2Client.on('tokens', (tokens) => {
            if (tokens.access_token) {
                query('UPDATE users SET google_access_token = $1, google_token_expiry = $2 WHERE id = $3', [
                    tokens.access_token,
                    tokens.expiry_date || null,
                    userId
                ]).catch(console.error);
            }
        });

        oauth2Client.setCredentials({
            access_token: user.google_access_token,
            refresh_token: user.google_refresh_token ? decrypt(user.google_refresh_token) : null
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Build the event object
        const event = {
            summary: localEvent.title,
            description: buildDescription(localEvent),
            colorId: CATEGORY_COLORS[localEvent.category] || '9',
        };

        // Determine if this is an all-day event or a timed event
        const eventDateStr = typeof localEvent.event_date === 'string'
            ? localEvent.event_date.split('T')[0]
            : new Date(localEvent.event_date).toISOString().split('T')[0];

        if (localEvent.start_time) {
            // Timed event — use dateTime
            const startDateTime = new Date(`${eventDateStr}T${localEvent.start_time}:00`);
            let endDateTime;

            if (localEvent.end_time) {
                endDateTime = new Date(`${eventDateStr}T${localEvent.end_time}:00`);
            } else {
                // Default 1 hour duration
                endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
            }

            event.start = {
                dateTime: startDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            };
            event.end = {
                dateTime: endDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            };
        } else {
            // All-day event — use date (no time)
            event.start = { date: eventDateStr };
            event.end = { date: eventDateStr };
        }

        // Add streaming URL as source if provided
        if (localEvent.external_url) {
            event.source = {
                title: 'Stream on BeatDrop',
                url: localEvent.external_url,
            };
        }

        console.log('[Google Calendar] Syncing event:', event.summary,
            localEvent.start_time ? `at ${localEvent.start_time}` : '(all-day)',
            `color: ${event.colorId}`);

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        console.log('[Google Calendar] ✅ Event created:', response.data.id);
        return response.data.id;
    } catch (err) {
        console.error('[Google Calendar] Failed to sync:', err.message);
        return null;
    }
};

export const deleteEventFromGoogle = async (userId, googleEventId) => {
    if (!googleEventId) return;

    try {
        const result = await query('SELECT google_access_token, google_refresh_token FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user || (!user.google_access_token && !user.google_refresh_token)) return;

        const oauth2Client = getGoogleClient();
        oauth2Client.setCredentials({
            access_token: user.google_access_token,
            refresh_token: user.google_refresh_token ? decrypt(user.google_refresh_token) : null
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: googleEventId,
        });

        console.log('[Google Calendar] 🗑️ Event deleted:', googleEventId);
    } catch (err) {
        console.error('[Google Calendar] Failed to delete:', err.message);
    }
};
