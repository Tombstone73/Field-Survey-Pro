import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import '../styles/index.css';
import Toast from '../components/Toast';

interface Annotation {
    id: string;
    type: 'dimension' | 'text' | 'freehand';
    color: string;
    // Dimension specific
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    label?: string;
    // Text specific
    position?: { x: number; y: number };
    text?: string;
    // Freehand specific
    points?: { x: number; y: number }[];
}

interface Photo {
    id: string;
    projectId: string;
    imageFile: string;
    caption?: string;
    isPortfolio: boolean;
    statusAtCapture?: string;
    annotations?: Annotation[] | string; // Can be JSON string or parsed array
    createdAt: string;
}

export default function PhotoDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [parsedAnnotations, setParsedAnnotations] = useState<Annotation[]>([]);
    const [caption, setCaption] = useState('');
    const [isPortfolio, setIsPortfolio] = useState(false);
    const [showAnnotations, setShowAnnotations] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (id) loadPhoto();
    }, [id]);

    const loadPhoto = async () => {
        try {
            const response = await api.get(`/photos/${id}`);
            const photoData = response.data;
            setPhoto(photoData);
            setCaption(photoData.caption || '');
            setIsPortfolio(photoData.isPortfolio);

            if (photoData.annotations) {
                const anns = typeof photoData.annotations === 'string'
                    ? JSON.parse(photoData.annotations)
                    : photoData.annotations;
                setParsedAnnotations(anns || []);
            }
        } catch (error) {
            console.error('Failed to load photo:', error);
            setToast({ message: 'Failed to load photo', type: 'error' });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/photos/${id}`, { caption, isPortfolio });
            setToast({ message: 'Changes saved successfully', type: 'success' });
            setTimeout(() => navigate(`/projects/${photo?.projectId}`), 1000);
        } catch (error) {
            console.error('Failed to update photo:', error);
            setToast({ message: 'Failed to save changes', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const renderAnnotation = (ann: Annotation) => {
        if (ann.type === 'dimension' && ann.start && ann.end) {
            return (
                <g key={ann.id}>
                    <line
                        x1={`${ann.start.x * 100}%`} y1={`${ann.start.y * 100}%`}
                        x2={`${ann.end.x * 100}%`} y2={`${ann.end.y * 100}%`}
                        stroke={ann.color} strokeWidth="3"
                    />
                    <circle cx={`${ann.start.x * 100}%`} cy={`${ann.start.y * 100}%`} r="4" fill={ann.color} />
                    <circle cx={`${ann.end.x * 100}%`} cy={`${ann.end.y * 100}%`} r="4" fill={ann.color} />
                    <text
                        x={`${(ann.start.x + ann.end.x) / 2 * 100}%`}
                        y={`${(ann.start.y + ann.end.y) / 2 * 100}%`}
                        fill={ann.color}
                        fontSize="16"
                        fontWeight="bold"
                        textAnchor="middle"
                        dy="-10"
                        style={{ textShadow: '0px 0px 4px black' }}
                    >
                        {ann.label}
                    </text>
                </g>
            );
        } else if (ann.type === 'text' && ann.position) {
            return (
                <text
                    key={ann.id}
                    x={`${ann.position.x * 100}%`}
                    y={`${ann.position.y * 100}%`}
                    fill={ann.color}
                    fontSize="24"
                    fontWeight="bold"
                    style={{ textShadow: '0px 0px 4px black' }}
                >
                    {ann.text}
                </text>
            );
        } else if (ann.type === 'freehand' && ann.points) {
            return (
                <path
                    key={ann.id}
                    d={ann.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 1000} ${p.y * 1000}`).join(' ')}
                    stroke={ann.color}
                    strokeWidth="5"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                />
            );
        }
        return null;
    };

    if (!photo) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid var(--color-border)',
                    borderTopColor: 'var(--color-primary)',
                    borderRadius: '50%'
                }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
                background: 'var(--color-surface)',
                padding: 'var(--space-md)',
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-header)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate(`/projects/${photo.projectId}`)}
                        style={{
                            padding: 'var(--space-sm)',
                            fontSize: 'var(--font-size-lg)',
                            color: 'var(--color-text)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back
                    </button>
                    <h1 style={{ fontSize: 'var(--font-size-lg)', margin: '0 0 0 var(--space-md)' }}>Photo Details</h1>
                </div>

                <button
                    onClick={() => navigate(`/photos/${id}/annotate`)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    ✏️ Annotate
                </button>
            </div>

            <div className="container" style={{ padding: 'var(--space-md)', flex: 1 }}>
                {/* Image Container */}
                <div style={{
                    background: 'black',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    marginBottom: 'var(--space-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '300px',
                    position: 'relative',
                    padding: 'var(--space-sm)' // Add padding so image doesn't touch edges if full size
                }}>
                    <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '60vh' }}>
                        <img
                            src={`http://localhost:5001/uploads/${photo.imageFile}`}
                            alt="Project photo"
                            style={{
                                display: 'block',
                                maxWidth: '100%',
                                maxHeight: '60vh',
                                objectFit: 'contain'
                            }}
                        />

                        {/* Annotations Overlay */}
                        {showAnnotations && parsedAnnotations.length > 0 && (
                            <svg
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none'
                                }}
                                viewBox="0 0 1000 1000"
                                preserveAspectRatio="none"
                            >
                                {parsedAnnotations.map(renderAnnotation)}
                            </svg>
                        )}
                    </div>

                    {/* Toggle Switch (Floating) */}
                    <div style={{
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'white',
                        fontSize: '14px',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showAnnotations}
                                onChange={(e) => setShowAnnotations(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                            />
                            Show Annotations
                        </label>
                    </div>
                </div>

                <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    {/* Status at capture - read-only display */}
                    {photo.statusAtCapture && (
                        <div style={{
                            marginBottom: 'var(--space-lg)',
                            padding: 'var(--space-md)',
                            background: 'var(--color-surface-alt)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '4px solid var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)'
                        }}>
                            <div style={{ fontSize: '20px' }}>📸</div>
                            <div>
                                <p className="text-sm text-light" style={{ margin: 0 }}>
                                    Captured during phase:
                                </p>
                                <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
                                    {photo.statusAtCapture}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="caption" style={{ fontWeight: 'var(--font-weight-medium)' }}>Caption</label>
                        <textarea
                            id="caption"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Add a caption for this photo..."
                            style={{ minHeight: '100px', resize: 'vertical' }}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none',
                            padding: 'var(--space-sm)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: isPortfolio ? 'var(--color-surface-alt)' : 'transparent'
                        }}>
                            <input
                                type="checkbox"
                                checked={isPortfolio}
                                onChange={(e) => setIsPortfolio(e.target.checked)}
                                style={{ width: '20px', height: '20px', marginRight: 'var(--space-md)' }}
                            />
                            <div>
                                <span style={{ fontWeight: 'var(--font-weight-medium)' }}>⭐ Add to Portfolio</span>
                                <p className="text-sm text-light" style={{ margin: 0, marginTop: '2px' }}>
                                    Showcase this in your portfolio gallery
                                </p>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={handleSave}
                        className="btn btn-primary btn-full btn-large"
                        disabled={saving}
                        style={{ marginTop: 'var(--space-md)' }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

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
