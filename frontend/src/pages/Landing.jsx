import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500 selection:text-black">
            {/* Navigation */}
            <nav className="fixed w-full z-50 px-6 py-4 flex justify-between items-center border-b border-gray-900 bg-black/80 backdrop-blur-md">
                <div className="font-bold text-2xl tracking-tighter text-emerald-400">BeatDrop</div>
                <div className="hidden md:flex gap-8 text-sm font-medium tracking-wide">
                    <a href="#features" className="text-gray-400 hover:text-emerald-400 transition-colors">Features</a>
                    <a href="#community" className="text-gray-400 hover:text-emerald-400 transition-colors">Community</a>
                    <a href="#pricing" className="text-gray-400 hover:text-emerald-400 transition-colors">Pricing</a>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="px-5 py-2 text-sm font-bold border border-gray-700 rounded-full hover:border-emerald-400 hover:text-emerald-400 transition-colors">
                        LOGIN
                    </Link>
                    <Link to="/register" className="px-5 py-2 text-sm font-bold bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                        GET STARTED
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 mb-8 relative z-10">
                    TRACK EVERY DROP.<br />
                    <span className="text-emerald-400">MISS NOTHING.</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mb-12 font-light leading-relaxed">
                    The ultimate music release tracker for the obsessed. Precision alerts in a world of noise. Stay ahead of the hype in the late-night city.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left border border-gray-800 rounded-2xl p-6 bg-gray-900/50 backdrop-blur-sm relative z-10">
                    <div className="p-4 border-l-2 border-emerald-500">
                        <h3 className="font-bold text-lg mb-1">After Hours</h3>
                        <p className="text-sm text-gray-400">The Weeknd • R&B/Soul</p>
                    </div>
                    <div className="p-4 border-l-2 border-cyan-500">
                        <h3 className="font-bold text-lg mb-1">Kiss Land (Deluxe)</h3>
                        <p className="text-sm text-gray-400">The Weeknd • Alternative R&B</p>
                    </div>
                    <div className="p-4 border-l-2 border-purple-500">
                        <h3 className="font-bold text-lg mb-1">Starboy</h3>
                        <p className="text-sm text-gray-400">The Weeknd • Pop</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 bg-gradient-to-b from-black to-gray-900 border-t border-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-sm font-bold text-emerald-500 tracking-[0.2em] uppercase mb-4">System Features</h2>
                        <p className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">ENGINEERED FOR THE<br />ULTRA-OBSESSED.</p>
                        <p className="text-gray-400 max-w-2xl text-lg">Designed with the surgical precision of a studio master. Experience music tracking with zero latency.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-black border border-gray-800 p-8 rounded-2xl hover:border-emerald-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-gray-900 text-emerald-400 flex items-center justify-center rounded-lg mb-6 group-hover:bg-emerald-500/10 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h4 className="text-xl font-bold mb-3">Instant Alerts</h4>
                            <p className="text-gray-400 leading-relaxed text-sm">Get notified the millisecond an album drops. No delays, no excuses. Direct fiber-optic notification delivery.</p>
                        </div>

                        <div className="bg-black border border-gray-800 p-8 rounded-2xl hover:border-cyan-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-gray-900 text-cyan-400 flex items-center justify-center rounded-lg mb-6 group-hover:bg-cyan-500/10 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h4 className="text-xl font-bold mb-3">Global Intel</h4>
                            <p className="text-gray-400 leading-relaxed text-sm">Real-time data feeds from Tokyo, Toronto, and beyond. We monitor underground circuits and major networks alike.</p>
                        </div>

                        <div className="bg-black border border-gray-800 p-8 rounded-2xl hover:border-purple-500/50 transition-colors group">
                            <div className="w-12 h-12 bg-gray-900 text-purple-400 flex items-center justify-center rounded-lg mb-6 group-hover:bg-purple-500/10 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </div>
                            <h4 className="text-xl font-bold mb-3">Focus Mode</h4>
                            <p className="text-gray-400 leading-relaxed text-sm">Clean, tactical dashboard showing only your priority targets. Eliminate the static of the mainstream.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Community Session */}
            <section id="community" className="py-24 px-6 border-t border-gray-900 bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">Transmission Logs</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">S</div>
                                <div>
                                    <h5 className="font-bold text-sm">Sarah J.</h5>
                                    <p className="text-xs text-gray-500">@STARGIRL_SYS</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400">"The late-night aesthetic is flawless. Finally a tracker that looks as cinematic as the music sounds. Notifications are instant."</p>
                        </div>

                        <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">M</div>
                                <div>
                                    <h5 className="font-bold text-sm">Marcus K.</h5>
                                    <p className="text-xs text-gray-500">@RADAR_WARRIOR</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400">"BeatDrop changed how I monitor the scene. The calendar interface is critical for planning listening sessions."</p>
                        </div>

                        <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">E</div>
                                <div>
                                    <h5 className="font-bold text-sm">Elara V.</h5>
                                    <p className="text-xs text-gray-500">@NEON_DREAMER</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400">"Pure atmosphere. It feels exclusive. The SMS alerts always hit before the streaming platforms even refresh."</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-900 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
                    <div className="font-bold text-lg text-white">BeatDrop</div>
                    <p>© 2024 CORE_STATION_INC // ALL RIGHTS RESERVED</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Protocols</a>
                        <a href="#" className="hover:text-white transition-colors">Security</a>
                        <a href="#" className="hover:text-white transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
