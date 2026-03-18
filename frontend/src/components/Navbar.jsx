import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [imageError, setImageError] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: 'calendar_month' },
        { to: '/artists', label: 'Artists', icon: 'person' },
        { to: '/releases', label: 'Releases', icon: 'album' },
        { to: '/settings', label: 'Settings', icon: 'settings' },
    ];

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

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`text-sm font-bold transition-colors ${isActive(to) ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-400 hover:text-white'}`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Right side actions */}
                <div className="flex items-center gap-4">
                    <button className="relative text-gray-400 hover:text-white transition-colors p-2" title="Notifications">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full shadow-neon"></span>
                    </button>

                    <button onClick={logout} className="hidden md:flex text-gray-400 hover:text-red-500 transition-colors p-2 items-center" title="Log Out">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>

                    <Link to="/settings" className="hidden md:flex size-10 rounded-full bg-cover bg-center border-2 border-[#222222] hover:border-primary bg-[#111111] items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(89,242,13,0.1)] overflow-hidden" title="Settings">
                        {user?.profile_image_url && !imageError ? (
                            <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                        ) : (
                            <span className="material-symbols-outlined text-sm">person</span>
                        )}
                    </Link>

                    {/* Hamburger — tablets only (sm to md); phones use BottomNav */}
                    <button
                        onClick={() => setMobileOpen(o => !o)}
                        className="hidden sm:flex md:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-accent-dark"
                        aria-label="Toggle menu">
                        <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu — tablets only */}
            {mobileOpen && (
                <div className="hidden sm:block md:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-md">
                    <nav className="flex flex-col px-4 py-3 gap-1">
                        {navLinks.map(({ to, label, icon }) => (
                            <Link
                                key={to}
                                to={to}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isActive(to) ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-white hover:bg-accent-dark'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                {label}
                            </Link>
                        ))}
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center overflow-hidden">
                                    {user?.profile_image_url && !imageError ? (
                                        <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                                    ) : (
                                        <span className="material-symbols-outlined text-sm text-gray-400">person</span>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-white">{user?.name || 'Account'}</span>
                            </div>
                            <button
                                onClick={() => { logout(); setMobileOpen(false); }}
                                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors p-2">
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Log out
                            </button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Navbar;
