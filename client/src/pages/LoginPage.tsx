import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/index.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/projects');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                <div className="text-center mb-xl">
                    <h1 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>📸 Field Survey Pro</h1>
                    <p className="text-light">Sign in to your account</p>
                </div>

                <div className="card" style={{ padding: 'var(--space-xl)' }}>
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{
                                padding: 'var(--space-md)',
                                marginBottom: 'var(--space-lg)',
                                background: 'var(--color-error)',
                                color: 'white',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--font-size-sm)'
                            }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-full btn-large" disabled={loading}>
                            {loading ? 'Signing in...' : 'Log In'}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-lg text-light">
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}
