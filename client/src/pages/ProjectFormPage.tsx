import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import '../styles/index.css';

export default function ProjectFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        jobNumber: '',
        clientName: '',
        siteAddress: '',
        status: 'SURVEY',
        projectNotes: ''
    });
    const [loading, setLoading] = useState(false);
    const [loadingProject, setLoadingProject] = useState(isEditMode);
    const [error, setError] = useState('');

    // Load project data when editing
    useEffect(() => {
        if (isEditMode && id) {
            const loadProject = async () => {
                try {
                    const response = await api.get(`/projects/${id}`);
                    const project = response.data;
                    setFormData({
                        jobNumber: project.jobNumber || '',
                        clientName: project.clientName || '',
                        siteAddress: project.siteAddress || '',
                        status: project.status || 'SURVEY',
                        projectNotes: project.projectNotes || ''
                    });
                } catch (err: any) {
                    setError(err.response?.data?.error || 'Failed to load project');
                } finally {
                    setLoadingProject(false);
                }
            };
            loadProject();
        }
    }, [isEditMode, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isEditMode) {
                await api.put(`/projects/${id}`, formData);
                navigate(`/projects/${id}`);
            } else {
                const response = await api.post('/projects', formData);
                navigate(`/projects/${response.data.id}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} project`);
        } finally {
            setLoading(false);
        }
    };

    if (loadingProject) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-background)', padding: 'var(--space-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-light">Loading project...</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', padding: 'var(--space-lg)' }}>
            <div className="container" style={{ maxWidth: '600px' }}>
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <button onClick={() => navigate(isEditMode ? `/projects/${id}` : '/projects')} className="btn btn-secondary">
                        ← Back
                    </button>
                </div>

                <h1 style={{ marginBottom: 'var(--space-xl)' }}>
                    {isEditMode ? 'Edit Project' : 'New Project'}
                </h1>

                <div className="card" style={{ padding: 'var(--space-xl)' }}>
                    {error && (
                        <div style={{
                            padding: 'var(--space-md)',
                            marginBottom: 'var(--space-lg)',
                            background: 'var(--color-error)',
                            color: 'white',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="jobNumber">Job Number *</label>
                            <input
                                id="jobNumber"
                                type="text"
                                value={formData.jobNumber}
                                onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                                placeholder="e.g., J-2023-001"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="clientName">Client Name *</label>
                            <input
                                id="clientName"
                                type="text"
                                value={formData.clientName}
                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                placeholder="Enter client name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="siteAddress">Site Address</label>
                            <input
                                id="siteAddress"
                                type="text"
                                value={formData.siteAddress}
                                onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                                placeholder="123 Main St, City, State ZIP"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="SURVEY">Survey</option>
                                <option value="INSTALL">Install</option>
                                <option value="REVISIT">Revisit</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="projectNotes">Project Notes</label>
                            <textarea
                                id="projectNotes"
                                value={formData.projectNotes}
                                onChange={(e) => setFormData({ ...formData, projectNotes: e.target.value })}
                                placeholder="Add any notes about this project..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <button type="submit" className="btn btn-primary btn-large" style={{ flex: 1 }} disabled={loading}>
                                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Project' : 'Create Project')}
                            </button>
                            <button type="button" onClick={() => navigate(isEditMode ? `/projects/${id}` : '/projects')} className="btn btn-secondary btn-large">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
