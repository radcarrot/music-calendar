import { google } from 'googleapis';
import { query } from '../config/database.js';
import { decrypt } from '../utils/crypto.js';

export const getGoogleClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'http://localhost:5000/api/auth/google/callback'
    );
};

export const syncEventToGoogle = async (userId, localEvent) => {
    try {
        const result = await query('SELECT google_access_token, google_refresh_token FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user || (!user.google_access_token && !user.google_refresh_token)) {
            return null; // User hasn't linked Google Calendar
        }

        const oauth2Client = getGoogleClient();

        // Listen for automatic token refreshes and update the database
        oauth2Client.on('tokens', (tokens) => {
            if (tokens.access_token) {
                query('UPDATE users SET google_access_token = $1, google_token_expiry = $2 WHERE id = $3', [
                    tokens.access_token,
                    tokens.expiry_date || null,
                    userId
                ]).catch(console.error);
            }
        });

        // Set the credentials. If access_token is expired, googleapis will use refresh_token to get a new one
        oauth2Client.setCredentials({
            access_token: user.google_access_token,
            refresh_token: user.google_refresh_token ? decrypt(user.google_refresh_token) : null
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const eventDate = new Date(localEvent.event_date);
        const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration

        const event = {
            summary: localEvent.title,
            description: localEvent.description ? `${localEvent.description}\n\n(Added via Beatdrop)` : '(Added via Beatdrop)',
            start: {
                dateTime: eventDate.toISOString(),
                timeZone: 'UTC', // We should ideally get the user's timezone, but UTC is a safe fallback
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'UTC',
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        return response.data.id; // The Google Event ID
    } catch (err) {
        console.error('Failed to sync to Google Calendar:', err);
        return null; // Don't throw, just allow the local event to be created even if sync fails
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
    } catch (err) {
        console.error('Failed to delete from Google Calendar:', err);
    }
};
