import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import '../styles/index.css';

interface Photo {
    id: string;
    imageFile: string;
    caption?: string;
    createdAt: string;
    project: {
        jobNumber: string;
        clientName: string;
    };
}

export default function PortfolioPage() {
    const navigate = useNavigate();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPortfolioPhotos();
    }, []);

    const loadPortfolioPhotos = async () => {
        try {
            const response = await api.get('/photos', { params: { portfolio: 'true' } });
            setPhotos(response.data);
        } catch (error) {
            console.error('Failed to load portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

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
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <h1 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>⭐ Portfolio</h1>
            </div>

            <div className="container" style={{ paddingTop: 'var(--space-md)' }}>
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
                        Loading portfolio...
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center" style={{ padding: 'var(--space-2xl) var(--space-lg)' }}>
                        <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🖼️</div>
                        <h3 style={{ marginBottom: 'var(--space-sm)' }}>No portfolio photos</h3>
                        <p className="text-light">Mark photos as "Portfolio" in project details to showcase them here.</p>
                        <button
                            onClick={() => navigate('/projects')}
                            className="btn btn-primary"
                            style={{ marginTop: 'var(--space-lg)' }}
                        >
                            Go to Projects
                        </button>
                    </div>
                ) : (
                    <div className="photo-grid">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="photo-card"
                                onClick={() => navigate(`/photos/${photo.id}`)}
                                style={{ position: 'relative', cursor: 'pointer' }}
                            >
                                <img
                                    src={`http://localhost:3000/uploads/${photo.imageFile}`}
                                    alt={photo.caption || 'Portfolio photo'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                                    color: 'white',
                                    padding: 'var(--space-md) var(--space-sm) var(--space-sm)',
                                    fontSize: 'var(--font-size-xs)'
                                }}>
                                    <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)' }}>
                                        {photo.project.jobNumber}
                                    </div>
                                    <div style={{ opacity: 0.9, fontSize: '11px' }}>
                                        {photo.project.clientName}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
