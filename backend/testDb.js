import { query } from './src/config/database.js';

async function test() {
    try {
        console.log("Testing GET events query...");
        const sql1 = `
            SELECT e.*, 
                   COALESCE(json_agg(json_build_object('id', a.id, 'name', a.name, 'image_url', a.image_url)) FILTER (WHERE a.id IS NOT NULL), '[]') as artists
            FROM events e
            LEFT JOIN event_artists ea ON e.id = ea.event_id
            LEFT JOIN artists a ON ea.artist_id = a.id
            WHERE e.user_id = 1
            GROUP BY e.id
            ORDER BY e.event_date ASC
        `;
        const res1 = await query(sql1);
        console.log("GET SUCCESS", res1.rows.length);
    } catch (e) {
        console.error("GET DB ERROR:", e.message);
    }

    try {
        console.log("Testing POST event query...");
        const insertEventSql = `
            INSERT INTO events (user_id, title, event_date, description, category, external_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        await query(insertEventSql, [1, 'Test Title', '2026-03-05', 'Test Desc', 'Concert', '']);
        console.log("POST SUCCESS");
    } catch (e) {
        console.error("POST DB ERROR:", e.message);
    }
    process.exit(0);
}
test();
