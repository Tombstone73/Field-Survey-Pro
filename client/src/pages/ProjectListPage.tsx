import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import '../styles/index.css';

interface Project {
    id: string;
    jobNumber: string;
    clientName: string;
    siteAddress?: string;
    status: 'SURVEY' | 'INSTALL' | 'REVISIT' | 'COMPLETED';
    createdAt: string;
    _count?: { photos: number; notes: number };
}

export default function ProjectListPage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [noOrganization, setNoOrganization] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const params: any = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const response = await api.get('/projects', { params });
            setProjects(response.data);
            setNoOrganization(false);
        } catch (error: any) {
            console.error('Failed to load projects:', error);
            // Check if error is due to no organization
            if (error.response?.status === 400 && error.response?.data?.error?.includes('organization')) {
                setNoOrganization(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadProjects();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // No Organization State
    if (noOrganization) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: 'var(--space-xl)' }}>
                    <div style={{ fontSize: '64px', marginBottom: 'var(--space-md)' }}>🏢</div>
                    <h2 style={{ marginBottom: 'var(--space-sm)' }}>Organization Required</h2>
                    <p style={{ color: '#666', marginBottom: 'var(--space-lg)' }}>
                        You need to create or join an organization before you can start creating projects.
                    </p>
                    <button
                        onClick={() => navigate('/account')}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        Go to Account Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
            {/* Header */}
            <div style={{
                background: 'var(--color-surface)',
                padding: 'var(--space-md) var(--space-lg)',
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-header)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h1 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>Projects</h1>
                {/* FAB for New Project */}
                <button
                    onClick={() => navigate('/projects/new')}
                    className="btn btn-primary"
                    style={{
                        borderRadius: 'var(--radius-full)',
                        width: '40px',
                        height: '40px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                    }}
                >
                    +
                </button>
            </div>

            <div className="container" style={{ paddingTop: 'var(--space-md)' }}>
                {/* Search and Filters */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ position: 'relative', marginBottom: 'var(--space-sm)' }}>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="🔍 Search projects..."
                            style={{
                                paddingLeft: '40px',
                                background: 'var(--color-surface)',
                                border: 'none',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-sm)', overflowX: 'auto', paddingBottom: '4px' }}>
                        {['', 'SURVEY', 'INSTALL', 'REVISIT', 'COMPLETED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    background: statusFilter === status ? 'var(--color-primary)' : 'var(--color-surface)',
                                    color: statusFilter === status ? 'white' : 'var(--color-text)',
                                    border: '1px solid var(--color-border)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {status || 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Projects List */}
                {loading ? (
                    <div className="text-center text-light" style={{ marginTop: 'var(--space-2xl)' }}>
                        <div className="spinner" style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid var(--color-border)',
                            borderTopColor: 'var(--color-primary)',
                            borderRadius: '50%',
                            margin: '0 auto var(--space-md)'
                        }}></div>
                        Loading projects...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center" style={{ padding: 'var(--space-2xl) var(--space-lg)' }}>
                        <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📋</div>
                        <h3 style={{ marginBottom: 'var(--space-sm)' }}>No projects yet</h3>
                        <p className="text-light">Tap the + button to create your first project.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="card card-clickable"
                                onClick={() => navigate(`/projects/${project.id}`)}
                                style={{ padding: 'var(--space-md)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xs)' }}>
                                    <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>
                                        {project.jobNumber}
                                    </h3>
                                    <span className={`status-pill status-${project.status.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                        {project.status}
                                    </span>
                                </div>

                                <p style={{ margin: 0, fontWeight: 'var(--font-weight-medium)' }}>
                                    {project.clientName}
                                </p>

                                {project.siteAddress && (
                                    <p className="text-light text-sm" style={{
                                        margin: '4px 0 var(--space-sm)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        📍 {project.siteAddress}
                                    </p>
                                )}

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 'var(--space-sm)',
                                    borderTop: '1px solid var(--color-border-light)',
                                    paddingTop: 'var(--space-sm)'
                                }}>
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-light)' }}>
                                        <span>📸 {project._count?.photos || 0}</span>
                                        <span>📝 {project._count?.notes || 0}</span>
                                    </div>
                                    <span className="text-sm text-light" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        {formatDate(project.createdAt)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
