import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

// GET /api/users/profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT id, name, email, profile_image_url, google_sync_enabled, email_alerts, push_alerts FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT /api/users/preferences
export const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { google_sync_enabled, email_alerts, push_alerts } = req.body;

        let updateQuery = 'UPDATE users SET ';
        const values = [];
        let valueCount = 1;

        if (google_sync_enabled !== undefined) {
            updateQuery += `google_sync_enabled = $${valueCount},`;
            values.push(google_sync_enabled);
            valueCount++;
        }
        if (email_alerts !== undefined) {
            updateQuery += `email_alerts = $${valueCount},`;
            values.push(email_alerts);
            valueCount++;
        }
        if (push_alerts !== undefined) {
            updateQuery += `push_alerts = $${valueCount},`;
            values.push(push_alerts);
            valueCount++;
        }

        // Remove trailing comma
        if (values.length === 0) return res.status(400).json({ error: 'No valid preferences to update' });
        updateQuery = updateQuery.slice(0, -1);

        updateQuery += ` WHERE id = $${valueCount} RETURNING id, name, email, google_sync_enabled, email_alerts, push_alerts`;
        values.push(userId);

        const result = await pool.query(updateQuery, values);

        res.json({ message: 'Preferences updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Error updating user preferences:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT /api/users/password
export const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long and contain at least one letter and one number.' });
        }

        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/users/profile
export const deleteAccount = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;

        await client.query('BEGIN');

        // Delete dependencies
        await client.query('DELETE FROM user_artists WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM events WHERE user_id = $1', [userId]);

        // Delete user
        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        await client.query('COMMIT');

        // Clear auth cookie by setting a very short max-age
        res.cookie('token', '', { httpOnly: true, maxAge: 1 });
        res.json({ message: 'Account successfully deleted' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting account:', err);
        res.status(500).json({ error: 'Server error during deletion' });
    } finally {
        client.release();
    }
};

// POST /api/users/profile-image
export const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        const userId = req.user.id;

        await pool.query('UPDATE users SET profile_image_url = $1 WHERE id = $2', [imageUrl, userId]);

        res.json({ message: 'Profile image updated successfully', profile_image_url: imageUrl });
    } catch (err) {
        console.error('Error uploading profile image:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
