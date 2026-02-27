import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to register');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50 p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight mb-2 text-white">Music Calendar</CardTitle>
                    <h2 className="text-xl text-zinc-400">Sign Up</h2>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 rounded bg-red-900/50 border border-red-500/50 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            Create Account
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-zinc-800 pt-6">
                    <p className="text-sm text-zinc-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                            Log In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
