import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const BeatDropLogo = () => (
    <svg className="w-9 h-9 text-primary drop-shadow-[0_0_8px_rgba(89,242,13,0.8)]"
        fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 4c2.5 0 4.5-1.5 5.5-3.5h-11c1 2 3 3.5 5.5 3.5z" />
    </svg>
);

const Landing = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col relative bg-background-dark text-slate-100 font-display overflow-x-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none bg-noise z-50"></div>
            <div className="fixed inset-0 pointer-events-none scanline-overlay z-40 opacity-30"></div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-background-dark/90 backdrop-blur-xl border-b border-primary/10">
                <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3">
                            <BeatDropLogo />
                            <span className="text-white text-lg md:text-2xl font-black tracking-[0.2em] uppercase neon-text-strong">BeatDrop</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-10">
                            <a className="text-slate-400 hover:text-primary transition-all text-xs font-bold uppercase tracking-[0.3em]"
                                href="#features">Features</a>
                        </nav>

                        {/* Desktop Auth Buttons */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link to="/login"
                                className="text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Log In</Link>
                            <Button asChild
                                className="bg-primary text-black px-8 py-2.5 rounded-sm text-xs font-black uppercase tracking-[0.2em] neon-button transition-all hover:bg-primary/90 h-auto">
                                <Link to="/register">Sign Up</Link>
                            </Button>
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden text-primary p-1 focus:outline-none"
                            aria-label="Toggle menu">
                            {menuOpen ? (
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {menuOpen && (
                    <div className="md:hidden border-t border-primary/10 bg-background-dark/98 backdrop-blur-xl px-6 py-6 flex flex-col gap-4">
                        <a className="text-slate-400 hover:text-primary transition-all text-xs font-bold uppercase tracking-[0.3em] py-2"
                            href="#features" onClick={() => setMenuOpen(false)}>Features</a>
                        <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                            <Button asChild
                                className="bg-primary text-black w-full py-4 rounded-sm text-xs font-black uppercase tracking-[0.2em] neon-button h-auto">
                                <Link to="/register" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                            </Button>
                            <Button asChild variant="outline"
                                className="border border-white/10 text-white w-full py-4 rounded-sm text-xs font-black uppercase tracking-[0.2em] bg-white/5 h-auto">
                                <Link to="/login" onClick={() => setMenuOpen(false)}>Log In</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-grow pt-16 md:pt-20">
                {/* Hero Section */}
                <section className="relative min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden section-fade-bottom">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-dark/40 to-background-dark z-10"></div>
                        <div className="absolute inset-0 bg-background-dark/60 z-10"></div>
                        <img alt="Cityscape" className="w-full h-full object-cover opacity-50"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKIjEF-JzZudqTfmKXO-x56uMkFhcf0Q9mJocWLXUA1iPgw_XH80mcWc60CTXeMTpUiZ8ima4oFW_8VfU7Ar9CTXFEM5a7bZn-buQy8oDg5uB3sBYsqxF_9PF4hoTC8Cta8E103TU8roWwRwP1xgVtb8T8uHB1Or2eO2BD3XcaCuSgmrasZ9aI1bfngzHsJsUHB0ZFeDTkI95mLS3QqVGblxRKlEzmnLzsfKeeVE8rF6TjGpdfnMtVPF61x5qljPjMTUT_jHJeDHip" />
                    </div>

                    <div className="relative z-20 max-w-[1440px] mx-auto px-6 lg:px-12 w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-16 md:py-20">
                        {/* Hero Text */}
                        <div className="flex-1 text-left space-y-6 md:space-y-10 w-full">
                            {/* Mobile status badge */}
                            <div className="inline-flex md:hidden items-center px-3 py-1 border border-primary/30 bg-primary/5">
                                <span className="text-[10px] font-mono text-primary uppercase tracking-[0.2em]">System Status: Online</span>
                            </div>

                            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-none tracking-tighter text-white uppercase">
                                TRACK EVERY <br />
                                <span className="text-primary neon-text-hero italic">DROP.</span>
                            </h1>

                            <p className="text-sm md:text-lg text-slate-400 max-w-lg font-light tracking-wide">
                                Synchronized alerts for the sonic elite. Stay connected to the green glow.
                            </p>

                            {/* CTA Buttons — stacked on mobile, row on desktop */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-2 md:pt-4 w-full sm:w-auto">
                                <Button asChild
                                    className="bg-primary hover:bg-primary/90 text-black w-full sm:w-auto px-10 py-5 md:py-7 rounded-sm text-sm font-black uppercase tracking-[0.25em] neon-button transition-all flex items-center justify-center gap-3 group h-auto">
                                    <Link to="/register">
                                        Sign Up
                                        <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_right_alt</span>
                                    </Link>
                                </Button>
                                <Button asChild variant="outline"
                                    className="border border-white/10 hover:border-primary/50 text-white w-full sm:w-auto px-10 py-5 md:py-7 rounded-sm text-sm font-black uppercase tracking-[0.25em] bg-white/5 backdrop-blur-md transition-all hover:bg-transparent hover:text-white h-auto">
                                    <Link to="/login">Log In</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Release Card Preview */}
                        <div className="flex-1 w-full max-w-sm md:max-w-xl relative">
                            <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full"></div>
                            <Card className="relative rounded-sm border-primary/20 bg-black/80 backdrop-blur-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(89,242,13,0.1)] glitch-border text-white">
                                <div className="flex justify-between items-center border-b border-primary/10 pb-4 md:pb-6 mb-6 md:mb-8">
                                    <div className="flex gap-3">
                                        <div className="w-2 h-2 bg-red-500/80"></div>
                                        <div className="w-2 h-2 bg-primary/80 shadow-[0_0_8px_#59f20d]"></div>
                                    </div>
                                    <div className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">
                                        System.Release_Log</div>
                                </div>
                                <CardContent className="space-y-4 md:space-y-6 p-0 text-white">
                                    <div className="flex items-center gap-4 md:gap-6 p-3 md:p-4 border border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer group">
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-800 shrink-0 border border-primary/20 group-hover:border-primary/60 transition-all"
                                            style={{ backgroundImage: "url('https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/b9/fe/2bb9fef5-d7f3-8345-25a9-db0e79fde4e4/20UMGIM11048.rgb.jpg/600x600bb.jpg')", backgroundSize: "cover" }}>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="text-white text-sm font-black uppercase tracking-widest group-hover:text-primary transition-colors">After Hours</h4>
                                                <span className="text-primary text-[9px] font-black px-2 py-0.5 border border-primary/50 neon-text-strong">SYNCED</span>
                                            </div>
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">Artist_ID: THE_WEEKND</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 md:gap-6 p-3 md:p-4 border border-white/5 bg-white/5 hover:border-primary/40 transition-all cursor-pointer group opacity-80 hover:opacity-100 relative z-10">
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-800 shrink-0 border border-white/10 group-hover:border-primary/60 transition-all"
                                            style={{ backgroundImage: "url('https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1b/fe/ea/1bfeea22-0fd6-a2af-afa1-1db7ff9838e7/13UAAIM69536.rgb.jpg/600x600bb.jpg')", backgroundSize: "cover" }}>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="text-white text-sm font-black uppercase tracking-widest group-hover:text-primary transition-colors">Kiss Land</h4>
                                                <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">T-MINUS 24H</span>
                                            </div>
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">Artist_ID: THE_WEEKND</p>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-6 -right-4 text-[80px] md:text-[120px] font-black text-primary/5 select-none pointer-events-none italic z-0">
                                        愛
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 md:py-32 bg-background-dark relative">
                    <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
                        <div className="mb-12 md:mb-24 flex flex-col md:flex-row justify-between items-end gap-6 md:gap-10">
                            <div className="max-w-3xl">
                                <h2 className="text-primary text-xs font-black uppercase tracking-[0.5em] mb-4 drop-shadow-[0_0_5px_#59f20d]">
                                    Core Modules</h2>
                                <h3 className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter uppercase">
                                    ENGINEERED FOR <br /> THE OBSESSED.</h3>
                            </div>
                            <div className="text-primary/20 text-6xl md:text-8xl font-black italic select-none">01-03</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-primary/10 border border-primary/10">
                            <Card className="bg-background-dark p-8 md:p-12 hover:bg-surface-dark transition-all rounded-none border-none shadow-none group z-10 cursor-default">
                                <CardHeader className="p-0 mb-6">
                                    <div className="w-14 h-14 bg-primary/10 flex items-center justify-center text-primary group-hover:shadow-[0_0_20px_#59f20d] transition-all">
                                        <span className="material-symbols-outlined !text-3xl">sensors</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <h4 className="text-2xl font-black text-white mb-4 md:mb-6 uppercase tracking-widest group-hover:text-primary transition-colors">
                                        Neural Alerts</h4>
                                    <p className="text-slate-400 leading-relaxed font-light">Sub-second latency notifications directly
                                        to your neural interface. Never miss the drop.</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-background-dark p-8 md:p-12 hover:bg-surface-dark transition-all rounded-none border-none shadow-none group z-10 cursor-default">
                                <CardHeader className="p-0 mb-6">
                                    <div className="w-14 h-14 bg-primary/10 flex items-center justify-center text-primary group-hover:shadow-[0_0_20px_#59f20d] transition-all">
                                        <span className="material-symbols-outlined !text-3xl">language</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <h4 className="text-2xl font-black text-white mb-4 md:mb-6 uppercase tracking-widest group-hover:text-primary transition-colors">
                                        Global Net</h4>
                                    <p className="text-slate-400 leading-relaxed font-light">Synthesizing data from every underground
                                        circuit and major mainframe across the globe.</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-background-dark p-8 md:p-12 hover:bg-surface-dark transition-all rounded-none border-none shadow-none group z-10 cursor-default">
                                <CardHeader className="p-0 mb-6">
                                    <div className="w-14 h-14 bg-primary/10 flex items-center justify-center text-primary group-hover:shadow-[0_0_20px_#59f20d] transition-all">
                                        <span className="material-symbols-outlined !text-3xl">grid_view</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <h4 className="text-2xl font-black text-white mb-4 md:mb-6 uppercase tracking-widest group-hover:text-primary transition-colors">
                                        Visual Matrix</h4>
                                    <p className="text-slate-400 leading-relaxed font-light">A customizable tactical dashboard. Filter
                                        the noise. Amplify the signal.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-background-dark border-t border-primary/5 py-12 md:py-16 relative">
                <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
                        <div className="flex items-center gap-4">
                            <BeatDropLogo />
                            <div>
                                <h2 className="text-white text-xl font-black uppercase tracking-[0.3em]">BeatDrop</h2>
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">All Rights Reserved // 2024 Terminal</p>
                            </div>
                        </div>
                        <div className="flex gap-8 md:gap-12 text-[10px] font-black uppercase tracking-[0.4em]">
                            <Link className="text-slate-500 hover:text-primary transition-colors" to="/terms">Terms</Link>
                            <Link className="text-slate-500 hover:text-primary transition-colors" to="/privacy">Privacy</Link>
                            <a className="text-slate-500 hover:text-primary transition-colors" href="#">Status</a>
                        </div>
                        <div className="flex gap-6">
                            <a className="w-12 h-12 border border-primary/5 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all group"
                                href="#">
                                <svg className="group-hover:drop-shadow-[0_0_5px_#59f20d]" fill="currentColor" height="18"
                                    viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z">
                                    </path>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
