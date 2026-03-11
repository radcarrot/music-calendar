import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
axios.defaults.withCredentials = true;

const Settings = () => {
    const { user, logout } = useAuth();

    // States for integrations and preferences
    const [spotifyConnected, setSpotifyConnected] = useState(false);
    const [spotifyUsername, setSpotifyUsername] = useState('');
    const [googleCalendarSync, setGoogleCalendarSync] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [artistTrackingPush, setArtistTrackingPush] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [isUploadingIcon, setIsUploadingIcon] = useState(false);
    const fileInputRef = useRef(null);

    // Modal States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        // Fetch User Profile Preferences and Spotify Connection Status
        const fetchIntegrations = async () => {
            try {
                const [spotifyRes, profileRes] = await Promise.all([
                    axios.get(`${API_URL}/api/spotify/status`),
                    axios.get(`${API_URL}/api/users/profile`)
                ]);

                if (spotifyRes.data.connected) {
                    setSpotifyConnected(true);
                    setSpotifyUsername(spotifyRes.data.spotify_id || 'Authenticated User');
                }

                if (profileRes.data) {
                    const data = profileRes.data;
                    setGoogleCalendarSync(data.google_sync_enabled ?? true);
                    setEmailAlerts(data.email_alerts ?? true);
                    setArtistTrackingPush(data.push_alerts ?? false);
                    if (data.profile_image_url) {
                        setProfileImage(data.profile_image_url);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };

        fetchIntegrations();
    }, []);

    const handleSpotifyDisconnect = async () => {
        try {
            await axios.post(`${API_URL}/api/spotify/disconnect`);
            setSpotifyConnected(false);
            setSpotifyUsername('');
            toast.success('Spotify disconnected successfully');
        } catch (err) {
            console.error("Failed to disconnect Spotify", err);
            // Fallback for UI if endpoint not implemented yet
            setSpotifyConnected(false);
            toast.error('Failed to disconnect Spotify account');
        }
    };

    const updatePreference = async (key, value) => {
        try {
            await axios.put(`${API_URL}/api/users/preferences`, {
                [key]: value
            });
            toast.success('Preference updated');
        } catch (err) {
            console.error(`Failed to update ${key}`, err);
            toast.error('Failed to save preference');
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        try {
            await axios.put(`${API_URL}/api/users/password`, { currentPassword, newPassword });
            setPasswordSuccess('Password updated successfully!');
            setTimeout(() => {
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setPasswordSuccess('');
            }, 2000);
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Failed to update password');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`${API_URL}/api/users/profile`);
            logout(); // Context will handle redirecting to login
        } catch (err) {
            setDeleteError(err.response?.data?.error || 'Failed to delete account');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingIcon(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await axios.post(`${API_URL}/api/users/profile-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfileImage(res.data.profile_image_url);
            toast.success('Profile avatar updated');
        } catch (err) {
            console.error('Failed to upload profile image:', err);
            toast.error('Failed to upload image. Must be under 5MB.');
        } finally {
            setIsUploadingIcon(false);
            e.target.value = ''; // Reset input to allow re-uploading the same file if needed
        }
    };

    const handleGoogleSyncToggle = () => {
        const newVal = !googleCalendarSync;
        setGoogleCalendarSync(newVal);
        updatePreference('google_sync_enabled', newVal);
    };

    const handleEmailAlertsToggle = () => {
        const newVal = !emailAlerts;
        setEmailAlerts(newVal);
        updatePreference('email_alerts', newVal);
    };

    const handlePushAlertsToggle = () => {
        const newVal = !artistTrackingPush;
        setArtistTrackingPush(newVal);
        updatePreference('push_alerts', newVal);
    };

    return (
        <div className="bg-[#0a0a0a] text-slate-100 font-display min-h-screen flex flex-col overflow-x-hidden">
            {/* Header / Nav */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 space-y-10 animate-in fade-in duration-700">
                <header>
                    <h2 className="text-4xl font-black text-white tracking-tight">Settings & Integrations</h2>
                    <p className="text-slate-400 mt-2">Manage your profile, connected services, and preferences.</p>
                </header>

                {/* Profile Section */}
                <section className="bg-[#1a1a1a]/40 backdrop-blur-md border border-white/5 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="size-24 rounded-full border-2 border-[#59f20d]/30 p-1 group-hover:border-[#59f20d] transition-all duration-300">
                                {profileImage ? (
                                    <div className="size-full rounded-full overflow-hidden bg-slate-800">
                                        <img src={`${API_URL}${profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="size-full rounded-full bg-slate-800 flex items-center justify-center text-4xl text-slate-500 overflow-hidden">
                                        <span className="material-symbols-outlined text-4xl">person</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingIcon}
                                className="absolute bottom-0 right-0 bg-[#59f20d] text-[#0a0a0a] p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 cursor-pointer">
                                {isUploadingIcon ? (
                                    <span className="material-symbols-outlined text-sm font-bold animate-spin">sync</span>
                                ) : (
                                    <span className="material-symbols-outlined text-sm font-bold">edit</span>
                                )}
                            </button>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{user?.username || 'User Profile'}</h3>
                            <p className="text-slate-400">{user?.email || 'user@example.com'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-6 py-2.5 rounded-lg border border-[#59f20d]/40 text-[#59f20d] text-sm font-bold hover:bg-[#59f20d]/10 transition-all hover:shadow-[0_0_15px_rgba(89,242,13,0.3)]">
                        Reset Password
                    </button>
                </section>

                {/* Connected Accounts */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#59f20d]">extension</span>
                        Connected Accounts
                    </h3>
                    <div className="bg-[#1a1a1a]/40 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">

                        {/* Spotify Integration */}
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-lg bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954]">
                                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.215.353-.673.464-1.026.249-2.845-1.738-6.427-2.13-10.647-1.166-.403.093-.806-.157-.899-.56-.093-.404.157-.806.561-.899 4.622-1.056 8.577-.613 11.762 1.334.353.215.464.673.249 1.026zm1.467-3.258c-.271.44-.846.578-1.287.307-3.257-2.003-8.223-2.583-12.074-1.414-.495.15-1.02-.128-1.17-.623s.128-1.02.623-1.17c4.407-1.338 9.883-.687 13.601 1.599.44.271.578.847.307 1.288zm.127-3.385c-3.906-2.319-10.334-2.533-14.079-1.396-.599.182-1.229-.164-1.411-.763s.164-1.23.763-1.411c4.303-1.306 11.404-1.05 15.934 1.64.538.319.716 1.015.397 1.553-.319.539-1.015.717-1.554.398l-.05-.02z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Spotify Sync</h4>
                                    <p className="text-sm text-slate-400">
                                        {spotifyConnected ? `Connected as ${spotifyUsername}` : 'Not connected to Spotify'}
                                    </p>
                                </div>
                            </div>

                            {spotifyConnected ? (
                                <button
                                    onClick={handleSpotifyDisconnect}
                                    className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                    Disconnect
                                </button>
                            ) : (
                                <a
                                    href={`${API_URL}/api/auth/spotify`}
                                    className="text-sm font-medium text-[#1DB954] hover:text-[#1DB954] px-4 py-2 rounded-lg border border-[#1DB954]/30 bg-[#1DB954]/10 hover:bg-[#1DB954]/20 transition-all">
                                    Connect
                                </a>
                            )}
                        </div>

                        {/* Google Calendar */}
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <span className="material-symbols-outlined">calendar_month</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Google Calendar</h4>
                                    <p className="text-sm text-slate-400">Auto-sync releases to native calendar</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={googleCalendarSync}
                                    onChange={handleGoogleSyncToggle}
                                />
                                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#59f20d] shadow-[0_0_10px_rgba(89,242,13,0.2)]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#59f20d]">notifications_active</span>
                        Notification Preferences
                    </h3>
                    <div className="bg-[#1a1a1a]/40 backdrop-blur-md border border-white/5 rounded-xl divide-y divide-white/5">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-white">Email Alerts</h4>
                                <p className="text-sm text-slate-400">Receive summaries for upcoming music drops</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={emailAlerts}
                                    onChange={handleEmailAlertsToggle}
                                />
                                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#59f20d]"></div>
                            </label>
                        </div>
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-white">Artist Tracking</h4>
                                <p className="text-sm text-slate-400">Push notifications for tracked artists' activity</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={artistTrackingPush}
                                    onChange={handlePushAlertsToggle}
                                />
                                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#59f20d]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-8 pb-12">
                    <div className="bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h4 className="text-lg font-bold text-red-500">Danger Zone</h4>
                            <p className="text-sm text-slate-400">Permanently delete your account and all associated data.</p>
                        </div>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-6 py-2.5 rounded-lg border border-red-500/40 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                            Delete Account
                        </button>
                    </div>
                </div>
            </main>

            {/* Password Reset Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-[#1a1a1a] border border-[#59f20d]/20 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h3 className="text-2xl font-bold text-white mb-6">Change Password</h3>

                        {passwordError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded flex items-center gap-2 text-red-500 text-sm">
                                <span className="material-symbols-outlined text-sm">cancel</span>
                                {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="mb-4 p-3 bg-[#59f20d]/10 border border-[#59f20d]/50 rounded flex items-center gap-2 text-[#59f20d] text-sm">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                {passwordSuccess}
                            </div>
                        )}

                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#59f20d] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#59f20d] transition-colors"
                                    minLength={6}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full mt-2 bg-[#59f20d] text-[#0a0a0a] font-bold py-3 rounded-lg hover:shadow-[0_0_15px_rgba(89,242,13,0.4)] transition-all"
                            >
                                Update Password
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-red-950/40 border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center">
                        <div className="size-16 mx-auto bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Delete Account?</h3>
                        <p className="text-sm text-red-200 mb-6 font-medium">
                            This action is permanent. All of your tracked artists,
                            events, and settings will be wiped immediately from our servers.
                        </p>

                        {deleteError && (
                            <div className="mb-4 text-red-500 text-sm font-bold">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 rounded-lg border border-white/20 text-white font-bold hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
