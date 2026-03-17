import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LegalLayout = ({ title, children }) => {
    return (
        <div className="min-h-screen bg-[#050705] text-slate-100 font-display flex flex-col relative overflow-x-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none bg-noise z-10"></div>
            <div className="fixed inset-0 pointer-events-none scanline-overlay z-10 opacity-30"></div>
            <div className="fixed top-1/3 -left-32 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

            <Navbar />

            <main className="relative z-20 flex-grow pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    <header className="mb-16">
                        <Link to="/" className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4 inline-flex items-center gap-2 hover:translate-x-[-4px] transition-transform">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Back to Terminal
                        </Link>
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mt-4">
                            {title}
                        </h1>
                    </header>
                    <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-400 font-light leading-relaxed tracking-wide">
                        {children}
                    </div>
                </div>
            </main>

            <footer className="relative z-20 border-t border-white/5 py-12 text-center">
                <p className="text-[9px] text-slate-700 font-bold uppercase tracking-[0.8em]">BeatDrop // Legal // 2024</p>
            </footer>
        </div>
    );
};

export default LegalLayout;
