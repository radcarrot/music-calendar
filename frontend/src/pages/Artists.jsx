import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
axios.defaults.withCredentials = true;

const Artists = () => {
    const { logout } = useAuth();
    const [trackedArtists, setTrackedArtists] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Spotify inline search states
    const [artistSearchResults, setArtistSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    useEffect(() => {
        const fetchArtists = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/artists/tracked`);
                setTrackedArtists(res.data);
            } catch (err) {
                console.error("Failed to fetch tracked artists:", err);
            }
        };
        fetchArtists();
    }, []);

    const handleRemoveArtist = async (artistId) => {
        try {
            await axios.delete(`${API_URL}/api/artists/track/${artistId}`);
            setTrackedArtists(prev => prev.filter(a => a.id !== artistId));
        } catch (error) {
            console.error('Failed to untrack artist:', error);
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
                setArtistSearchResults(res.data);
            } catch (err) {
                console.error('Artist search error:', err);
            } finally {
                setIsSearching(false);
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
        } catch (err) {
            console.error("Failed to track artist:", err);
        }
    };



    const filteredArtists = trackedArtists.filter(artist =>
        artist.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-[#0a0a0a] text-slate-100 font-display min-h-screen flex flex-col overflow-x-hidden group/design-root">

            {/* Header */}
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
                        <Link to="/dashboard" className="text-gray-400 hover:text-primary transition-colors text-sm font-medium tracking-wide border-b-2 border-transparent pb-1">
                            Dashboard
                        </Link>
                        <Link to="/artists" className="text-primary text-sm font-medium tracking-wide border-b-2 border-primary pb-1">
                            Artists
                        </Link>
                        <Link to="/releases" className="text-gray-400 hover:text-primary transition-colors text-sm font-medium tracking-wide border-b-2 border-transparent pb-1">
                            Releases
                        </Link>
                        <Link to="/settings" className="text-gray-400 hover:text-primary transition-colors text-sm font-medium tracking-wide border-b-2 border-transparent pb-1">
                            Settings
                        </Link>
                    </nav>
                    <div className="flex items-center gap-6">
                        <button className="relative text-gray-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-0 right-0 size-2 bg-primary rounded-full shadow-neon"></span>
                        </button>
                        <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors flex items-center" title="Log Out">
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                        <div className="size-10 rounded-full bg-cover bg-center border-2 border-accent-dark bg-gray-700 flex items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                    </div>
                </div>
            </header>

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
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 animate-in fade-in duration-1000">
                    {filteredArtists.map(artist => (
                        <div key={artist.id} onClick={() => window.open(`https://open.spotify.com/artist/${artist.spotify_id}`, '_blank')} className="relative cursor-pointer bg-[#1a1a1a]/40 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center gap-4 text-center border border-white/5 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(89,242,13,0.15)] transition-all duration-500 group">
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
                                        {Array.isArray(artist.genres) ? artist.genres[0] : (typeof artist.genres === 'string' ? JSON.parse(artist.genres)[0] : 'Artist')}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

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
