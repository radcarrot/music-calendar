import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login');
        }
    };

    return (
        <div className="glass-container">
            <h1>Music Calendar</h1>
            <h2>Login</h2>
            {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}

            <form onSubmit={handleSubmit} className="form-group">
                <input
                    className="input-field"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    className="input-field"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="btn-primary">
                    Log In
                </button>
            </form>

            <p className="text-link">
                Need an account? <Link to="/register">Sign Up</Link>
            </p>
        </div>
    );
}
