import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
axios.defaults.withCredentials = true;

const Artists = () => {
    const { user, logout } = useAuth();
    const [trackedArtists, setTrackedArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Spotify inline search states
    const [artistSearchResults, setArtistSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        const fetchArtists = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/artists/tracked`);
                setTrackedArtists(res.data);
            } catch (err) {
                console.error("Failed to fetch tracked artists:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchArtists();
    }, []);

    const handleRemoveArtist = async (artistId) => {
        try {
            // Find artist name for toast before removing
            const artistToRemove = trackedArtists.find(a => a.id === artistId);
            await axios.delete(`${API_URL}/api/artists/track/${artistId}`);
            setTrackedArtists(prev => prev.filter(a => a.id !== artistId));
            if (artistToRemove) toast.success(`No longer tracking ${artistToRemove.name}`);
        } catch (error) {
            console.error('Failed to untrack artist:', error);
            toast.error('Failed to untrack artist. Please try again.');
        }
    };

    const handleArtistSearch = (value) => {
        if (searchTimeout) clearTimeout(searchTimeout);

        if (value.trim().length < 2) {
            setArtistSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeout = setTimeout(async () => {
            try {
                const res = await axios.get(`${API_URL}/api/spotify/search?q=${encodeURIComponent(value.trim())}`);
                if (mountedRef.current) setArtistSearchResults(res.data);
            } catch (err) {
                console.error('Artist search error:', err);
            } finally {
                if (mountedRef.current) setIsSearching(false);
            }
        }, 300);
        setSearchTimeout(timeout);
    };

    const handleTrackNewArtist = async (artist) => {
        try {
            const createRes = await axios.post(`${API_URL}/api/artists`, {
                name: artist.name,
                spotify_id: artist.spotify_id,
                image_url: artist.image_url,
                genres: artist.genres
            });
            const newArtist = createRes.data;
            await axios.post(`${API_URL}/api/artists/track`, { artist_id: newArtist.id });

            // Add to trackedArtists list if not already there
            setTrackedArtists(prev => {
                if (prev.find(a => a.id === newArtist.id || a.spotify_id === newArtist.spotify_id)) return prev;
                return [...prev, newArtist];
            });

            // Clear search after tracking
            setSearchQuery('');
            setArtistSearchResults([]);

            toast.success(`Now tracking ${newArtist.name}!`);
        } catch (err) {
            console.error("Failed to track artist:", err);
            toast.error("Failed to track artist. Please try again.");
        }
    };



    const filteredArtists = trackedArtists.filter(artist =>
        artist.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-[#0a0a0a] text-slate-100 font-display min-h-screen flex flex-col overflow-x-hidden group/design-root">

            {/* Header / Nav */}
            <Navbar />


            {/* Main Content */}
            <main className="flex-1 px-4 lg:px-40 py-10 z-10 w-full max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <h1 className="text-white tracking-tight text-3xl md:text-4xl font-bold leading-tight">Tracked Artists</h1>
                </div>

                {/* Search Bar */}
                <div className="mb-10 max-w-2xl">
                    <label className="flex flex-col w-full h-12 relative group">
                        <div className="flex w-full flex-1 items-center rounded-xl h-full bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-2xl">
                            <div className="text-slate-400 group-focus-within:text-primary pl-4 pr-2 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-[22px]">search</span>
                            </div>
                            <input
                                className="w-full bg-transparent border-none text-white focus:outline-0 focus:ring-0 h-full placeholder:text-slate-500 px-2 text-base font-medium"
                                placeholder="Search tracked artists or discover new ones on Spotify..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    handleArtistSearch(e.target.value);
                                }}
                            />
                        </div>
                        {isSearching && (
                            <div className="absolute -bottom-8 left-4 text-xs font-bold text-primary flex items-center gap-2 animate-pulse">
                                <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                                Searching Spotify...
                            </div>
                        )}
                    </label>

                    {/* Spotify Search Results Dropdown */}
                    {searchQuery.trim().length >= 2 && !isSearching && artistSearchResults.length > 0 && (
                        <div className="absolute top-14 left-0 w-full bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50">
                            <div className="p-2">
                                {artistSearchResults.map(artist => (
                                    <div key={artist.spotify_id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group/item">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 bg-cover bg-center overflow-hidden flex-shrink-0" title={artist.name}>
                                                {artist.image_url ? (
                                                    <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500"><span className="material-symbols-outlined text-lg">person</span></div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold truncate max-w-[200px]">{artist.name}</h4>
                                                <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                                    {artist.genres?.join(', ') || 'Artist'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleTrackNewArtist(artist)}
                                            className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 text-white font-bold text-xs hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                            Track
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="bg-[#1a1a1a]/40 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-4 text-center border border-white/5 animate-pulse">
                                <div className="w-32 h-32 mt-2 bg-white/5 rounded-full border-4 border-[#111111]"></div>
                                <div className="flex flex-col items-center gap-2 w-full mt-2">
                                    <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
                                    <div className="h-3 bg-white/5 rounded-full w-1/2 mt-1"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        filteredArtists.map((artist, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                key={artist.id}
                                onClick={() => window.open(`https://open.spotify.com/artist/${artist.spotify_id}`, '_blank')}
                                className="relative cursor-pointer bg-[#1a1a1a]/40 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-4 text-center border border-white/5 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(89,242,13,0.15)] transition-all duration-500 group"
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveArtist(artist.id); }}
                                    className="absolute top-4 right-4 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-white/5 hover:bg-white/10 rounded-full p-1.5"
                                    title="Untrack Artist"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>

                                <div className="w-32 h-32 mt-2 bg-center bg-no-repeat bg-cover rounded-full border-4 border-[#111111] shadow-[0_4px_20px_rgba(0,0,0,0.5)] group-hover:border-primary/30 transition-colors flex items-center justify-center overflow-hidden bg-background-dark" data-alt={`${artist.name} photo`}>
                                    {artist.image_url ? (
                                        <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <span className="material-symbols-outlined text-4xl text-gray-600">person</span>
                                    )}
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight group-hover:text-primary transition-colors">{artist.name}</h3>
                                    {artist.genres && artist.genres.length > 0 && (
                                        <span className="px-3 py-1 rounded-full border border-primary/40 text-primary text-xs font-bold uppercase tracking-wider bg-primary/5">
                                            {Array.isArray(artist.genres) ? artist.genres[0] : (typeof artist.genres === 'string' ? (() => { try { return JSON.parse(artist.genres)[0]; } catch { return 'Artist'; } })() : 'Artist')}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        )))}

                    {/* Empty State / Add New Card */}
                    <div
                        onClick={() => {
                            const input = document.querySelector('input[placeholder*="Spotify"]');
                            if (input) input.focus();
                        }}
                        className="relative bg-transparent rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center border border-dashed border-white/20 hover:border-primary hover:bg-[#1a1a1a]/50 transition-all duration-300 cursor-pointer min-h-[240px] group">
                        <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary transition-colors">search</span>
                        </div>
                        <p className="text-slate-400 font-medium group-hover:text-white transition-colors">Search for new artists above</p>
                    </div>
                </div>

                {/* Inline Spotify Search Results */}
                {artistSearchResults.length > 0 && searchQuery.length >= 2 && (
                    <div className="mt-12 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-primary text-3xl">queue_music</span>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Spotify Results for "{searchQuery}"</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {artistSearchResults.map(artist => {
                                const isTracked = trackedArtists.some(ta => ta.spotify_id === artist.spotify_id);
                                return (
                                    <div key={artist.spotify_id} className="bg-[#111] rounded-2xl p-4 border border-white/10 flex flex-col items-center text-center gap-3 hover:border-primary/50 transition-colors">
                                        <div className="w-24 h-24 rounded-full bg-[#222] border-2 border-[#1a1a1a] overflow-hidden">
                                            {artist.image_url ? (
                                                <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-3xl text-gray-500">person</span></div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-lg leading-tight">{artist.name}</h4>
                                            {artist.genres && artist.genres.length > 0 && (
                                                <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider truncate max-w-[150px]">{artist.genres[0]}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleTrackNewArtist(artist)}
                                            disabled={isTracked}
                                            className={`mt-2 w-full py-2 rounded-lg font-bold text-sm transition-all ${isTracked ? 'bg-[#1a1a1a] text-primary/50 cursor-not-allowed border border-primary/20' : 'bg-primary text-black hover:bg-black hover:text-primary hover:shadow-[0_0_15px_rgba(89,242,13,0.4)] border border-primary cursor-pointer'}`}
                                        >
                                            {isTracked ? '✓ Tracked' : 'Track Audio'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>


            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,rgba(89,242,13,0.08),transparent_50%)] z-0"></div>
        </div>
    );
};

export default Artists;
