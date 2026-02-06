import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to register');
        }
    };

    return (
        <div className="glass-container">
            <h1>Music Calendar</h1>
            <h2>Sign Up</h2>
            {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}

            <form onSubmit={handleSubmit} className="form-group">
                <input
                    className="input-field"
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
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
                    Create Account
                </button>
            </form>

            <p className="text-link">
                Already have an account? <Link to="/login">Log In</Link>
            </p>
        </div>
    );
}
