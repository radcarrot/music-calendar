import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            toast.error('Password must be at least 8 characters long and contain at least one letter and one number.');
            return;
        }

        try {
            await register(name, email, password);
            navigate('/dashboard');
            toast.success('Registration successful. Welcome to BeatDrop!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to register');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-black dark">
            <style>{`
                .neon-text-strong {
                    text-shadow: 0 0 10px rgba(89, 242, 13, 0.4), 0 0 20px rgba(89, 242, 13, 0.4);
                }
                .neon-button {
                    box-shadow: 0 0 15px rgba(89, 242, 13, 0.4);
                }
                .neon-button:hover {
                    box-shadow: 0 0 25px rgba(89, 242, 13, 0.8);
                }
                .neon-border {
                    box-shadow: 0 0 15px rgba(89, 242, 13, 0.2), inset 0 0 10px rgba(89, 242, 13, 0.1);
                }
                .neon-input:focus {
                    box-shadow: 0 0 10px rgba(89, 242, 13, 0.4);
                    border-color: #59f20d;
                }
                .scanline-overlay {
                    background: linear-gradient(to bottom,
                            transparent,
                            transparent 50%,
                            rgba(89, 242, 13, 0.02) 50%,
                            rgba(89, 242, 13, 0.02));
                    background-size: 100% 4px;
                    pointer-events: none;
                }
                .bg-noise {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3BaseFilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/baseFilter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                    opacity: 0.03;
                }
                .light-leak {
                    background: radial-gradient(circle at 50% 50%, rgba(89, 242, 13, 0.15) 0%, transparent 70%);
                    filter: blur(60px);
                }
            `}</style>

            <div className="fixed inset-0 z-0">
                <img alt="Tokyo Neon Cityscape"
                    className="w-full h-full object-cover opacity-40 grayscale-[40%] contrast-125 scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKIjEF-JzZudqTfmKXO-x56uMkFhcf0Q9mJocWLXUA1iPgw_XH80mcWc60CTXeMTpUiZ8ima4oFW_8VfU7Ar9CTXFEM5a7bZn-buQy8oDg5uB3sBYsqxF_9PF4hoTC8Cta8E103TU8roWwRwP1xgVtb8T8uHB1Or2eO2BD3XcaCuSgmrasZ9aI1bfngzHsJsUHB0ZFeDTkI95mLS3QqVGblxRKlEzmnLzsfKeeVE8rF6TjGpdfnMtVPF61x5qljPjMTUT_jHJeDHip" />
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] light-leak"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] light-leak"></div>
            </div>
            <div className="fixed inset-0 pointer-events-none bg-noise z-10"></div>
            <div className="fixed inset-0 pointer-events-none scanline-overlay z-10"></div>

            <main className="relative z-20 w-full max-w-md px-6">
                <div className="bg-black/80 backdrop-blur-md border border-primary/40 p-8 md:p-12 rounded-none neon-border">
                    <div className="flex flex-col items-center mb-10">
                        <div className="text-primary drop-shadow-[0_0_12px_rgba(89,242,13,0.9)] mb-4">
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.83 0 1.5-.67 1.5-1.5S7.83 8 7 8s-1.5.67-1.5 1.5S6.17 11 7 11zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 8 17 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 4c2.5 0 4.5-1.5 5.5-3.5h-11c1 2 3 3.5 5.5 3.5z">
                                </path>
                            </svg>
                        </div>
                        <h1 className="text-white text-3xl font-black tracking-[0.3em] uppercase neon-text-strong">BeatDrop</h1>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2 group">
                            <label
                                className="block text-[11px] font-bold text-primary uppercase tracking-[0.2em] group-focus-within:neon-text-strong transition-all">
                                Username
                            </label>
                            <input
                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-none focus:ring-0 focus:outline-none transition-all neon-input placeholder:text-white/20 uppercase text-xs tracking-widest"
                                placeholder="Enter username" required type="text"
                                value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2 group">
                            <label
                                className="block text-[11px] font-bold text-primary uppercase tracking-[0.2em] group-focus-within:neon-text-strong transition-all">
                                Email
                            </label>
                            <input
                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-none focus:ring-0 focus:outline-none transition-all neon-input placeholder:text-white/20 uppercase text-xs tracking-widest"
                                placeholder="Enter email" required type="email"
                                value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2 group">
                            <label
                                className="block text-[11px] font-bold text-primary uppercase tracking-[0.2em] group-focus-within:neon-text-strong transition-all">
                                Password
                            </label>
                            <input
                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-none focus:ring-0 focus:outline-none transition-all neon-input placeholder:text-white/20 uppercase text-xs tracking-widest"
                                placeholder="••••••••" required type="password"
                                value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <div className="pt-6">
                            <button
                                className="w-full bg-primary text-black py-4 rounded-none text-sm font-black uppercase tracking-[0.3em] neon-button transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2"
                                type="submit">
                                Create Account
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
                            className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-none text-[12px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                            Continue with Google
                        </a>
                        <a
                            href={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/auth/spotify`}
                            className="w-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] py-4 rounded-none text-[12px] font-black uppercase tracking-[0.2em] hover:bg-[#1DB954]/20 transition-all flex items-center justify-center gap-3">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
                            </svg>
                            Continue with Spotify
                        </a>
                    </div>
                    <div className="mt-10 pt-8 border-t border-white/10 text-center">
                        <p className="text-slate-400 text-[11px] uppercase font-bold tracking-[0.2em]">
                            Already have an account? <Link
                                className="text-primary hover:text-white transition-colors underline underline-offset-4"
                                to="/login">Log In</Link>
                        </p>
                    </div>
                </div>
                <div className="mt-8 flex justify-center gap-8 text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
                    <a className="hover:text-primary transition-colors" href="#">Terms</a>
                    <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                    <a className="hover:text-primary transition-colors" href="#">Support</a>
                </div>
            </main >
            <div className="absolute bottom-6 right-6 text-[10px] font-mono text-primary/20 hidden lg:block tracking-widest">
                <p>35.6895 N, 139.6917 E</p>
            </div>
        </div >
    );
}
