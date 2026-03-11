
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
axios.defaults.withCredentials = true;

const Releases = () => {
    const { user, logout } = useAuth();
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
            toast.success('Release deleted successfully');
        } catch (err) {
            console.error("Failed to delete release:", err);
            toast.error('Failed to delete release');
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
            {/* Header / Nav */}
            <Navbar />

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="bg-[#1a1a1a]/40 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 animate-pulse">
                                <div className="aspect-square w-full bg-white/5"></div>
                                <div className="p-5 relative z-10 bg-[#1a1a1a]/80 backdrop-blur-md -mt-2">
                                    <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                                    <div className="h-5 bg-white/20 rounded w-3/4 mb-2"></div>
                                    <div className="flex gap-2 items-center mt-3">
                                        <div className="size-6 bg-white/5 rounded-full"></div>
                                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: group.data.indexOf(event) * 0.1 }}
                                                    key={event.id}
                                                    className="bg-[#1a1a1a]/40 backdrop-blur-sm rounded-xl overflow-hidden border border-white/5 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(89,242,13,0.15)] transition-all duration-300 group relative"
                                                >
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
                                                </motion.div>
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
