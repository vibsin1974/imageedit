import React from 'react';
import {
    Download,
    RotateCw,
    ZoomIn,
    ZoomOut,
    Trash2,
    Crop as CropIcon,
    Sun,
    Contrast,
    Droplet,
    Image as ImageIcon,
    FlipHorizontal,
    FlipVertical,
    FileText
} from 'lucide-react';

const Toolbar = ({
    filters,
    onFilterChange,
    onRotate,
    onZoom,
    onReset,
    onDownload,
    onDownloadPdf,
    onClear,
    onFlip,
    selectionColor,
    onSelectionColorChange,
    onCrop
}) => {

    const filterControls = [
        { name: 'brightness', label: 'Brightness', icon: Sun, min: 0, max: 200, step: 1 },
        { name: 'contrast', label: 'Contrast', icon: Contrast, min: 0, max: 200, step: 1 },
        { name: 'saturate', label: 'Saturation', icon: Droplet, min: 0, max: 200, step: 1 },
        { name: 'grayscale', label: 'Grayscale', icon: ImageIcon, min: 0, max: 100, step: 1 },
        { name: 'sepia', label: 'Sepia', icon: ImageIcon, min: 0, max: 100, step: 1 },
        { name: 'blur', label: 'Blur', icon: ImageIcon, min: 0, max: 20, step: 0.1 },
    ];

    return (
        <div className="toolbar" style={{
            width: '300px',
            backgroundColor: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={onDownload}>
                        <Download size={18} /> Save
                    </button>
                    <button className="btn btn-secondary" onClick={onClear} title="New Image">
                        <Trash2 size={18} />
                    </button>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onDownloadPdf}>
                    <FileText size={18} /> Save as PDF
                </button>
            </div>

            <div className="control-group">
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Selection & Crop</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Border Color</label>
                        <input
                            type="color"
                            value={selectionColor}
                            onChange={(e) => onSelectionColorChange(e.target.value)}
                            style={{
                                width: '100%',
                                height: '36px',
                                padding: '0',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                backgroundColor: 'transparent'
                            }}
                        />
                    </div>
                    <button className="btn btn-secondary" style={{ flex: 1, height: '36px', alignSelf: 'flex-end' }} onClick={onCrop}>
                        <CropIcon size={18} /> Crop
                    </button>
                </div>
            </div>

            <div className="control-group">
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Transform</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => onRotate(90)}>
                        <RotateCw size={18} /> Rotate
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => onFlip('horizontal')} title="Flip Horizontal">
                        <FlipHorizontal size={18} />
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => onFlip('vertical')} title="Flip Vertical">
                        <FlipVertical size={18} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => onZoom(0.1)}>
                        <ZoomIn size={18} />
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => onZoom(-0.1)}>
                        <ZoomOut size={18} />
                    </button>
                </div>
            </div>

            <div className="control-group">
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Filters</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filterControls.map((control) => (
                        <div key={control.name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <control.icon size={14} /> {control.label}
                                </label>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{filters[control.name]}</span>
                            </div>
                            <input
                                type="range"
                                min={control.min}
                                max={control.max}
                                step={control.step}
                                value={filters[control.name]}
                                onChange={(e) => onFilterChange(control.name, parseFloat(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <button className="btn btn-secondary" onClick={onReset} style={{ marginTop: 'auto' }}>
                Reset All
            </button>
        </div>
    );
};

export default Toolbar;
