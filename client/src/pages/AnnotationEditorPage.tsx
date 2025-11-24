import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import '../styles/index.css';
import Toast from '../components/Toast';

interface Annotation {
    id: string;
    type: 'dimension' | 'text' | 'freehand';
    color: string;
    fontSize?: number;
    // Dimension specific
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    label?: string;
    // Text specific
    position?: { x: number; y: number };
    text?: string;
    // Freehand specific
    points?: { x: number; y: number }[];
    lineWidth?: number;
}

export default function AnnotationEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selectedTool, setSelectedTool] = useState<'select' | 'dimension' | 'text' | 'freehand'>('select');
    const [selectedColor, setSelectedColor] = useState('#FFFF00'); // Default yellow
    const [selectedFontSize, setSelectedFontSize] = useState(24); // Default font size
    const [selectedLineWidth, setSelectedLineWidth] = useState(5); // Default line width
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [saving, setSaving] = useState(false);

    // Zoom & Pan state
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);

    // Drag/Resize state
    const [dragState, setDragState] = useState<{
        mode: 'move' | 'resizeStart' | 'resizeEnd' | 'none';
        startPoint: { x: number; y: number };
        originalAnnotation: Annotation | null;
    }>({ mode: 'none', startPoint: { x: 0, y: 0 }, originalAnnotation: null });

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (id) loadPhoto();
    }, [id]);

    const loadPhoto = async () => {
        try {
            const response = await api.get(`/photos/${id}`);
            setImageSrc(`http://localhost:3000/uploads/${response.data.imageFile}`);
            if (response.data.annotations) {
                const loadedAnnotations = typeof response.data.annotations === 'string'
                    ? JSON.parse(response.data.annotations)
                    : response.data.annotations;
                setAnnotations(loadedAnnotations || []);
            }
        } catch (error) {
            console.error('Failed to load photo:', error);
            setToast({ message: 'Failed to load photo', type: 'error' });
        }
    };

    const getNormalizedPoint = (e: React.MouseEvent | React.TouchEvent) => {
        if (!imageRef.current) return { x: 0, y: 0 };

        const rect = imageRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    };

    // Zoom handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(1, transform.scale + delta * transform.scale), 5);

            setTransform(prev => ({ ...prev, scale: newScale }));
        } else {
            if (transform.scale > 1) {
                setTransform(prev => ({
                    ...prev,
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY
                }));
            }
        }
    };

    const startDrag = (e: React.MouseEvent | React.TouchEvent, mode: 'move' | 'resizeStart' | 'resizeEnd', annotation: Annotation) => {
        if (selectedTool !== 'select') return;
        e.stopPropagation();
        const point = getNormalizedPoint(e);
        setSelectedAnnotationId(annotation.id);
        setDragState({
            mode,
            startPoint: point,
            originalAnnotation: annotation
        });
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        // Check for two-finger touch for pan
        if ('touches' in e && e.touches.length === 2) {
            setIsPanning(true);
            setPanStart({
                x: e.touches[0].clientX + e.touches[1].clientX,
                y: e.touches[0].clientY + e.touches[1].clientY
            });
            return;
        }

        // If we clicked a handle or annotation, startDrag would have fired and stopped propagation.
        // So if we are here, we clicked empty space.

        if (selectedTool === 'select') {
            setSelectedAnnotationId(null);
            return;
        }

        e.preventDefault(); // Prevent scrolling on touch
        const point = getNormalizedPoint(e);
        setIsDrawing(true);

        const newId = Math.random().toString(36).substr(2, 9);

        if (selectedTool === 'dimension') {
            setCurrentAnnotation({
                id: newId,
                type: 'dimension',
                color: selectedColor,
                fontSize: selectedFontSize,
                lineWidth: selectedLineWidth,
                start: point,
                end: point,
                label: '...'
            });
        } else if (selectedTool === 'freehand') {
            setCurrentAnnotation({
                id: newId,
                type: 'freehand',
                color: selectedColor,
                lineWidth: selectedLineWidth,
                points: [point]
            });
        } else if (selectedTool === 'text') {
            const text = prompt('Enter text label:', 'Label');
            if (text) {
                const newAnnotation: Annotation = {
                    id: newId,
                    type: 'text',
                    color: selectedColor,
                    fontSize: selectedFontSize,
                    position: point,
                    text
                };
                setAnnotations([...annotations, newAnnotation]);
            }
            setIsDrawing(false); // Text is instant, no drag
        }
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        // Handle Pan
        if (isPanning && 'touches' in e && e.touches.length === 2) {
            const currentX = e.touches[0].clientX + e.touches[1].clientX;
            const currentY = e.touches[0].clientY + e.touches[1].clientY;
            const deltaX = (currentX - panStart.x) / 2;
            const deltaY = (currentY - panStart.y) / 2;

            setTransform(prev => ({
                ...prev,
                x: prev.x + deltaX,
                y: prev.y + deltaY
            }));
            setPanStart({ x: currentX, y: currentY });
            return;
        }

        const point = getNormalizedPoint(e);

        // Handle Drag/Resize
        if (dragState.mode !== 'none' && dragState.originalAnnotation && selectedAnnotationId) {
            e.preventDefault();
            const { mode, startPoint, originalAnnotation } = dragState;
            const dx = point.x - startPoint.x;
            const dy = point.y - startPoint.y;

            const updated = { ...originalAnnotation };

            if (mode === 'move') {
                if (updated.type === 'text' && updated.position) {
                    updated.position = {
                        x: originalAnnotation.position!.x + dx,
                        y: originalAnnotation.position!.y + dy
                    };
                } else if (updated.type === 'dimension' && updated.start && updated.end) {
                    updated.start = {
                        x: originalAnnotation.start!.x + dx,
                        y: originalAnnotation.start!.y + dy
                    };
                    updated.end = {
                        x: originalAnnotation.end!.x + dx,
                        y: originalAnnotation.end!.y + dy
                    };
                } else if (updated.type === 'freehand' && updated.points) {
                    updated.points = originalAnnotation.points!.map(p => ({
                        x: p.x + dx,
                        y: p.y + dy
                    }));
                }
            } else if (mode === 'resizeStart' && updated.type === 'dimension') {
                updated.start = point;
            } else if (mode === 'resizeEnd' && updated.type === 'dimension') {
                updated.end = point;
            }

            setAnnotations(annotations.map(a => a.id === selectedAnnotationId ? updated : a));
            return;
        }

        if (!isDrawing || !currentAnnotation) return;
        e.preventDefault();

        if (selectedTool === 'dimension') {
            setCurrentAnnotation({
                ...currentAnnotation,
                end: point
            });
        } else if (selectedTool === 'freehand') {
            setCurrentAnnotation({
                ...currentAnnotation,
                points: [...(currentAnnotation.points || []), point]
            });
        }
    };

    const handleEnd = () => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (dragState.mode !== 'none') {
            setDragState({ mode: 'none', startPoint: { x: 0, y: 0 }, originalAnnotation: null });
            return;
        }

        if (!isDrawing || !currentAnnotation) return;

        if (selectedTool === 'dimension') {
            // Prompt for dimension length
            const label = prompt('Enter dimension (e.g. 10ft):', '0"');
            if (label) {
                setAnnotations([...annotations, { ...currentAnnotation, label }]);
            }
        } else {
            setAnnotations([...annotations, currentAnnotation]);
        }

        setIsDrawing(false);
        setCurrentAnnotation(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/photos/${id}/annotations`, { annotations: JSON.stringify(annotations) });
            setToast({ message: 'Annotations saved', type: 'success' });
            setTimeout(() => navigate(-1), 1000);
        } catch (error) {
            console.error('Failed to save annotations:', error);
            setToast({ message: 'Failed to save', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (selectedAnnotationId) {
            setAnnotations(annotations.filter(a => a.id !== selectedAnnotationId));
            setSelectedAnnotationId(null);
        }
    };

    const handleUndo = () => {
        setAnnotations(annotations.slice(0, -1));
    };

    const updateSelectedAnnotation = (updates: Partial<Annotation>) => {
        if (!selectedAnnotationId) return;
        setAnnotations(annotations.map(a =>
            a.id === selectedAnnotationId ? { ...a, ...updates } : a
        ));
    };

    // Render helpers
    const renderAnnotation = (ann: Annotation) => {
        const isSelected = selectedAnnotationId === ann.id;
        const style = {
            cursor: selectedTool === 'select' ? 'move' : 'default',
            filter: isSelected ? 'drop-shadow(0 0 4px white)' : 'none'
        };
        const fontSize = ann.fontSize || 24;
        const lineWidth = ann.lineWidth || 5;

        // Hit area props (invisible thick stroke)
        const hitProps = {
            stroke: 'transparent',
            strokeWidth: '30',
            fill: 'none',
            style: {
                cursor: selectedTool === 'select' ? 'move' : 'default',
                pointerEvents: 'stroke' as const
            },
            onMouseDown: (e: React.MouseEvent) => startDrag(e, 'move', ann),
            onTouchStart: (e: React.TouchEvent) => startDrag(e, 'move', ann)
        };

        if (ann.type === 'dimension' && ann.start && ann.end) {
            return (
                <g key={ann.id}>
                    {/* Hit Area */}
                    <line
                        x1={`${ann.start.x * 100}%`} y1={`${ann.start.y * 100}%`}
                        x2={`${ann.end.x * 100}%`} y2={`${ann.end.y * 100}%`}
                        {...hitProps}
                    />
                    {/* Visible */}
                    <g style={style}>
                        <line
                            x1={`${ann.start.x * 100}%`} y1={`${ann.start.y * 100}%`}
                            x2={`${ann.end.x * 100}%`} y2={`${ann.end.y * 100}%`}
                            stroke={ann.color} strokeWidth={lineWidth}
                            pointerEvents="none"
                        />
                        {/* Handles */}
                        {isSelected && selectedTool === 'select' && (
                            <>
                                <circle
                                    cx={`${ann.start.x * 100}%`} cy={`${ann.start.y * 100}%`} r="15"
                                    fill="rgba(255,255,255,0.5)" stroke={ann.color} strokeWidth="2"
                                    style={{ cursor: 'nwse-resize', pointerEvents: 'all' }}
                                    onMouseDown={(e) => startDrag(e, 'resizeStart', ann)}
                                    onTouchStart={(e) => startDrag(e, 'resizeStart', ann)}
                                />
                                <circle
                                    cx={`${ann.end.x * 100}%`} cy={`${ann.end.y * 100}%`} r="15"
                                    fill="rgba(255,255,255,0.5)" stroke={ann.color} strokeWidth="2"
                                    style={{ cursor: 'nwse-resize', pointerEvents: 'all' }}
                                    onMouseDown={(e) => startDrag(e, 'resizeEnd', ann)}
                                    onTouchStart={(e) => startDrag(e, 'resizeEnd', ann)}
                                />
                            </>
                        )}
                        <circle cx={`${ann.start.x * 100}%`} cy={`${ann.start.y * 100}%`} r={lineWidth + 2} fill={ann.color} pointerEvents="none" />
                        <circle cx={`${ann.end.x * 100}%`} cy={`${ann.end.y * 100}%`} r={lineWidth + 2} fill={ann.color} pointerEvents="none" />
                        <text
                            x={`${(ann.start.x + ann.end.x) / 2 * 100}%`}
                            y={`${(ann.start.y + ann.end.y) / 2 * 100}%`}
                            fill={ann.color}
                            fontSize={fontSize * 0.7}
                            fontWeight="bold"
                            textAnchor="middle"
                            dy="-10"
                            style={{ textShadow: '0px 0px 4px black', pointerEvents: 'none' }}
                        >
                            {ann.label}
                        </text>
                    </g>
                </g>
            );
        } else if (ann.type === 'text' && ann.position) {
            return (
                <text
                    key={ann.id}
                    x={`${ann.position.x * 100}%`}
                    y={`${ann.position.y * 100}%`}
                    fill={ann.color}
                    fontSize={fontSize}
                    fontWeight="bold"
                    onMouseDown={(e) => startDrag(e, 'move', ann)}
                    onTouchStart={(e) => startDrag(e, 'move', ann)}
                    style={{
                        ...style,
                        textShadow: '0px 0px 4px black',
                        pointerEvents: 'all',
                        userSelect: 'none'
                    }}
                >
                    {ann.text}
                </text>
            );
        } else if (ann.type === 'freehand' && ann.points) {
            return (
                <g key={ann.id}>
                    {/* Hit Area */}
                    <path
                        d={ann.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 1000} ${p.y * 1000}`).join(' ')}
                        vectorEffect="non-scaling-stroke"
                        {...hitProps}
                    />
                    {/* Visible */}
                    <path
                        d={ann.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 1000} ${p.y * 1000}`).join(' ')}
                        stroke={ann.color}
                        strokeWidth={lineWidth}
                        fill="none"
                        style={{ ...style, pointerEvents: 'none' }}
                        vectorEffect="non-scaling-stroke"
                    />
                </g>
            );
        }
        return null;
    };

    const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a', color: 'white' }}>
            {/* Toolbar */}
            <div style={{
                padding: 'var(--space-sm)',
                background: '#2a2a2a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem' }}>
                    ✕
                </button>

                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
                        className="btn btn-sm btn-secondary"
                        title="Reset Zoom"
                    >
                        Fit
                    </button>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                        {Math.round(transform.scale * 100)}%
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleUndo} disabled={annotations.length === 0} className="btn-icon">↩️</button>
                    <button onClick={handleDelete} disabled={!selectedAnnotationId} className="btn-icon">🗑️</button>
                    <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'none',
                    background: '#111'
                }}
                onWheel={handleWheel}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            >
                {imageSrc && (
                    <div style={{
                        position: 'relative',
                        display: 'inline-block',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        transformOrigin: 'center',
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                    }}>
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Annotation target"
                            style={{
                                display: 'block',
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }}
                        />
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
                            {annotations.map(renderAnnotation)}
                            {currentAnnotation && renderAnnotation(currentAnnotation)}
                        </svg>
                    </div>
                )}
            </div>

            {/* Properties Panel (if selection) or Tools (if no selection) */}
            <div style={{ padding: 'var(--space-md)', background: '#2a2a2a', borderTop: '1px solid #444' }}>
                {selectedAnnotationId && selectedAnnotation ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>Edit {selectedAnnotation.type}</span>
                            <button onClick={() => setSelectedAnnotationId(null)} style={{ background: 'none', border: 'none', color: '#888' }}>Done</button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {['#FFFF00', '#FF0000', '#00FFFF', '#00FF00', '#FFFFFF', '#000000'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => updateSelectedAnnotation({ color })}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: color,
                                        border: selectedAnnotation.color === color ? '3px solid white' : '1px solid #555',
                                        flexShrink: 0
                                    }}
                                />
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {/* Font Size / Line Width */}
                            {(selectedAnnotation.type === 'text' || selectedAnnotation.type === 'dimension') && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Size:</span>
                                    <input
                                        type="range" min="12" max="72" step="4"
                                        value={selectedAnnotation.fontSize || 24}
                                        onChange={(e) => updateSelectedAnnotation({ fontSize: parseInt(e.target.value) })}
                                    />
                                </div>
                            )}

                            {(selectedAnnotation.type === 'freehand' || selectedAnnotation.type === 'dimension') && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Width:</span>
                                    <input
                                        type="range" min="1" max="20" step="1"
                                        value={selectedAnnotation.lineWidth || 5}
                                        onChange={(e) => updateSelectedAnnotation({ lineWidth: parseInt(e.target.value) })}
                                    />
                                </div>
                            )}
                        </div>

                        {selectedAnnotation.type === 'text' && (
                            <button
                                onClick={() => {
                                    const newText = prompt('Edit text:', selectedAnnotation.text);
                                    if (newText) updateSelectedAnnotation({ text: newText });
                                }}
                                className="btn btn-secondary btn-sm"
                            >
                                Edit Text
                            </button>
                        )}

                        <button onClick={handleDelete} className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }}>
                            Delete Annotation
                        </button>
                    </div>
                ) : (
                    /* Default Tools View */
                    <>
                        {/* Colors */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', justifyContent: 'center' }}>
                            {['#FFFF00', '#FF0000', '#00FFFF', '#00FF00', '#FFFFFF', '#000000'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: color,
                                        border: selectedColor === color ? '3px solid white' : '1px solid #555',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Tool Settings (Size/Width) */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
                            {(selectedTool === 'text' || selectedTool === 'dimension') && (
                                <select
                                    value={selectedFontSize}
                                    onChange={(e) => setSelectedFontSize(parseInt(e.target.value))}
                                    style={{ background: '#444', color: 'white', border: 'none', padding: '4px', borderRadius: '4px' }}
                                >
                                    {[16, 24, 32, 48, 64].map(s => <option key={s} value={s}>{s}px Text</option>)}
                                </select>
                            )}
                            {(selectedTool === 'freehand' || selectedTool === 'dimension') && (
                                <select
                                    value={selectedLineWidth}
                                    onChange={(e) => setSelectedLineWidth(parseInt(e.target.value))}
                                    style={{ background: '#444', color: 'white', border: 'none', padding: '4px', borderRadius: '4px' }}
                                >
                                    {[3, 5, 8, 12, 20].map(w => <option key={w} value={w}>{w}px Line</option>)}
                                </select>
                            )}
                        </div>

                        {/* Tools */}
                        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                            {[
                                { id: 'select', icon: '👆', label: 'Select' },
                                { id: 'dimension', icon: '📏', label: 'Measure' },
                                { id: 'text', icon: 'T', label: 'Text' },
                                { id: 'freehand', icon: '✏️', label: 'Draw' }
                            ].map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setSelectedTool(tool.id as any)}
                                    style={{
                                        background: selectedTool === tool.id ? 'var(--color-primary)' : 'transparent',
                                        border: '1px solid #555',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        color: 'white',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: '64px'
                                    }}
                                >
                                    <span style={{ fontSize: '20px' }}>{tool.icon}</span>
                                    <span style={{ fontSize: '12px', marginTop: '4px' }}>{tool.label}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
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
