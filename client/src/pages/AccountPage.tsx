import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Toast from '../components/Toast';
import '../styles/index.css';

interface Organization {
    id: string;
    name: string;
    joinCode: string;
    members: {
        id: string;
        role: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }[];
}

export default function AccountPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Create/Join forms
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        loadUserAndOrg();
    }, []);

    const loadUserAndOrg = async () => {
        try {
            const [userRes, orgRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/organizations/me')
            ]);
            setUser(userRes.data);
            setOrganization(orgRes.data.organization);
            setUserRole(orgRes.data.userRole);
        } catch (error) {
            console.error('Failed to load account data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgName.trim()) return;

        try {
            await api.post('/organizations', { name: orgName });
            setToast({ message: 'Organization created successfully!', type: 'success' });
            setOrgName('');
            setShowCreateForm(false);
            await loadUserAndOrg();
        } catch (error: any) {
            setToast({ message: error.response?.data?.error || 'Failed to create organization', type: 'error' });
        }
    };

    const handleJoinOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        try {
            await api.post('/organizations/join', { joinCode: joinCode.trim() });
            setToast({ message: 'Successfully joined organization!', type: 'success' });
            setJoinCode('');
            setShowJoinForm(false);
            await loadUserAndOrg();
        } catch (error: any) {
            setToast({ message: error.response?.data?.error || 'Failed to join organization', type: 'error' });
        }
    };

    const handleRegenerateCode = async () => {
        if (!confirm('Are you sure you want to regenerate the join code? The old code will no longer work.')) return;

        try {
            const response = await api.post('/organizations/regenerate-code');
            setOrganization(response.data.organization);
            setToast({ message: 'Join code regenerated successfully!', type: 'success' });
        } catch (error: any) {
            setToast({ message: error.response?.data?.error || 'Failed to regenerate code', type: 'error' });
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setToast({ message: 'Copied to clipboard!', type: 'success' });
    };

    if (loading) {
        return (
            <div style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--space-md)', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: 'var(--space-lg)' }}>Account Settings</h1>

            {/* User Info */}
            <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 style={{ marginBottom: 'var(--space-sm)' }}>User Information</h2>
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ marginTop: 'var(--space-sm)' }}>
                    Logout
                </button>
            </div>

            {/* Organization Section */}
            {!organization ? (
                <div className="card">
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>Organization</h2>
                    <p style={{ marginBottom: 'var(--space-md)', color: '#888' }}>
                        You need to create or join an organization to start using Field Survey Pro.
                    </p>

                    {!showCreateForm && !showJoinForm && (
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                                Create Organization
                            </button>
                            <button onClick={() => setShowJoinForm(true)} className="btn btn-secondary">
                                Join Organization
                            </button>
                        </div>
                    )}

                    {showCreateForm && (
                        <form onSubmit={handleCreateOrg} style={{ marginTop: 'var(--space-md)' }}>
                            <h3 style={{ marginBottom: 'var(--space-sm)' }}>Create New Organization</h3>
                            <input
                                type="text"
                                placeholder="Organization Name"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="input"
                                style={{ marginBottom: 'var(--space-sm)' }}
                                required
                            />
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button type="submit" className="btn btn-primary">Create</button>
                                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {showJoinForm && (
                        <form onSubmit={handleJoinOrg} style={{ marginTop: 'var(--space-md)' }}>
                            <h3 style={{ marginBottom: 'var(--space-sm)' }}>Join Organization</h3>
                            <input
                                type="text"
                                placeholder="Enter Join Code"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className="input"
                                style={{ marginBottom: 'var(--space-sm)' }}
                                required
                            />
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button type="submit" className="btn btn-primary">Join</button>
                                <button type="button" onClick={() => setShowJoinForm(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            ) : (
                <div className="card">
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>Organization</h2>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <p><strong>Name:</strong> {organization.name}</p>
                        <p><strong>Your Role:</strong> <span style={{
                            background: 'var(--color-primary)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85em'
                        }}>{userRole}</span></p>
                    </div>

                    {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                        <div style={{
                            marginBottom: 'var(--space-md)',
                            padding: 'var(--space-sm)',
                            background: '#f5f5f5',
                            borderRadius: '8px'
                        }}>
                            <p style={{ marginBottom: 'var(--space-xs)', fontWeight: 'bold' }}>Join Code:</p>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                                <code style={{
                                    background: 'white',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    fontSize: '1.2em',
                                    fontWeight: 'bold',
                                    flex: 1
                                }}>
                                    {organization.joinCode}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(organization.joinCode)}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Copy
                                </button>
                            </div>
                            <button
                                onClick={handleRegenerateCode}
                                className="btn btn-secondary btn-sm"
                                style={{ marginTop: 'var(--space-sm)' }}
                            >
                                Regenerate Code
                            </button>
                        </div>
                    )}

                    <h3 style={{ marginBottom: 'var(--space-sm)' }}>Members ({organization.members.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        {organization.members.map(member => (
                            <div
                                key={member.id}
                                style={{
                                    padding: 'var(--space-sm)',
                                    background: '#f9f9f9',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>{member.user.name}</p>
                                    <p style={{ fontSize: '0.9em', color: '#666' }}>{member.user.email}</p>
                                </div>
                                <span style={{
                                    background: member.role === 'OWNER' ? 'var(--color-primary)' : '#888',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.8em'
                                }}>
                                    {member.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
