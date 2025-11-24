import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Toast from '../components/Toast';
import '../styles/index.css';

interface Note {
    id: string;
    noteText: string;
    createdAt: string;
}

interface Photo {
    id: string;
    imageFile: string;
    caption?: string;
    isPortfolio: boolean;
    statusAtCapture?: string;
    annotations?: any;
    createdAt: string;
}

interface Project {
    id: string;
    jobNumber: string;
    clientName: string;
    siteAddress?: string;
    status: string;
    projectNotes?: string;
    photos: Photo[];
    notes: Note[];
}

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<'photos' | 'notes'>('photos');
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
    const [updatingPortfolio, setUpdatingPortfolio] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [generatingShare, setGeneratingShare] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (id) loadProject();
    }, [id]);

    const loadProject = async () => {
        try {
            const response = await api.get(`/projects/${id}`);
            setProject(response.data);
        } catch (error) {
            console.error('Failed to load project:', error);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!project) return;
        const oldStatus = project.status;
        setProject({ ...project, status: newStatus });
        setShowStatusMenu(false);

        try {
            await api.put(`/projects/${id}`, { status: newStatus });
            setToast({ message: `Status updated to ${newStatus}`, type: 'success' });
        } catch (error) {
            setProject({ ...project, status: oldStatus });
            setToast({ message: 'Failed to update status', type: 'error' });
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('photo', files[i]);
                formData.append('projectId', id!);
                await api.post('/photos', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            await loadProject();
            setShowPhotoModal(false);
            setToast({ message: 'Photos uploaded successfully', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to upload photo', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        try {
            await api.post('/notes', { projectId: id, noteText });
            setNoteText('');
            setShowNoteModal(false);
            await loadProject();
            setToast({ message: 'Note added', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to add note', type: 'error' });
        }
    };

    const togglePhotoSelection = (photoId: string) => {
        const newSelection = new Set(selectedPhotos);
        if (newSelection.has(photoId)) {
            newSelection.delete(photoId);
        } else {
            newSelection.add(photoId);
        }
        setSelectedPhotos(newSelection);
    };

    const handleBulkPortfolio = async () => {
        if (selectedPhotos.size === 0) return;
        setUpdatingPortfolio(true);
        try {
            await api.post('/photos/portfolio-bulk', {
                photoIds: Array.from(selectedPhotos),
                isPortfolio: true
            });
            await loadProject();
            setSelectionMode(false);
            setSelectedPhotos(new Set());
            setToast({ message: 'Added to portfolio', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to update portfolio', type: 'error' });
        } finally {
            setUpdatingPortfolio(false);
        }
    };

    const handleGenerateShare = async () => {
        setGeneratingShare(true);
        try {
            const response = await api.post(`/projects/${id}/share`);
            const fullUrl = `${window.location.origin}/share/${response.data.token}`;
            setShareUrl(fullUrl);
            setShowShareModal(true);
            setToast({ message: 'Share link generated!', type: 'success' });
        } catch (error: any) {
            setToast({ message: error.response?.data?.error || 'Failed to generate share link', type: 'error' });
        } finally {
            setGeneratingShare(false);
        }
    };

    const copyShareUrl = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setToast({ message: 'Link copied to clipboard!', type: 'success' });
        }
    };

    if (!project) {
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
        <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
            {/* Header */}
            <div style={{
                background: 'var(--color-surface)',
                padding: 'var(--space-md)',
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-header)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <button onClick={() => navigate('/projects')} style={{ padding: 'var(--space-sm)', fontSize: 'var(--font-size-lg)' }}>
                    ←
                </button>
                <h1 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>Project Details</h1>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button
                        onClick={handleGenerateShare}
                        disabled={generatingShare}
                        style={{
                            padding: 'var(--space-sm)',
                            fontSize: 'var(--font-size-md)',
                            color: 'var(--color-primary)',
                            background: 'none',
                            border: 'none',
                            cursor: generatingShare ? 'wait' : 'pointer'
                        }}
                    >
                        {generatingShare ? '...' : '🔗 Share'}
                    </button>
                    <button
                        onClick={() => navigate(`/projects/${id}/edit`)}
                        style={{
                            padding: 'var(--space-sm)',
                            fontSize: 'var(--font-size-md)',
                            color: 'var(--color-primary)'
                        }}
                    >
                        Edit
                    </button>
                </div>
            </div>

            <div className="container" style={{ paddingTop: 'var(--space-md)' }}>
                {/* Project Info Card */}
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                        <div>
                            <h2 style={{ fontSize: 'var(--font-size-xl)', margin: 0, marginBottom: 'var(--space-xs)' }}>
                                {project.jobNumber}
                            </h2>
                            <p className="text-light" style={{ margin: 0 }}>{project.clientName}</p>
                        </div>

                        {/* Status Dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowStatusMenu(!showStatusMenu)}
                                className={`status-pill status-${project.status.toLowerCase()}`}
                                style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                {project.status} ▾
                            </button>

                            {showStatusMenu && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowStatusMenu(false)} />
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: 'var(--space-xs)',
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: 'var(--shadow-lg)',
                                        zIndex: 100,
                                        minWidth: '140px',
                                        overflow: 'hidden'
                                    }}>
                                        {['SURVEY', 'INSTALL', 'REVISIT', 'COMPLETED'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusUpdate(status)}
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: 'var(--space-md)',
                                                    background: 'none',
                                                    border: 'none',
                                                    borderBottom: '1px solid var(--color-border-light)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {project.siteAddress && (
                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            📍 {project.siteAddress}
                        </p>
                    )}
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '4px',
                    marginBottom: 'var(--space-lg)',
                    border: '1px solid var(--color-border)'
                }}>
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={activeTab === 'photos' ? 'tab-active' : ''}
                        style={{
                            flex: 1,
                            padding: 'var(--space-md)',
                            background: activeTab === 'photos' ? 'var(--color-primary)' : 'transparent',
                            color: activeTab === 'photos' ? 'white' : 'var(--color-text)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'photos' ? 'bold' : 'normal'
                        }}
                    >
                        📸 Photos ({project.photos.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={activeTab === 'notes' ? 'tab-active' : ''}
                        style={{
                            flex: 1,
                            padding: 'var(--space-md)',
                            background: activeTab === 'notes' ? 'var(--color-primary)' : 'transparent',
                            color: activeTab === 'notes' ? 'white' : 'var(--color-text)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'notes' ? 'bold' : 'normal'
                        }}
                    >
                        📝 Notes ({project.notes.length})
                    </button>
                </div>

                {/* Photos Tab */}
                {activeTab === 'photos' && (
                    <div>
                        {/* Selection Mode Controls */}
                        {selectionMode ? (
                            <div style={{
                                marginBottom: 'var(--space-md)',
                                padding: 'var(--space-md)',
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>{selectedPhotos.size} selected</span>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button
                                        onClick={handleBulkPortfolio}
                                        disabled={selectedPhotos.size === 0 || updatingPortfolio}
                                        className="btn btn-primary btn-sm"
                                    >
                                        {updatingPortfolio ? 'Adding...' : `Add ${selectedPhotos.size} to Portfolio`}
                                    </button>
                                    <button onClick={() => { setSelectionMode(false); setSelectedPhotos(new Set()); }} className="btn btn-secondary btn-sm">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginBottom: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)' }}>
                                <button onClick={() => setShowPhotoModal(true)} className="btn btn-primary">
                                    + Add Photos
                                </button>
                                {project.photos.length > 0 && (
                                    <button onClick={() => setSelectionMode(true)} className="btn btn-secondary">
                                        Select for Portfolio
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Photo Grid */}
                        {project.photos.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: '#888' }}>
                                <p>No photos yet. Add some to get started!</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: 'var(--space-md)'
                            }}>
                                {project.photos.map(photo => (
                                    <div
                                        key={photo.id}
                                        onClick={() => selectionMode ? togglePhotoSelection(photo.id) : navigate(`/photos/${photo.id}`)}
                                        style={{
                                            position: 'relative',
                                            cursor: 'pointer',
                                            borderRadius: 'var(--radius-md)',
                                            overflow: 'hidden',
                                            border: selectionMode && selectedPhotos.has(photo.id) ? '3px solid var(--color-primary)' : 'none'
                                        }}
                                    >
                                        <img
                                            src={`http://localhost:3000/uploads/${photo.imageFile}`}
                                            alt={photo.caption || 'Project photo'}
                                            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                                        />
                                        {photo.isPortfolio && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                background: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8em'
                                            }}>
                                                ⭐ Portfolio
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                    <div>
                        <button onClick={() => setShowNoteModal(true)} className="btn btn-primary" style={{ marginBottom: 'var(--space-md)' }}>
                            + Add Note
                        </button>

                        {project.notes.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: '#888' }}>
                                <p>No notes yet. Add some to track important information!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {project.notes.map(note => (
                                    <div key={note.id} className="card">
                                        <p style={{ margin: 0, marginBottom: 'var(--space-xs)' }}>{note.noteText}</p>
                                        <p className="text-light" style={{ margin: 0, fontSize: '0.85em' }}>
                                            {new Date(note.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Photo Upload Modal */}
            {showPhotoModal && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setShowPhotoModal(false)} />
                    <div className="modal">
                        <h2>Add Photos</h2>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            style={{ marginBottom: 'var(--space-md)' }}
                        />
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowPhotoModal(false)} className="btn btn-secondary" disabled={uploading}>
                                Cancel
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary" disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Choose Files'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Note Modal */}
            {showNoteModal && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setShowNoteModal(false)} />
                    <div className="modal">
                        <h2>Add Note</h2>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Enter note..."
                            rows={4}
                            style={{ width: '100%', marginBottom: 'var(--space-md)', padding: 'var(--space-sm)' }}
                        />
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowNoteModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleAddNote} className="btn btn-primary">Add Note</button>
                        </div>
                    </div>
                </>
            )}

            {/* Share Modal */}
            {showShareModal && shareUrl && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setShowShareModal(false)} />
                    <div className="modal">
                        <h2>Share with Client</h2>
                        <p style={{ marginBottom: 'var(--space-md)', color: '#666' }}>
                            Share this link with your client for read-only access to this project.
                        </p>
                        <div style={{
                            background: '#f5f5f5',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-md)',
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            fontSize: '0.9em'
                        }}>
                            {shareUrl}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowShareModal(false)} className="btn btn-secondary">Close</button>
                            <button onClick={copyShareUrl} className="btn btn-primary">📋 Copy Link</button>
                        </div>
                    </div>
                </>
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
