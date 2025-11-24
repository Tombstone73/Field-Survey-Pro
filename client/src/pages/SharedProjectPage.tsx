import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import '../styles/index.css';

interface SharedProject {
    jobNumber: string;
    clientName: string;
    siteAddress?: string;
    status: string;
    photos: {
        id: string;
        imageFile: string;
        caption?: string;
        annotations?: string;
        statusAtCapture?: string;
        createdAt: string;
    }[];
    notes: {
        id: string;
        noteText: string;
        createdAt: string;
    }[];
}

export default function SharedProjectPage() {
    const { token } = useParams();
    const [project, setProject] = useState<SharedProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAnnotations, setShowAnnotations] = useState(true);

    useEffect(() => {
        loadSharedProject();
    }, [token]);

    const loadSharedProject = async () => {
        try {
            const response = await api.get(`/share/${token}`);
            setProject(response.data);
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    const renderAnnotations = (photo: any) => {
        if (!showAnnotations || !photo.annotations) return null;

        try {
            const annotations = typeof photo.annotations === 'string'
                ? JSON.parse(photo.annotations)
                : photo.annotations;

            if (!Array.isArray(annotations) || annotations.length === 0) return null;

            return (
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
                    {annotations.map((ann: any) => {
                        if (ann.type === 'dimension' && ann.start && ann.end) {
                            const lineWidth = ann.lineWidth || 5;
                            return (
                                <g key={ann.id}>
                                    <line
                                        x1={`${ann.start.x * 100}%`}
                                        y1={`${ann.start.y * 100}%`}
                                        x2={`${ann.end.x * 100}%`}
                                        y2={`${ann.end.y * 100}%`}
                                        stroke={ann.color}
                                        strokeWidth={lineWidth}
                                    />
                                    <circle cx={`${ann.start.x * 100}%`} cy={`${ann.start.y * 100}%`} r={lineWidth + 2} fill={ann.color} />
                                    <circle cx={`${ann.end.x * 100}%`} cy={`${ann.end.y * 100}%`} r={lineWidth + 2} fill={ann.color} />
                                    {ann.label && (
                                        <text
                                            x={`${(ann.start.x + ann.end.x) / 2 * 100}%`}
                                            y={`${(ann.start.y + ann.end.y) / 2 * 100}%`}
                                            fill={ann.color}
                                            fontSize={(ann.fontSize || 24) * 0.7}
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            dy="-10"
                                            style={{ textShadow: '0px 0px 4px black' }}
                                        >
                                            {ann.label}
                                        </text>
                                    )}
                                </g>
                            );
                        } else if (ann.type === 'text' && ann.position) {
                            return (
                                <text
                                    key={ann.id}
                                    x={`${ann.position.x * 100}%`}
                                    y={`${ann.position.y * 100}%`}
                                    fill={ann.color}
                                    fontSize={ann.fontSize || 24}
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
                                    d={ann.points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x * 1000} ${p.y * 1000}`).join(' ')}
                                    stroke={ann.color}
                                    strokeWidth={ann.lineWidth || 5}
                                    fill="none"
                                    vectorEffect="non-scaling-stroke"
                                />
                            );
                        }
                        return null;
                    })}
                </svg>
            );
        } catch (e) {
            console.error('Failed to render annotations:', e);
            return null;
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <p>Loading project...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <h2>Project Not Found</h2>
                <p style={{ color: '#888', marginTop: 'var(--space-sm)' }}>
                    {error || 'This share link is invalid or has expired.'}
                </p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            {/* Header */}
            <div style={{
                background: 'var(--color-primary)',
                color: 'white',
                padding: 'var(--space-md)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Field Survey Pro</h1>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Shared Project View</p>
            </div>

            {/* Project Info */}
            <div style={{ padding: 'var(--space-md)', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                    <h2 style={{ marginBottom: 'var(--space-sm)' }}>
                        {project.jobNumber} - {project.clientName}
                    </h2>
                    {project.siteAddress && (
                        <p style={{ color: '#666', marginBottom: 'var(--space-xs)' }}>
                            📍 {project.siteAddress}
                        </p>
                    )}
                    <p>
                        <span style={{
                            background: '#e0e0e0',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.9em'
                        }}>
                            {project.status}
                        </span>
                    </p>
                </div>

                {/* Photos */}
                {project.photos.length > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 style={{ margin: 0 }}>Photos ({project.photos.length})</h3>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={showAnnotations}
                                    onChange={(e) => setShowAnnotations(e.target.checked)}
                                />
                                <span>Show Annotations</span>
                            </label>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: 'var(--space-md)'
                        }}>
                            {project.photos.map(photo => (
                                <div key={photo.id} style={{
                                    background: 'white',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ position: 'relative', paddingTop: '75%', background: '#000' }}>
                                        <img
                                            src={`http://localhost:3000/uploads/${photo.imageFile}`}
                                            alt={photo.caption || 'Project photo'}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain'
                                            }}
                                        />
                                        {renderAnnotations(photo)}
                                    </div>
                                    {(photo.caption || photo.statusAtCapture) && (
                                        <div style={{ padding: 'var(--space-sm)' }}>
                                            {photo.caption && <p style={{ margin: '0 0 4px 0' }}>{photo.caption}</p>}
                                            {photo.statusAtCapture && (
                                                <p style={{ margin: 0, fontSize: '0.85em', color: '#888' }}>
                                                    Status: {photo.statusAtCapture}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {project.notes.length > 0 && (
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-md)' }}>Notes ({project.notes.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {project.notes.map(note => (
                                <div key={note.id} style={{
                                    padding: 'var(--space-sm)',
                                    background: '#f9f9f9',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid var(--color-primary)'
                                }}>
                                    <p style={{ margin: 0 }}>{note.noteText}</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85em', color: '#888' }}>
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {project.photos.length === 0 && project.notes.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: '#888' }}>
                        <p>No photos or notes have been added to this project yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
