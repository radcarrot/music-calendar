import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

const API_URL = import.meta.env.VITE_API_URL || '';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [events, setEvents] = useState([]);
    const [trackedArtists, setTrackedArtists] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarView, setCalendarView] = useState('month'); // 'month', 'week', 'list'
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const newEventFormRef = useRef(null);

    const [formError, setFormError] = useState('');
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        category: 'Album Drop',
        url: '',
        description: '',
        start_time: '',
        end_time: ''
    });
    const [searchArtist, setSearchArtist] = useState('');

    // Spotify state
    const [spotifyConnected, setSpotifyConnected] = useState(false);
    const [topArtists, setTopArtists] = useState([]);

    // Spotify search for event tagging
    const [artistSearchQuery, setArtistSearchQuery] = useState('');
    const [artistSearchResults, setArtistSearchResults] = useState([]);
    const [taggedArtists, setTaggedArtists] = useState([]);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => { mountedRef.current = false; };
    }, []);

    // Fetch Spotify status + top artists
    useEffect(() => {
        const fetchSpotifyData = async () => {
            try {
                const statusRes = await axios.get('/api/spotify/status');
                setSpotifyConnected(statusRes.data.connected);

                if (statusRes.data.connected) {
                    const topRes = await axios.get('/api/spotify/top-artists');
                    setTopArtists(topRes.data);
                }
            } catch (err) {
                console.error('Failed to fetch Spotify data:', err);
            }
        };
        fetchSpotifyData();
    }, []);

    // Debounced Spotify artist search
    const handleArtistSearch = (value) => {
        setArtistSearchQuery(value);
        if (searchTimeout) clearTimeout(searchTimeout);

        if (value.trim().length < 2) {
            setArtistSearchResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const res = await axios.get(`/api/spotify/search?q=${encodeURIComponent(value.trim())}`);
                if (mountedRef.current) setArtistSearchResults(res.data);
            } catch (err) {
                console.error('Artist search error:', err);
            }
        }, 300);
        setSearchTimeout(timeout);
    };

    const handleTagArtist = (artist) => {
        if (!taggedArtists.find(a => a.spotify_id === artist.spotify_id)) {
            setTaggedArtists([...taggedArtists, artist]);
        }
        setArtistSearchQuery('');
        setArtistSearchResults([]);
    };

    const handleRemoveTag = (spotifyId) => {
        setTaggedArtists(taggedArtists.filter(a => a.spotify_id !== spotifyId));
    };

    // Track a Spotify artist (add to tracked artists DB)
    const handleTrackSpotifyArtist = async (artist) => {
        try {
            // Create artist in DB if not exists
            const createRes = await axios.post(`${API_URL}/api/artists`, {
                name: artist.name,
                spotify_id: artist.spotify_id,
                image_url: artist.image_url,
                genres: artist.genres
            });
            const newArtist = createRes.data;
            // Track the artist
            await axios.post(`${API_URL}/api/artists/track`, { artist_id: newArtist.id });
            setTrackedArtists(prev => {
                if (prev.find(a => a.id === newArtist.id)) return prev;
                return [...prev, newArtist];
            });
            toast.success(`Tracked ${newArtist.name} successfully`);
        } catch (err) {
            console.error("Failed to track artist:", err);
            toast.error("Failed to track artist");
        }
    };

    const handleTrackArtist = async (e) => {
        if (e.key === 'Enter' && searchArtist.trim()) {
            try {
                const createRes = await axios.post(`${API_URL}/api/artists`, { name: searchArtist.trim() });
                const newArtist = createRes.data;
                await axios.post(`${API_URL}/api/artists/track`, { artist_id: newArtist.id });
                setTrackedArtists([...trackedArtists, newArtist]);
                setSearchArtist('');
                toast.success(`Now tracking ${newArtist.name}`);
            } catch (err) {
                console.error("Failed to track artist:", err);
                toast.error("Failed to track artist");
            }
        }
    };

    const handleDateClick = (dateStr) => {
        if (!dateStr) return;
        setNewEvent(prev => ({ ...prev, date: dateStr }));
        if (newEventFormRef.current) {
            // Include a small timeout to allow state changes to apply and for smooth scrolling
            setTimeout(() => {
                newEventFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        }
    };

    const handleCreateEvent = async () => {
        setFormError('');
        if (!newEvent.title || !newEvent.date) {
            setFormError('Title and Date are required.');
            return;
        }

        try {
            // Collect artist IDs from tagged artists (create in DB if needed)
            const artistIds = [];
            for (const artist of taggedArtists) {
                try {
                    const createRes = await axios.post(`${API_URL}/api/artists`, {
                        name: artist.name,
                        spotify_id: artist.spotify_id,
                        image_url: artist.image_url,
                        genres: artist.genres
                    });
                    artistIds.push(createRes.data.id);
                } catch (e) {
                    console.error('Error creating artist for tag:', e);
                }
            }

            const res = await axios.post(`${API_URL}/api/events`, {
                title: newEvent.title,
                event_date: newEvent.date,
                category: newEvent.category,
                external_url: newEvent.url,
                description: newEvent.description,
                start_time: newEvent.start_time || null,
                end_time: newEvent.end_time || null,
                artist_ids: artistIds
            });
            const createdEvent = res.data;
            createdEvent.date = createdEvent.event_date;
            setEvents([...events, createdEvent]);
            setNewEvent({ title: '', date: '', category: 'Album Drop', url: '', description: '', start_time: '', end_time: '' });
            setTaggedArtists([]);
            toast.success('Event saved successfully');
        } catch (err) {
            console.error("Failed to create event:", err);
            setFormError('Failed to create event. Please check your inputs.');
            toast.error('Failed to create event');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            await axios.delete(`/api/events/${eventId}`);
            setEvents(events.filter(e => e.id !== eventId));
            toast.success('Event removed from calendar');
        } catch (err) {
            console.error("Failed to delete event:", err);
            toast.error('Failed to delete event');
        }
    };

    const handleStartEdit = (event) => {
        setEditForm({
            title: event.title || '',
            date: event.event_date || event.date || '',
            category: event.category || 'Album Drop',
            url: event.external_url || '',
            description: event.description || '',
            start_time: event.start_time ? event.start_time.slice(0, 5) : '',
            end_time: event.end_time ? event.end_time.slice(0, 5) : '',
            artist_ids: (event.artists || []).map(a => a.id),
        });
        setIsEditingEvent(true);
    };

    const handleUpdateEvent = async () => {
        if (!editForm.title || !editForm.date) {
            toast.error('Title and date are required');
            return;
        }
        try {
            const res = await axios.put(`/api/events/${selectedEvent.id}`, {
                title: editForm.title,
                event_date: editForm.date,
                category: editForm.category,
                external_url: editForm.url || null,
                description: editForm.description || null,
                start_time: editForm.start_time || null,
                end_time: editForm.end_time || null,
                artist_ids: editForm.artist_ids,
            });
            const updated = res.data;
            setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
            setSelectedEvent(updated);
            setIsEditingEvent(false);
            toast.success('Event updated');
        } catch (err) {
            console.error('Failed to update event:', err);
            toast.error('Failed to update event');
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

    const getCalendarWeek = () => {
        // currentMonth state acts as our 'current viewed date' anchor
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const date = currentMonth.getDate();

        // Find the Sunday of the current week
        const dayOfWeek = currentMonth.getDay();
        const sunday = new Date(year, month, date - dayOfWeek);

        const days = [];
        const toDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
            days.push({
                day: currentDay.getDate(),
                isCurrentMonth: currentDay.getMonth() === month, // true if it matches the anchor month
                dateStr: toDateStr(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate()),
                fullDate: currentDay
            });
        }
        return days;
    };

    const calendarDays = getCalendarDays();
    const calendarWeek = getCalendarWeek();

    const todayDate = new Date();
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const ymd = dateString.split('T')[0];
        const date = new Date(`${ymd}T12:00:00`);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col overflow-hidden">


            {/* Header / Nav */}
            <Navbar />

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 flex flex-col overflow-y-auto bg-background-dark p-4 sm:p-6 lg:p-10 pb-24 md:pb-10 relative">
                    <div
                        className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[120px] pointer-events-none rounded-full transform -translate-y-1/2">
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 sm:mb-10 z-10">
                        <div>
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-1 tracking-tighter uppercase italic leading-none">
                                Welcome, <span className="text-primary drop-shadow-[0_0_8px_rgba(89,242,13,0.6)]">{user?.name || 'User'}</span>
                            </h1>
                            <p className="text-slate-400 text-sm sm:text-base font-mono">Your release radar is looking active this month.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {!user?.google_linked ? (
                                <button
                                    onClick={() => window.location.href = '/api/auth/google'}
                                    className="group flex items-center gap-3 bg-card-dark hover:bg-accent-dark border border-primary/30 text-primary px-5 py-2.5 rounded-full transition-all duration-300 hover:shadow-neon">
                                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                                    <span className="font-bold tracking-wide text-sm">Connect Google</span>
                                </button>
                            ) : (
                                <div className="group flex items-center gap-3 bg-primary/10 border border-primary/30 text-primary px-5 py-2.5 rounded-full">
                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                    <span className="font-bold tracking-wide text-sm">Calendar Connected</span>
                                </div>
                            )}

                            {!spotifyConnected ? (
                                <a
                                    href="/api/auth/spotify"
                                    className="group flex items-center gap-3 bg-card-dark hover:bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] px-5 py-2.5 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(29,185,84,0.3)]">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
                                    </svg>
                                    <span className="font-bold tracking-wide text-sm">Connect Spotify</span>
                                </a>
                            ) : (
                                <div className="group flex items-center gap-3 bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] px-5 py-2.5 rounded-full">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
                                    </svg>
                                    <span className="font-bold tracking-wide text-sm">Spotify Connected</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 z-10">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-wide">
                                {calendarView === 'week'
                                    ? `${calendarWeek[0].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${calendarWeek[6].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                    : currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        if (calendarView === 'week') {
                                            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() - 7));
                                        } else {
                                            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                                        }
                                    }}
                                    className="p-2 hover:bg-accent-dark rounded-full text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (calendarView === 'week') {
                                            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() + 7));
                                        } else {
                                            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                                        }
                                    }}
                                    className="p-2 hover:bg-accent-dark rounded-full text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCalendarView('month')}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${calendarView === 'month' ? 'bg-primary text-black shadow-neon' : 'text-gray-400 hover:text-white hover:bg-accent-dark'}`}>Month</button>
                            <button
                                onClick={() => setCalendarView('week')}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${calendarView === 'week' ? 'bg-primary text-black shadow-neon' : 'text-gray-400 hover:text-white hover:bg-accent-dark'}`}>Week</button>
                            <button
                                onClick={() => setCalendarView('list')}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${calendarView === 'list' ? 'bg-primary text-black shadow-neon' : 'text-gray-400 hover:text-white hover:bg-accent-dark'}`}>List</button>
                        </div>
                    </div>
                    <div
                        className={`bg-card-dark rounded-2xl border border-accent-dark p-3 sm:p-6 shadow-2xl z-10 flex flex-col overflow-hidden ${calendarView === 'week' ? 'min-h-[300px] sm:min-h-[350px] mb-8' : 'flex-1 min-h-[320px] sm:min-h-[500px]'}`}>

                        {/* MONTH VIEW */}
                        {calendarView === 'month' && (
                            <>
                                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                                    {[['S','Sun'], ['M','Mon'], ['T','Tue'], ['W','Wed'], ['T','Thu'], ['F','Fri'], ['S','Sat']].map(([short, full], index) => {
                                        const isTodayWeekDay = new Date().getDay() === index;
                                        return (
                                            <div key={full} className={`text-center text-[10px] sm:text-sm font-bold uppercase tracking-wider ${isTodayWeekDay ? 'text-primary' : 'text-gray-500'}`}>
                                                <span className="sm:hidden">{short}</span>
                                                <span className="hidden sm:inline">{full}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className={`grid grid-cols-7 gap-1 sm:gap-2 flex-1 ${calendarDays.length > 35 ? 'grid-rows-6' : 'grid-rows-5'}`}>
                                    {calendarDays.map((dayObj, i) => {
                                        const dayEvents = events.filter(e => {
                                            const rawDate = e.date || e.event_date;
                                            const eventDateStr = rawDate ? rawDate.split('T')[0] : null;
                                            return eventDateStr === dayObj.dateStr;
                                        });
                                        const isToday = dayObj.dateStr === todayStr;
                                        return (
                                            <div key={i}
                                                onClick={() => dayObj.isCurrentMonth && handleDateClick(dayObj.dateStr)}
                                                className={`p-1 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl border border-transparent transition-all relative flex flex-col ${dayObj.isCurrentMonth ? 'bg-accent-dark/50 hover:border-primary/30 cursor-pointer group' : 'bg-background-dark/30 text-gray-700 pointer-events-none'} ${isToday ? '!border-primary/40 shadow-[inset_0_0_10px_rgba(6,249,67,0.1)]' : ''}`}>
                                                <span className={`text-[11px] sm:text-sm ${dayObj.isCurrentMonth ? 'text-gray-300 font-medium group-hover:text-white' : 'text-gray-700'} ${isToday ? '!text-primary font-bold' : ''}`}>
                                                    {dayObj.day}
                                                </span>
                                                {isToday && <div className="absolute top-1 right-1 sm:top-2 sm:right-2 size-1.5 sm:size-2 bg-primary rounded-full shadow-neon animate-pulse"></div>}

                                                {/* Mobile: show dots for events */}
                                                <div className="sm:hidden mt-1 flex flex-wrap gap-0.5 justify-center">
                                                    {dayEvents.slice(0, 3).map(event => (
                                                        <div key={event.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                                            className="size-1.5 rounded-full bg-primary cursor-pointer" />
                                                    ))}
                                                </div>

                                                {/* Desktop: show event labels */}
                                                <div className="hidden sm:flex mt-1 flex-col gap-1 overflow-y-auto w-full max-h-[60px] md:max-h-full scrollbar-none">
                                                    {dayEvents.map(event => (
                                                        <div key={event.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                                            className="w-full bg-primary/20 border-l-2 border-primary p-0.5 lg:p-1 rounded-sm flex items-center justify-between cursor-pointer hover:bg-primary/30 transition-colors">
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
                            </>
                        )}

                        {/* WEEK VIEW */}
                        {calendarView === 'week' && (
                            <>
                                <div className="grid grid-cols-7 gap-2 mb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                                        return (
                                            <div key={day} className={`text-center text-sm font-bold uppercase tracking-wider text-gray-500`}>
                                                {day}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="grid grid-cols-7 gap-2 flex-1">
                                    {calendarWeek.map((dayObj, i) => {
                                        const dayEvents = events.filter(e => {
                                            const rawDate = e.date || e.event_date;
                                            const eventDateStr = rawDate ? rawDate.split('T')[0] : null;
                                            return eventDateStr === dayObj.dateStr;
                                        });
                                        const isToday = dayObj.dateStr === todayStr;
                                        return (
                                            <div key={i}
                                                onClick={() => handleDateClick(dayObj.dateStr)}
                                                className={`p-3 lg:p-4 rounded-xl border border-transparent transition-all relative flex flex-col bg-accent-dark/50 hover:border-primary/30 cursor-pointer group ${isToday ? '!border-primary/40 shadow-[inset_0_0_15px_rgba(6,249,67,0.15)]' : ''}`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`text-lg font-medium group-hover:text-white ${isToday ? '!text-primary font-bold text-xl' : 'text-gray-300'}`}>
                                                        {dayObj.fullDate.getDate()}
                                                    </span>
                                                    {isToday && <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Today</span>}
                                                </div>

                                                <div className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-none pr-1">
                                                    {dayEvents.map(event => (
                                                        <div key={event.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                                            className="w-full bg-background-dark/80 border border-white/5 p-3 rounded-xl flex flex-col group/event relative cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm block">
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <p className="text-sm text-white font-bold leading-tight group-hover/event:text-primary transition-colors" title={event.title}>{event.title}</p>
                                                                {event.google_calendar_event_id && (
                                                                    <span className="material-symbols-outlined text-xs text-blue-400 shrink-0 mt-0.5" title="Synced to Google Calendar">cloud_done</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mb-2">
                                                                <span className="w-2 h-2 rounded-full bg-primary/80"></span>
                                                                <p className="text-xs text-gray-400 truncate">{event.category || 'Event'}</p>
                                                            </div>
                                                            {event.start_time && (
                                                                <p className="text-[11px] text-gray-500 font-mono mt-auto">{event.start_time.slice(0, 5)} {event.end_time ? `- ${event.end_time.slice(0, 5)}` : ''}</p>
                                                            )}
                                                            {!event.start_time && (
                                                                <p className="text-[11px] text-gray-600 italic mt-auto">All day</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* LIST VIEW */}
                        {calendarView === 'list' && (
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {events.filter(e => {
                                    const rawDate = e.date || e.event_date;
                                    const d = rawDate ? new Date(rawDate.split('T')[0]) : null;
                                    return d && d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
                                }).sort((a, b) => {
                                    const dateA = new Date((a.date || a.event_date).split('T')[0]);
                                    const dateB = new Date((b.date || b.event_date).split('T')[0]);
                                    return dateA - dateB;
                                }).reduce((acc, event) => {
                                    const dateStr = (event.date || event.event_date).split('T')[0];
                                    if (!acc[dateStr]) acc[dateStr] = [];
                                    acc[dateStr].push(event);
                                    return acc;
                                }, Object.entries({}).length === 0 ? {} : {}) // Initialize empty if no events
                                    // Convert groups to array and render
                                    && Object.entries(
                                        events.filter(e => {
                                            const rawDate = e.date || e.event_date;
                                            const d = rawDate ? new Date(rawDate.split('T')[0]) : null;
                                            return d && d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
                                        }).sort((a, b) => {
                                            const dateA = new Date((a.date || a.event_date).split('T')[0]);
                                            const dateB = new Date((b.date || b.event_date).split('T')[0]);
                                            return dateA - dateB;
                                        }).reduce((acc, event) => {
                                            const dateStr = (event.date || event.event_date).split('T')[0];
                                            if (!acc[dateStr]) acc[dateStr] = [];
                                            acc[dateStr].push(event);
                                            return acc;
                                        }, {})
                                    ).map(([dateStr, dayEvents]) => {
                                        const d = new Date(`${dateStr}T12:00:00`);
                                        const isToday = dateStr === todayStr;
                                        return (
                                            <div key={dateStr} className="mb-8 last:mb-0">
                                                <div className="flex items-center gap-4 mb-4 sticky top-0 bg-card-dark py-2 z-10 border-b border-white/5">
                                                    <div className={`text-2xl font-bold w-12 text-center ${isToday ? 'text-primary' : 'text-gray-300'}`}>
                                                        {d.getDate()}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-gray-500 uppercase tracking-widest'}`}>
                                                            {isToday ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'long' })}
                                                        </p>
                                                        <p className="text-xs text-gray-600">{d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 pl-16">
                                                    {dayEvents.map(event => (
                                                        <div key={event.id}
                                                            onClick={() => setSelectedEvent(event)}
                                                            className="bg-accent-dark/40 hover:bg-accent-dark/80 border border-white/5 hover:border-primary/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer transition-all group">

                                                            {/* Time Column */}
                                                            <div className="md:w-32 shrink-0">
                                                                {event.start_time ? (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white font-mono text-sm">{event.start_time.slice(0, 5)}</span>
                                                                        {event.end_time && <span className="text-gray-500 font-mono text-xs">{event.end_time.slice(0, 5)}</span>}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-500 italic text-sm">All day</span>
                                                                )}
                                                            </div>

                                                            {/* Art/Image Column */}
                                                            <div className="size-12 rounded-lg bg-background-dark border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                                                                {(event.artists?.[0]?.image_url || event.cover_url) ? (
                                                                    <img src={event.artists?.[0]?.image_url || event.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                ) : (
                                                                    <span className="material-symbols-outlined text-gray-600">music_note</span>
                                                                )}
                                                            </div>

                                                            {/* Details Column */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="text-white font-bold text-lg truncate group-hover:text-primary transition-colors">{event.title}</h4>
                                                                    {event.google_calendar_event_id && (
                                                                        <span className="material-symbols-outlined text-sm text-blue-400" title="Synced to Google Calendar">cloud_done</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xs text-gray-400 bg-background-dark px-2 py-1 rounded-md border border-white/5">{event.category || 'Event'}</span>
                                                                    {event.artists?.length > 0 && event.artists[0]?.name && (
                                                                        <span className="text-sm text-gray-400 truncate">ft. {event.artists.map(a => a.name).join(', ')}</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                {events.filter(e => {
                                    const rawDate = e.date || e.event_date;
                                    const d = rawDate ? new Date(rawDate.split('T')[0]) : null;
                                    return d && d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
                                }).length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-12">
                                            <span className="material-symbols-outlined text-6xl text-gray-800 mb-4">event_busy</span>
                                            <h3 className="text-xl font-bold text-gray-400 mb-2">No events this month</h3>
                                            <p className="text-gray-600 text-sm">You haven't added any releases or events for {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.</p>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* New Event Form */}
                    <div ref={newEventFormRef} className="mt-8 bg-card-dark border border-accent-dark rounded-2xl p-6 relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-neon">edit_calendar</span>
                                New Event
                            </h3>
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
                                            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value, start_time: '', end_time: '' })}
                                            className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none">
                                            <option value="Album Drop">Album Drop</option>
                                            <option value="Single">Single</option>
                                            <option value="Concert">Concert</option>
                                            <option value="Listening Party">Listening Party</option>
                                            <option value="Miscellaneous">Miscellaneous</option>
                                        </select>
                                    </label>
                                </div>

                                {/* Conditional time fields based on category */}
                                {(newEvent.category === 'Album Drop' || newEvent.category === 'Single') && (
                                    <div>
                                        <label className="block">
                                            <span className="text-gray-400 text-sm font-medium mb-1 block">Drop Time <span className="text-gray-600 text-xs">(optional — leave empty for all-day)</span></span>
                                            <input
                                                value={newEvent.start_time}
                                                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                                                className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none [color-scheme:dark]"
                                                type="time" />
                                        </label>
                                    </div>
                                )}

                                {(newEvent.category === 'Concert' || newEvent.category === 'Listening Party') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="block">
                                            <span className="text-gray-400 text-sm font-medium mb-1 block">Start Time <span className="text-gray-600 text-xs">(optional)</span></span>
                                            <input
                                                value={newEvent.start_time}
                                                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                                                className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none [color-scheme:dark]"
                                                type="time" />
                                        </label>
                                        <label className="block">
                                            <span className="text-gray-400 text-sm font-medium mb-1 block">End Time <span className="text-gray-600 text-xs">(optional)</span></span>
                                            <input
                                                value={newEvent.end_time}
                                                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                                                className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none [color-scheme:dark]"
                                                type="time" />
                                        </label>
                                    </div>
                                )}

                                {newEvent.category === 'Miscellaneous' && (
                                    <p className="text-gray-600 text-xs italic">Miscellaneous events are created as all-day events on Google Calendar.</p>
                                )}
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
                                <label className="block">
                                    <span className="text-gray-400 text-sm font-medium mb-1 block">Description</span>
                                    <textarea
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none resize-none h-[120px]"
                                        placeholder="Add release notes or venue details..."></textarea>
                                </label>
                            </div>
                        </div>

                        {/* Artist Tagging Section */}
                        <div className="mt-6 pt-6 border-t border-accent-dark">
                            <span className="text-gray-400 text-sm font-medium mb-3 block">Tag Artists {spotifyConnected && <span className="text-[#1DB954] text-xs">(powered by Spotify)</span>}</span>

                            {/* Tagged artists pills */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {taggedArtists.map(artist => (
                                    <div key={artist.spotify_id}
                                        className="flex items-center gap-2 bg-accent-dark px-3 py-1.5 rounded-full border border-primary/20 animate-in">
                                        {artist.image_url ? (
                                            <img src={artist.image_url} alt="" className="size-6 rounded-full object-cover" />
                                        ) : (
                                            <div className="size-6 bg-gray-600 rounded-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-xs">person</span>
                                            </div>
                                        )}
                                        <span className="text-sm text-white">{artist.name}</span>
                                        <button onClick={() => handleRemoveTag(artist.spotify_id)} className="text-gray-400 hover:text-white">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Search input */}
                            <div className="relative">
                                <div className="flex items-center bg-background-dark border border-accent-dark rounded-xl px-4 py-3 focus-within:border-[#1DB954]">
                                    <span className="material-symbols-outlined text-gray-500 text-sm mr-2">search</span>
                                    <input
                                        value={artistSearchQuery}
                                        onChange={(e) => handleArtistSearch(e.target.value)}
                                        className="bg-transparent w-full text-white outline-none placeholder:text-gray-600"
                                        placeholder={spotifyConnected ? "Search any artist on Spotify..." : "Connect Spotify to search artists"}
                                        disabled={!spotifyConnected}
                                        type="text" />
                                    {spotifyConnected && (
                                        <svg viewBox="0 0 24 24" fill="#1DB954" className="w-4 h-4 ml-2 shrink-0 opacity-50">
                                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
                                        </svg>
                                    )}
                                </div>

                                {/* Search results dropdown */}
                                {artistSearchResults.length > 0 && (
                                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-accent-dark rounded-xl shadow-[0_-4px_30px_rgba(0,0,0,0.6)] z-[100] max-h-[400px] overflow-y-auto">
                                        {artistSearchResults.map(artist => (
                                            <button
                                                key={artist.spotify_id}
                                                onClick={() => handleTagArtist(artist)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent-dark transition-colors text-left border-b border-accent-dark/50 last:border-0">
                                                {artist.image_url ? (
                                                    <img src={artist.image_url} alt="" className="size-10 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="size-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-gray-400">person</span>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium text-sm truncate">{artist.name}</p>
                                                    {artist.genres.length > 0 && (
                                                        <p className="text-gray-500 text-xs truncate">{artist.genres.join(', ')}</p>
                                                    )}
                                                </div>
                                                <span className="material-symbols-outlined text-gray-500 text-sm shrink-0">add_circle</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => { setNewEvent({ title: '', date: '', category: 'Album Drop', url: '', description: '', start_time: '', end_time: '' }); setTaggedArtists([]); setFormError(''); }}
                                className="px-6 py-2.5 rounded-xl text-gray-300 font-medium hover:bg-accent-dark transition-colors">Cancel</button>
                            <button
                                onClick={handleCreateEvent}
                                className="px-8 py-2.5 rounded-xl bg-primary text-black font-bold hover:shadow-neon transition-shadow">Save
                                Event</button>
                        </div>
                    </div>
                </main>

                {/* Sidebar */}
                <aside className="w-80 lg:w-96 bg-[#111] border-l border-accent-dark p-6 flex flex-col gap-8 overflow-y-auto">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold text-lg tracking-wide">Upcoming Soon</h3>
                            <button onClick={() => setCalendarView('list')} className="text-xs text-primary hover:underline text-neon font-medium">View All</button>
                        </div>
                        <div className="space-y-4">
                            {events.slice(0, 5).map(event => (
                                <div key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl hover:bg-accent-dark transition-colors">
                                    <div className="relative size-16 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-gray-800 flex items-center justify-center text-gray-600">
                                        {(event.artists?.[0]?.image_url || event.cover_url) ? (
                                            <img alt="Artist"
                                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                                src={event.artists?.[0]?.image_url || event.cover_url} />
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

                    {/* Spotify Top Artists */}
                    {spotifyConnected && topArtists.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" fill="#1DB954" className="w-5 h-5">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
                                    </svg>
                                    Your Top Artists
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {topArtists.slice(0, 8).map((artist, idx) => (
                                    <div key={artist.spotify_id}
                                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent-dark transition-colors group">
                                        <span className="text-gray-600 text-xs font-mono w-4 text-right">{idx + 1}</span>
                                        {artist.image_url ? (
                                            <img src={artist.image_url} alt="" className="size-10 rounded-full object-cover shrink-0 border border-white/5" />
                                        ) : (
                                            <div className="size-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-gray-400">person</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate group-hover:text-[#1DB954] transition-colors">{artist.name}</p>
                                            <p className="text-gray-500 text-[10px] truncate">{artist.genres?.slice(0, 2).join(', ')}</p>
                                        </div>
                                        <button
                                            onClick={() => handleTrackSpotifyArtist(artist)}
                                            className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg bg-[#1DB954]/20 text-[#1DB954] text-xs font-bold hover:bg-[#1DB954]/30 transition-all"
                                            title="Track this artist">
                                            Track
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Tracked Artists */}
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

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={() => { setSelectedEvent(null); setIsEditingEvent(false); }}
                    onKeyDown={(e) => e.key === 'Escape' && (setSelectedEvent(null), setIsEditingEvent(false))}>
                    <div
                        className="bg-[#1a1a1a] border border-accent-dark rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}>

                        {/* Header with artist image (view mode only) */}
                        {!isEditingEvent && selectedEvent.artists?.[0]?.image_url && (
                            <div className="relative h-40 overflow-hidden rounded-t-2xl">
                                <img src={selectedEvent.artists[0].image_url} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent"></div>
                            </div>
                        )}

                        <div className="p-6">
                            {isEditingEvent && editForm ? (
                                /* ── Edit Mode ── */
                                <>
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">edit</span>
                                            Edit Event
                                        </h2>
                                        <button
                                            onClick={() => setIsEditingEvent(false)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-accent-dark rounded-xl transition-colors">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-gray-400 text-sm font-medium mb-1 block">Event Title</span>
                                            <input
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                                                type="text" />
                                        </label>

                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="block">
                                                <span className="text-gray-400 text-sm font-medium mb-1 block">Date</span>
                                                <input
                                                    value={editForm.date}
                                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                    className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none [color-scheme:dark]"
                                                    type="date" />
                                            </label>
                                            <label className="block">
                                                <span className="text-gray-400 text-sm font-medium mb-1 block">Category</span>
                                                <select
                                                    value={editForm.category}
                                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value, start_time: '', end_time: '' })}
                                                    className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none">
                                                    <option value="Album Drop">Album Drop</option>
                                                    <option value="Single">Single</option>
                                                    <option value="Concert">Concert</option>
                                                    <option value="Listening Party">Listening Party</option>
                                                    <option value="Miscellaneous">Miscellaneous</option>
                                                </select>
                                            </label>
                                        </div>

                                        {(editForm.category === 'Album Drop' || editForm.category === 'Single') && (
                                            <label className="block">
                                                <span className="text-gray-400 text-sm font-medium mb-1 block">Drop Time <span className="text-gray-600 text-xs">(optional)</span></span>
                                                <input
                                                    value={editForm.start_time}
                                                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                                    className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none [color-scheme:dark]"
                                                    type="time" />
                                            </label>
                                        )}

                                        {(editForm.category === 'Concert' || editForm.category === 'Listening Party') && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <label className="block">
                                                    <span className="text-gray-400 text-sm font-medium mb-1 block">Start Time</span>
                                                    <input
                                                        value={editForm.start_time}
                                                        onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                                        className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none [color-scheme:dark]"
                                                        type="time" />
                                                </label>
                                                <label className="block">
                                                    <span className="text-gray-400 text-sm font-medium mb-1 block">End Time</span>
                                                    <input
                                                        value={editForm.end_time}
                                                        onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                                        className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none [color-scheme:dark]"
                                                        type="time" />
                                                </label>
                                            </div>
                                        )}

                                        <label className="block">
                                            <span className="text-gray-400 text-sm font-medium mb-1 block">Streaming URL</span>
                                            <div className="flex items-center bg-background-dark border border-accent-dark rounded-xl px-4 py-3 focus-within:border-primary">
                                                <span className="material-symbols-outlined text-gray-500 text-sm mr-2">link</span>
                                                <input
                                                    value={editForm.url}
                                                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                                                    className="bg-transparent w-full text-white outline-none"
                                                    placeholder="https://spotify.com/..." type="url" />
                                            </div>
                                        </label>

                                        <label className="block">
                                            <span className="text-gray-400 text-sm font-medium mb-1 block">Description</span>
                                            <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                className="w-full bg-background-dark border border-accent-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none resize-none h-24"
                                                placeholder="Add release notes or venue details..." />
                                        </label>
                                    </div>

                                    <div className="flex gap-3 mt-5 pt-4 border-t border-accent-dark">
                                        <button
                                            onClick={handleUpdateEvent}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-colors text-sm">
                                            <span className="material-symbols-outlined text-sm">check</span>
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setIsEditingEvent(false)}
                                            className="px-4 py-2.5 rounded-xl text-gray-400 hover:bg-accent-dark transition-colors text-sm">
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* ── View Mode ── */
                                <>
                                    {/* Title + Close */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{selectedEvent.title}</h2>
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                                                    {selectedEvent.category || 'Event'}
                                                </span>
                                                {selectedEvent.google_calendar_event_id && (
                                                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs">cloud_done</span>
                                                        Google Calendar
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedEvent(null)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-accent-dark rounded-xl transition-colors shrink-0">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="flex items-center gap-3 mb-4 text-gray-300">
                                        <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                                        <div>
                                            <p className="font-medium">
                                                {(() => {
                                                    const d = selectedEvent.date || selectedEvent.event_date;
                                                    if (!d) return '';
                                                    const ymd = d.split('T')[0];
                                                    return new Date(`${ymd}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                                                })()}
                                            </p>
                                            {selectedEvent.start_time && (
                                                <p className="text-sm text-gray-400">
                                                    {selectedEvent.start_time?.slice(0, 5)}
                                                    {selectedEvent.end_time ? ` — ${selectedEvent.end_time.slice(0, 5)}` : ''}
                                                </p>
                                            )}
                                            {!selectedEvent.start_time && (
                                                <p className="text-sm text-gray-500">All day</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {selectedEvent.description && (
                                        <div className="mb-4">
                                            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Description</h4>
                                            <p className="text-gray-300 text-sm leading-relaxed bg-accent-dark/50 rounded-xl p-4">
                                                {selectedEvent.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Tagged Artists */}
                                    {selectedEvent.artists?.length > 0 && selectedEvent.artists[0]?.name && (
                                        <div className="mb-4">
                                            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Artists</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedEvent.artists.map((artist, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-accent-dark px-3 py-2 rounded-full border border-white/5">
                                                        {artist.image_url ? (
                                                            <img src={artist.image_url} alt="" className="size-7 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="size-7 rounded-full bg-gray-700 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-xs text-gray-400">person</span>
                                                            </div>
                                                        )}
                                                        <span className="text-sm text-white font-medium">{artist.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Streaming URL */}
                                    {selectedEvent.external_url && (
                                        <a
                                            href={selectedEvent.external_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-accent-dark/50 hover:bg-accent-dark rounded-xl transition-colors mb-4 group">
                                            <span className="material-symbols-outlined text-primary">play_circle</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium group-hover:text-primary transition-colors">Stream / Listen</p>
                                                <p className="text-xs text-gray-500 truncate">{selectedEvent.external_url}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-gray-500 text-sm">open_in_new</span>
                                        </a>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-accent-dark">
                                        <button
                                            onClick={() => handleStartEdit(selectedEvent)}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary hover:bg-primary/10 transition-colors text-sm font-medium">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                            Edit Event
                                        </button>
                                        <button
                                            onClick={() => { handleDeleteEvent(selectedEvent.id); setSelectedEvent(null); }}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                            Delete Event
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default Dashboard;
