import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
axios.defaults.withCredentials = true;

const Releases = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/events`);
                setEvents(res.data || []);
            } catch (err) {
                console.error("Failed to fetch events:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleDelete = async (eventId) => {
        try {
            await axios.delete(`${API_URL}/api/events/${eventId}`);
            setEvents(prev => prev.filter(e => e.id !== eventId));
        } catch (err) {
            console.error("Failed to delete release:", err);
        }
    };

    const getTimelineGroups = () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + 7);

        const endOfMonth = new Date(now);
        endOfMonth.setMonth(now.getMonth() + 1);

        const groups = {
            "This Week": [],
            "Next Month": [],
            "Upcoming": [],
            "To Be Announced": [],
            "Past": []
        };

        const filteredEvents = events.filter(event =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.artists && event.artists.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())))
        );

        filteredEvents.forEach(event => {
            // Some events might not have a solid date if they are TBA, but DB requires a date right now.
            // We'll classify based on event_date
            if (!event.event_date) {
                groups["To Be Announced"].push(event);
                return;
            }

            const eventDate = new Date(event.event_date);
            if (eventDate < now) {
                groups["Past"].push(event);
            } else if (eventDate <= endOfWeek) {
                groups["This Week"].push(event);
            } else if (eventDate <= endOfMonth) {
                groups["Next Month"].push(event);
            } else {
                groups["Upcoming"].push(event);
            }
        });

        return groups;
    };

    const groups = getTimelineGroups();
    // Only show groups that have items, prioritize upcoming
    const visibleGroups = [
        { label: "This Week", data: groups["This Week"] },
        { label: "Next Month", data: groups["Next Month"] },
        { label: "Upcoming", data: groups["Upcoming"] },
        { label: "To Be Announced", data: groups["To Be Announced"] }
    ].filter(g => g.data.length > 0);

    const formatShortDate = (dateString) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="bg-[#0a0a0a] text-slate-100 font-display min-h-screen flex flex-col overflow-x-hidden group/design-root">
            {/* Header */}
            <header className="w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md z-50 sticky top-0">
                <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 lg:px-12">
                    <div className="flex items-center gap-2">
                        <div className="size-8">
                            <svg className="w-full h-full text-primary" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 4c2.5 0 4.5-1.5 5.5-3.5h-11c1 2 3 3.5 5.5 3.5z" />
                            </svg>
                        </div>
                        <h2 className="text-white text-lg font-bold tracking-tight uppercase">BeatDrop</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/dashboard" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Dashboard</Link>
                        <Link to="/artists" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Artists</Link>
                        <Link to="/releases" className="text-sm font-bold text-primary border-b-2 border-primary pb-1">Releases</Link>
                        <Link to="/settings" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Settings</Link>
                    </nav>
                    <div className="flex items-center gap-6">
                        <button className="relative text-gray-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                            <span className="absolute top-0 right-0 size-2 bg-primary rounded-full shadow-[0_0_10px_rgba(89,242,13,0.8)]"></span>
                        </button>
                        <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors flex items-center" title="Log Out">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto w-full p-6 lg:p-12 pb-24 flex-1">
                {/* Search Bar / Title */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-white tracking-tight text-3xl md:text-4xl font-bold leading-tight">Upcoming Releases</h1>
                    <div className="w-full md:w-96">
                        <label className="relative group flex items-center h-12">
                            <span className="material-symbols-outlined absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            <input
                                className="w-full bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 rounded-xl h-full pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium shadow-lg"
                                placeholder="Search releases or artists..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </label>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                        <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-4">refresh</span>
                        <p>Loading releases...</p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {visibleGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center p-20 border border-dashed border-white/10 rounded-2xl bg-[#111]/50">
                                <span className="material-symbols-outlined text-5xl mb-4 text-slate-600">album</span>
                                <h3 className="text-xl font-bold text-white mb-2">No upcoming releases found</h3>
                                <p className="text-slate-400 max-w-md">You don't have any matching upcoming releases. Add more events to your calendar or track new artists.</p>
                            </div>
                        ) : (
                            visibleGroups.map(group => (
                                <section key={group.label} className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${visibleGroups.indexOf(group) * 100}ms` }}>
                                    <div className="flex items-center gap-4 mb-8">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">{group.label}</h2>
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {group.data.map(event => {
                                            // Get first artist image if available
                                            const primaryArtist = event.artists && event.artists.length > 0 ? event.artists[0] : null;
                                            const imageUrl = primaryArtist?.image_url;
                                            const artistName = primaryArtist?.name || 'Various Artists';

                                            return (
                                                <div key={event.id} className="bg-[#1a1a1a]/40 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(89,242,13,0.15)] transition-all duration-300 group relative">
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(event.id); }}
                                                        className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-black/90 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md cursor-pointer border border-white/5 hover:border-red-500/30"
                                                        title="Delete Release"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>

                                                    <div className="aspect-square w-full bg-[#111] relative overflow-hidden">
                                                        {imageUrl ? (
                                                            <img src={imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 group-hover:text-slate-500 transition-colors">
                                                                <span className="material-symbols-outlined text-4xl mb-2">album</span>
                                                            </div>
                                                        )}
                                                        {/* Optional Gradient Overlay for text readability if we placed text over image */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80"></div>
                                                    </div>

                                                    <div className="p-5 relative z-10 bg-[#1a1a1a]/80 backdrop-blur-md -mt-2">
                                                        <div className="flex justify-between items-start mb-3 gap-2">
                                                            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20 truncate max-w-[120px]">
                                                                {event.category || 'Release'}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                                                {formatShortDate(event.event_date)}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-white text-lg leading-tight truncate" title={event.title}>{event.title}</h3>
                                                        <p className="text-sm text-slate-400 font-medium truncate mt-1" title={artistName}>{artistName}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Releases;
