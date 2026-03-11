import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            toast.error('Password must be at least 8 characters long and contain at least one letter and one number.');
            return;
        }

        try {
            await login(email, password);
            navigate('/dashboard');
            toast.success('Logged in successfully');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-[#050705] dark">
            <style>{`
                .neon-border-glow {
                    box-shadow: 0 0 15px rgba(89, 242, 13, 0.4), inset 0 0 2px rgba(89, 242, 13, 0.4);
                }
                .neon-text-strong {
                    text-shadow: 0 0 8px rgba(89, 242, 13, 0.4), 0 0 15px rgba(89, 242, 13, 0.2);
                }
                .scanline-overlay {
                    background: linear-gradient(to bottom,
                            transparent,
                            transparent 50%,
                            rgba(89, 242, 13, 0.03) 50%,
                            rgba(89, 242, 13, 0.03));
                    background-size: 100% 4px;
                    pointer-events: none;
                }
                .bg-noise {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3BaseFilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/baseFilter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                    opacity: 0.02;
                }
                .light-leak {
                    background: radial-gradient(circle at center, rgba(89, 242, 13, 0.4) 0%, transparent 70%);
                    filter: blur(80px);
                }
                .input-focus-glow:focus {
                    box-shadow: 0 0 12px rgba(89, 242, 13, 0.4);
                    border-color: #59f20d !important;
                }
                .raccoon-logo {
                    filter: drop-shadow(0 0 8px rgba(89, 242, 13, 0.8));
                }
            `}</style>

            <div className="fixed inset-0 z-0">
                <img alt="Cityscape" className="w-full h-full object-cover opacity-30 brightness-[0.2]"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKIjEF-JzZudqTfmKXO-x56uMkFhcf0Q9mJocWLXUA1iPgw_XH80mcWc60CTXeMTpUiZ8ima4oFW_8VfU7Ar9CTXFEM5a7bZn-buQy8oDg5uB3sBYsqxF_9PF4hoTC8Cta8E103TU8roWwRwP1xgVtb8T8uHB1Or2eO2BD3XcaCuSgmrasZ9aI1bfngzHsJsUHB0ZFeDTkI95mLS3QqVGblxRKlEzmnLzsfKeeVE8rF6TjGpdfnMtVPF61x5qljPjMTUT_jHJeDHip" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050705] via-transparent to-[#050705]/80"></div>
            </div>
            <div className="fixed top-1/3 -left-32 w-[600px] h-[600px] light-leak opacity-20 pointer-events-none"></div>
            <div className="fixed bottom-1/3 -right-32 w-[600px] h-[600px] light-leak opacity-10 pointer-events-none"></div>
            <div className="fixed inset-0 pointer-events-none bg-noise z-10"></div>
            <div className="fixed inset-0 pointer-events-none scanline-overlay z-10 opacity-30"></div>

            <header className="fixed top-0 left-0 w-full z-50 p-8 lg:p-12">
                <div className="flex items-center gap-4">
                    <svg className="w-10 h-10 text-primary raccoon-logo" fill="currentColor" viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 4c2.5 0 4.5-1.5 5.5-3.5h-11c1 2 3 3.5 5.5 3.5z">
                        </path>
                    </svg>
                    <span className="text-white text-2xl font-black tracking-[0.3em] uppercase neon-text-strong">BeatDrop</span>
                </div>
            </header>

            <main className="relative z-30 w-full max-w-md px-6 flex flex-col items-center">
                <div
                    className="w-full relative bg-black/80 backdrop-blur-3xl border border-primary/30 rounded-sm p-10 lg:p-14 shadow-[0_0_100px_rgba(0,0,0,1)]">
                    <div className="flex justify-center mb-10">
                        <svg className="w-16 h-16 text-primary raccoon-logo" fill="currentColor" viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 4c2.5 0 4.5-1.5 5.5-3.5h-11c1 2 3 3.5 5.5 3.5z">
                            </path>
                        </svg>
                    </div>

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3 ml-1"
                                htmlFor="email">Email</label>
                            <input
                                className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 text-white text-sm focus:outline-none focus:ring-0 input-focus-glow transition-all placeholder:text-white/10"
                                id="email" placeholder="IDENTITY_REQUIRED" type="email"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-1"
                                    htmlFor="password">Password</label>
                                <a className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-primary transition-colors"
                                    href="#">Forgot?</a>
                            </div>
                            <input
                                className="w-full bg-black border border-white/10 rounded-sm px-6 py-5 text-white text-sm focus:outline-none focus:ring-0 input-focus-glow transition-all placeholder:text-white/10"
                                id="password" placeholder="●●●●●●●●" type="password"
                                value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className="pt-6">
                            <button
                                className="w-full bg-primary text-black py-5 rounded-sm text-[12px] font-black uppercase tracking-[0.5em] hover:brightness-110 transition-all neon-border-glow active:scale-[0.99] shadow-[0_0_30px_rgba(89,242,13,0.2)]"
                                type="submit">
                                Log In
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 relative flex items-center">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">OR</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <a
                            href={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/auth/google`}
                            className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-sm text-[12px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                            Continue with Google
                        </a>
                        <a
                            href={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/auth/spotify`}
                            className="w-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] py-4 rounded-sm text-[12px] font-black uppercase tracking-[0.2em] hover:bg-[#1DB954]/20 transition-all flex items-center justify-center gap-3">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
                            </svg>
                            Continue with Spotify
                        </a>
                    </div>
                    <div className="mt-12 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                            New to the network? <Link className="text-primary hover:text-primary/80 transition-colors" to="/register">Sign Up</Link>
                        </p>
                    </div>
                </div>
            </main>
            <footer className="fixed bottom-0 w-full p-10 text-center pointer-events-none">
                <p className="text-[9px] text-slate-800 font-bold uppercase tracking-[0.8em]">BeatDrop © 2024</p>
            </footer>
        </div>
    );
}
