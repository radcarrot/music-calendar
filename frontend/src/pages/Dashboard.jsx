import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [events, setEvents] = useState([]);
    const [trackedArtists, setTrackedArtists] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [formError, setFormError] = useState('');
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        category: 'Album Drop',
        url: '',
        description: ''
    });
    const [searchArtist, setSearchArtist] = useState('');

    const handleTrackArtist = async (e) => {
        if (e.key === 'Enter' && searchArtist.trim()) {
            try {
                const createRes = await axios.post(`${API_URL}/api/artists`, { name: searchArtist.trim() });
                const newArtist = createRes.data;
                await axios.post(`${API_URL}/api/artists/track`, { artist_id: newArtist.id });
                setTrackedArtists([...trackedArtists, newArtist]);
                setSearchArtist('');
            } catch (err) {
                console.error("Failed to track artist:", err);
            }
        }
    };

    const handleCreateEvent = async () => {
        setFormError(''); // Reset errors
        if (!newEvent.title || !newEvent.date) {
            setFormError('Title and Date are required.');
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/api/events`, {
                title: newEvent.title,
                event_date: newEvent.date,
                category: newEvent.category,
                external_url: newEvent.url,
                description: newEvent.description
            });
            const createdEvent = res.data;
            // Normalize for the frontend calendar logic
            createdEvent.date = createdEvent.event_date;
            setEvents([...events, createdEvent]);
            setNewEvent({ title: '', date: '', category: 'Album Drop', url: '', description: '' });
        } catch (err) {
            console.error("Failed to create event:", err);
            setFormError('Failed to create event. Please check your inputs.');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            await axios.delete(`/api/events/${eventId}`);
            setEvents(events.filter(e => e.id !== eventId));
        } catch (err) {
            console.error("Failed to delete event:", err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventsRes, artistsRes] = await Promise.all([
                    axios.get('/api/events'),
                    axios.get('/api/artists/tracked')
                ]);
                setEvents(eventsRes.data);
                setTrackedArtists(artistsRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };
        fetchData();
    }, []);

    // Calendar Generation
    const getCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const days = [];

        const toDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        for (let i = firstDay - 1; i >= 0; i--) {
            const prevM = month === 0 ? 11 : month - 1;
            const prevY = month === 0 ? year - 1 : year;
            days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, dateStr: toDateStr(prevY, prevM, daysInPrevMonth - i) });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, isCurrentMonth: true, dateStr: toDateStr(year, month, i) });
        }
        const totalSlots = days.length > 35 ? 42 : 35;
        let nextMonthDay = 1;
        while (days.length < totalSlots) {
            const nextM = month === 11 ? 0 : month + 1;
            const nextY = month === 11 ? year + 1 : year;
            days.push({ day: nextMonthDay++, isCurrentMonth: false, dateStr: toDateStr(nextY, nextM, nextMonthDay - 1) });
        }
        return days;
    };

    const calendarDays = getCalendarDays();
    const todayDate = new Date();
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

    // Helper formatting to avoid timezone offset issue
    const formatDate = (dateString) => {
        if (!dateString) return '';
        // Extract just the YYYY-MM-DD to avoid JS timezone shifting it back a day
        const ymd = dateString.split('T')[0];
        // Create date at noon so timezone shifts don't cross midnight boundaries
        const date = new Date(`${ymd}T12:00:00`);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col overflow-hidden">

            <header className="w-full border-b border-accent-dark bg-background-dark/95 backdrop-blur-sm z-50">
                <div className="px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 text-primary flex items-center justify-center drop-shadow-neon">
                            <svg className="w-16 h-16 text-primary raccoon-logo" fill="currentColor" viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="
    M12 2
    C6.48 2 2 6.48 2 12
    s4.48 10 10 10
    10-4.48 10-10
    S17.52 2 12 2
    zm0 18
    c-4.41 0-8-3.59-8-8
    s3.59-8 8-8
    8 3.59 8 8
    -3.59 8-8 8
    zm-5-9
    c.83 0 1.5-.67 1.5-1.5
    S7.83 8 7 8
    s-1.5.67-1.5 1.5
    S6.17 11 7 11
    zm10 0
    c.83 0 1.5-.67 1.5-1.5
    S17.83 8 17 8
    s-1.5.67-1.5 1.5
    .67 1.5 1.5 1.5
    zm-5 4
    c2.5 0 4.5-1.5 5.5-3.5
    h-11
    c1 2 3 3.5 5.5 3.5z">
                                </path>
                            </svg>
                        </div>
                        <h2 className="text-primary text-2xl font-bold tracking-tighter text-neon">BEATDROP</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <a className="text-primary text-sm font-medium tracking-wide border-b-2 border-primary pb-1"
                            href="#">Dashboard</a>
                        <a className="text-gray-400 hover:text-primary transition-colors text-sm font-medium tracking-wide"
                            href="#">Artists</a>
                        <a className="text-gray-400 hover:text-primary transition-colors text-sm font-medium tracking-wide"
                            href="#">Releases</a>
                        <a className="text-gray-400 hover:text-primary transition-colors text-sm font-medium tracking-wide"
                            href="#">Settings</a>
                    </nav>
                    <div className="flex items-center gap-6">
                        <button className="relative text-gray-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-0 right-0 size-2 bg-primary rounded-full shadow-neon"></span>
                        </button>
                        <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors flex items-center" title="Log Out">
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                        <div className="size-10 rounded-full bg-cover bg-center border-2 border-accent-dark"
                            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwr5acjO3DQRNF_0dg4wVWaSTAwqBCdtm5Tg-v2U7JErc_yBcdJB1UaFbbd3sG7aYzvh4hZ4vgRvJYRspvX0JSKUPAVfS7sjhu8-j7TP1qNhzCaPUbccPWYrwqWSFBhZ6kI26U_zS3lZe9XbIsw7AvfwAPXHJQDZ8JIwDgN3CE6hURUbu7u3gWd57HHsSiOtOhk-Wh74jsBThy29XyN6wYCxXsfAkw15zGD38nb1nREwmHcrvDU9Lds_ZWdDPZJl3jeAOuZO6bRT7X')` }}>
                        </div>
                    </div>
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 flex flex-col overflow-y-auto bg-background-dark p-6 lg:p-10 relative">
                    <div
                        className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[120px] pointer-events-none rounded-full transform -translate-y-1/2">
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 z-10">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Welcome, <span
                                className="text-primary text-neon">{user?.name || 'User'}</span></h1>
                            <p className="text-gray-400 text-lg">Your release radar is looking active this month.</p>
                        </div>
                        {!user?.google_linked ? (
                            <button
                                onClick={() => window.location.href = "http://localhost:5000/api/auth/google"}
                                className="group flex items-center gap-3 bg-card-dark hover:bg-accent-dark border border-primary/30 text-primary px-6 py-3 rounded-full transition-all duration-300 hover:shadow-neon">
                                <span className="material-symbols-outlined">calendar_today</span>
                                <span className="font-bold tracking-wide">Connect to Google Calendar</span>
                            </button>
                        ) : (
                            <div className="group flex items-center gap-3 bg-primary/10 border border-primary/30 text-primary px-6 py-3 rounded-full transition-all duration-300">
                                <span className="material-symbols-outlined">check_circle</span>
                                <span className="font-bold tracking-wide">Calendar Connected</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between mb-6 z-10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-white tracking-wide">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                    className="p-2 hover:bg-accent-dark rounded-full text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                    className="p-2 hover:bg-accent-dark rounded-full text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="px-4 py-2 text-sm font-medium bg-primary text-black rounded-lg shadow-neon">Month</button>
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-accent-dark rounded-lg transition-colors">Week</button>
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-accent-dark rounded-lg transition-colors">List</button>
                        </div>
                    </div>
                    <div
                        className="flex-1 bg-card-dark rounded-2xl border border-accent-dark p-6 shadow-2xl z-10 flex flex-col min-h-[600px]">
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                                const isTodayWeekDay = new Date().getDay() === index;
                                return (
                                    <div key={day} className={`text-center text-sm font-bold uppercase tracking-wider ${isTodayWeekDay ? 'text-primary' : 'text-gray-500'}`}>
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                        <div className={`grid grid-cols-7 gap-2 flex-1 ${calendarDays.length > 35 ? 'grid-rows-6' : 'grid-rows-5'}`}>
                            {calendarDays.map((dayObj, i) => {
                                const dayEvents = events.filter(e => {
                                    const rawDate = e.date || e.event_date;
                                    const eventDateStr = rawDate ? rawDate.split('T')[0] : null;
                                    return eventDateStr === dayObj.dateStr;
                                });
                                const isToday = dayObj.dateStr === todayStr;
                                return (
                                    <div key={i} className={`p-2 lg:p-3 rounded-xl border border-transparent transition-all relative flex flex-col ${dayObj.isCurrentMonth ? 'bg-accent-dark/50 hover:border-primary/30 cursor-pointer group' : 'bg-background-dark/30 text-gray-700 pointer-events-none'} ${isToday ? '!border-primary/40 shadow-[inset_0_0_10px_rgba(6,249,67,0.1)]' : ''}`}>
                                        <span className={`${dayObj.isCurrentMonth ? 'text-gray-300 font-medium group-hover:text-white' : 'text-gray-700'} ${isToday ? '!text-primary font-bold' : ''}`}>
                                            {dayObj.day}
                                        </span>
                                        {isToday && <div className="absolute top-2 right-2 size-2 bg-primary rounded-full shadow-neon animate-pulse"></div>}

                                        <div className="mt-1 flex flex-col gap-1 overflow-y-auto w-full max-h-[60px] md:max-h-full scrollbar-none">
                                            {dayEvents.map(event => (
                                                <div key={event.id} className="w-full bg-primary/20 border-l-2 border-primary p-0.5 lg:p-1 rounded-sm flex items-center justify-between group/event relative">
                                                    <p className="text-[9px] lg:text-[10px] text-primary truncate font-bold pr-1" title={event.title}>{event.title}</p>
                                                    {event.google_calendar_event_id && (
                                                        <span className="material-symbols-outlined text-[10px] text-blue-400 shrink-0" title="Synced to Google Calendar">cloud_done</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="mt-8 bg-card-dark border border-accent-dark rounded-2xl p-6 relative overflow-hidden z-10">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 blur-xl rounded-full"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-neon">edit_calendar</span>
                                New Event
                            </h3>
                            <button onClick={() => { setIsEventModalOpen(false); setFormError(''); }} className="text-gray-500 hover:text-white"><span
                                className="material-symbols-outlined">close</span></button>
                        </div>

                        {formError && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {formError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-gray-400 text-sm font-medium mb-1 block">Event Title</span>
                                    <input
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                                        placeholder="e.g., Late Night Release" type="text" />
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="block">
                                        <span className="text-gray-400 text-sm font-medium mb-1 block">Date</span>
                                        <input
                                            value={newEvent.date}
                                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                            className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none [color-scheme:dark]"
                                            type="date" />
                                    </label>
                                    <label className="block">
                                        <span className="text-gray-400 text-sm font-medium mb-1 block">Category</span>
                                        <select
                                            value={newEvent.category}
                                            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                                            className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none">
                                            <option value="Album Drop">Album Drop</option>
                                            <option value="Single">Single</option>
                                            <option value="Concert">Concert</option>
                                            <option value="Interview">Interview</option>
                                        </select>
                                    </label>
                                </div>
                                <label className="block">
                                    <span className="text-gray-400 text-sm font-medium mb-1 block">Streaming URL</span>
                                    <div
                                        className="flex items-center bg-background-dark border border-accent-dark rounded-xl px-4 py-3 focus-within:border-primary">
                                        <span className="material-symbols-outlined text-gray-500 text-sm mr-2">link</span>
                                        <input
                                            value={newEvent.url}
                                            onChange={(e) => setNewEvent({ ...newEvent, url: e.target.value })}
                                            className="bg-transparent w-full text-white outline-none"
                                            placeholder="https://spotify.com/..." type="url" />
                                    </div>
                                </label>
                            </div>
                            <div className="space-y-4">
                                <label className="block h-full flex flex-col">
                                    <span className="text-gray-400 text-sm font-medium mb-1 block">Description</span>
                                    <textarea
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        className="w-full flex-1 bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none resize-none"
                                        placeholder="Add release notes or venue details..."></textarea>
                                </label>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-accent-dark">
                            <span className="text-gray-400 text-sm font-medium mb-3 block">Tagged Artists</span>
                            <div className="flex items-center gap-2">
                                <div
                                    className="flex items-center gap-2 bg-accent-dark px-3 py-1.5 rounded-full border border-primary/20">
                                    <div className="size-6 bg-gray-600 rounded-full bg-cover"
                                        style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBzwPl1DcmJHlbaDi8P5C1_RUb3QPCzPnPcCX57Ee6pCzTS3vzMOULgUNXWvT-emHVoMngyYGcmtWpsF4ATprQewMCZo8e5PmU1BIV0ahQNoVEAVgwPuQYox1WaSDb2uuQU8xQ-HtLga2eoeV-y_qi2vytOHZ1Kas8nx7XTv9nKvfnnQ27NTEhJK4SZHds0sMA4x2tuP7mTo1iCiE2zrWczXTqhzx6iSoTInsWx5QOCUO6TLYKdmfrNTCvwYqbagQ4Y-MGEKeMZLBWd')` }}>
                                    </div>
                                    <span className="text-sm text-white">Drake</span>
                                    <button className="text-gray-400 hover:text-white"><span
                                        className="material-symbols-outlined text-sm">close</span></button>
                                </div>
                                <button
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-sm transition-colors">
                                    <span className="material-symbols-outlined text-sm">add</span> Add Artist
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                className="px-6 py-2.5 rounded-xl text-gray-300 font-medium hover:bg-accent-dark transition-colors">Cancel</button>
                            <button
                                onClick={handleCreateEvent}
                                className="px-8 py-2.5 rounded-xl bg-primary text-black font-bold hover:shadow-neon transition-shadow">Save
                                Event</button>
                        </div>
                    </div>
                </main>
                <aside className="w-80 lg:w-96 bg-[#111] border-l border-accent-dark p-6 flex flex-col gap-8 overflow-y-auto">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold text-lg tracking-wide">Upcoming Soon</h3>
                            <a className="text-xs text-primary hover:underline text-neon" href="#">View All</a>
                        </div>
                        <div className="space-y-4">
                            {events.slice(0, 5).map(event => (
                                <div key={event.id}
                                    className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl hover:bg-accent-dark transition-colors">
                                    <div className="relative size-16 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-gray-800 flex items-center justify-center text-gray-600">
                                        {event.cover_url ? (
                                            <img alt="Album Art"
                                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                                src={event.cover_url} />
                                        ) : (
                                            <span className="material-symbols-outlined">music_note</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-bold text-sm leading-tight group-hover:text-primary transition-colors truncate">
                                                {event.title}
                                            </p>
                                            {event.google_calendar_event_id && (
                                                <span className="material-symbols-outlined text-[12px] text-blue-400" title="Synced to Google Calendar">cloud_done</span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-xs mt-1 truncate">{event.category || 'Event'}</p>
                                        <p className="text-primary text-xs mt-1 font-mono text-neon">{formatDate(event.date || event.event_date)}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all shrink-0">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            ))}
                            {events.length === 0 && <p className="text-gray-500 text-sm">No upcoming events.</p>}
                        </div>
                    </section>
                    <section className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold text-lg tracking-wide">Tracked Artists</h3>
                            <button className="text-gray-500 hover:text-white"><span
                                className="material-symbols-outlined">more_horiz</span></button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {trackedArtists.map(artist => (
                                <div key={artist.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                                    <div
                                        className="size-14 rounded-full p-[2px] bg-gradient-to-tr from-gray-700 to-transparent group-hover:from-primary group-hover:to-primary transition-all">
                                        <div className="size-full rounded-full border-2 border-[#111] overflow-hidden bg-gray-800 flex items-center justify-center text-gray-600">
                                            {artist.image_url ? (
                                                <img alt="Artist" className="w-full h-full object-cover" src={artist.image_url} />
                                            ) : (
                                                <span className="material-symbols-outlined text-xl">person</span>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className="text-[10px] text-gray-400 font-medium text-center truncate w-full group-hover:text-white">{artist.name}</span>
                                </div>
                            ))}
                            {trackedArtists.length === 0 && <p className="text-gray-500 text-xs col-span-4 text-center">No tracked artists yet.</p>}
                        </div>
                    </section>
                    <div className="mt-auto pt-6 border-t border-accent-dark">
                        <label className="block relative group">
                            <span
                                className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined">search</span>
                            </span>
                            <input
                                value={searchArtist}
                                onChange={(e) => setSearchArtist(e.target.value)}
                                onKeyDown={handleTrackArtist}
                                className="w-full bg-background-dark border border-accent-dark rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                                placeholder="Track new artist... (Hit Enter)" type="text" />
                        </label>
                    </div>
                </aside>
            </div>


        </div>
    );
};

export default Dashboard;
