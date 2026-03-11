import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [imageError, setImageError] = useState(false);

    // Helper to determine if a path is active
    const isActive = (path) => location.pathname === path;

    return (
        <header className="w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md z-50 sticky top-0">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 lg:px-12">
                {/* Logo & Brand */}
                <div className="flex items-center gap-2">
                    <div className="size-8">
                        <svg className="w-full h-full text-primary" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 4c2.5 0 4.5-1.5 5.5-3.5h-11c1 2 3 3.5 5.5 3.5z" />
                        </svg>
                    </div>
                    <h2 className="text-white text-lg font-bold tracking-tight uppercase">BeatDrop</h2>
                </div>

                {/* Main Navigation Links */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link
                        to="/dashboard"
                        className={`text-sm font-bold transition-colors ${isActive('/dashboard') ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-400 hover:text-white'}`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/artists"
                        className={`text-sm font-bold transition-colors ${isActive('/artists') ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-400 hover:text-white'}`}
                    >
                        Artists
                    </Link>
                    <Link
                        to="/releases"
                        className={`text-sm font-bold transition-colors ${isActive('/releases') ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-400 hover:text-white'}`}
                    >
                        Releases
                    </Link>
                    <Link
                        to="/settings"
                        className={`text-sm font-bold transition-colors ${isActive('/settings') ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-400 hover:text-white'}`}
                    >
                        Settings
                    </Link>
                </nav>

                {/* Action Buttons & Profile */}
                <div className="flex items-center gap-6">
                    <button className="relative text-gray-400 hover:text-white transition-colors" title="Notifications">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        {/* Notification marker dot (can be made dynamic later) */}
                        <span className="absolute top-0 right-0 size-2 bg-primary rounded-full shadow-neon"></span>
                    </button>

                    <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors flex items-center" title="Log Out">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>

                    <Link to="/settings" className="size-10 rounded-full bg-cover bg-center border-2 border-[#222222] hover:border-primary bg-[#111111] flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(89,242,13,0.1)] overflow-hidden" title="Settings">
                        {user?.profile_image_url && !imageError ? (
                            <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                        ) : (
                            <span className="material-symbols-outlined text-sm">person</span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
