-- Add indexes to improve query performance

-- Spotify IDs are frequently joined/looked up
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);

-- Date-based filtering for Releases and Calendar views
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- Grouping events by category might be common
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- Tracked artists joins
CREATE INDEX IF NOT EXISTS idx_tracked_user_id ON user_artists(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_artist_id ON user_artists(artist_id);
