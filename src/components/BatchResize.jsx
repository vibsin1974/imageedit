import React, { useState, useCallback } from 'react';
import { Upload, X, Download, Image as ImageIcon, Settings, FileArchive } from 'lucide-react';
import JSZip from 'jszip';

const BatchResize = () => {
    const [images, setImages] = useState([]);
    const [settings, setSettings] = useState({
        mode: 'percentage', // 'percentage' | 'fixed'
        width: 800,
        height: 600,
        percentage: 50,
        maintainAspectRatio: true,
        quality: 0.9
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            originalSize: file.size,
            dimensions: null // Will be populated on load
        }));

        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index) => {
        setImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const updateImageDimensions = (index, width, height) => {
        setImages(prev => {
            const newImages = [...prev];
            newImages[index].dimensions = { width, height };
            return newImages;
        });
    };

    const processImages = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setProgress(0);

        const zip = new JSZip();
        const imgFolder = zip.folder("resized_images");

        try {
            for (let i = 0; i < images.length; i++) {
                const imgData = images[i];
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const img = new Image();
                img.src = imgData.preview;

                await new Promise((resolve) => {
                    img.onload = resolve;
                });

                let newWidth, newHeight;

                if (settings.mode === 'percentage') {
                    const ratio = settings.percentage / 100;
                    newWidth = img.naturalWidth * ratio;
                    newHeight = img.naturalHeight * ratio;
                } else {
                    if (settings.maintainAspectRatio) {
                        const ratio = Math.min(settings.width / img.naturalWidth, settings.height / img.naturalHeight);
                        // If only one dimension is set (conceptually), or we want to fit within box
                        // Let's assume 'fixed' means "fit within these dimensions" for aspect ratio
                        // Or if we want exact dimensions?
                        // Let's implement "Fit within" for aspect ratio
                        newWidth = img.naturalWidth * ratio;
                        newHeight = img.naturalHeight * ratio;

                        // If we want to force exact width/height, we'd ignore aspect ratio, but that usually distorts.
                        // Let's stick to fit within for now unless user unchecks aspect ratio
                        if (!settings.maintainAspectRatio) {
                            newWidth = settings.width;
                            newHeight = settings.height;
                        }
                    } else {
                        newWidth = settings.width;
                        newHeight = settings.height;
                    }
                }

                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', settings.quality));
                imgFolder.file(`resized_${imgData.name}`, blob);

                setProgress(((i + 1) / images.length) * 100);
            }

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "resized_images.zip";
            link.click();
        } catch (error) {
            console.error("Error processing images:", error);
            alert("An error occurred while processing images.");
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    return (
        <div className="batch-resize-container" style={{
            display: 'flex',
            gap: '2rem',
            height: 'calc(100vh - 100px)',
            color: 'var(--text-primary)'
        }}>
            {/* Left Panel: Settings */}
            <div className="settings-panel" style={{
                width: '300px',
                backgroundColor: 'var(--bg-secondary)',
                padding: '1.5rem',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                overflowY: 'auto'
            }}>
                <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} /> Settings
                </h2>

                <div className="control-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Resize Mode</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className={`btn ${settings.mode === 'percentage' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSettings(s => ({ ...s, mode: 'percentage' }))}
                            style={{ flex: 1 }}
                        >
                            Percentage
                        </button>
                        <button
                            className={`btn ${settings.mode === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSettings(s => ({ ...s, mode: 'fixed' }))}
                            style={{ flex: 1 }}
                        >
                            Fixed Size
                        </button>
                    </div>
                </div>

                {settings.mode === 'percentage' ? (
                    <div className="control-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Percentage: {settings.percentage}%
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="200"
                            value={settings.percentage}
                            onChange={(e) => setSettings(s => ({ ...s, percentage: parseInt(e.target.value) }))}
                            style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                        />
                    </div>
                ) : (
                    <div className="control-group">
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem' }}>Width (px)</label>
                                <input
                                    type="number"
                                    value={settings.width}
                                    onChange={(e) => setSettings(s => ({ ...s, width: parseInt(e.target.value) }))}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem' }}>Height (px)</label>
                                <input
                                    type="number"
                                    value={settings.height}
                                    onChange={(e) => setSettings(s => ({ ...s, height: parseInt(e.target.value) }))}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings.maintainAspectRatio}
                                onChange={(e) => setSettings(s => ({ ...s, maintainAspectRatio: e.target.checked }))}
                            />
                            Maintain Aspect Ratio (Fit)
                        </label>
                    </div>
                )}

                <div className="control-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Quality: {Math.round(settings.quality * 100)}%
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={settings.quality}
                        onChange={(e) => setSettings(s => ({ ...s, quality: parseFloat(e.target.value) }))}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                </div>

                <button
                    className="btn btn-primary"
                    onClick={processImages}
                    disabled={images.length === 0 || isProcessing}
                    style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                    {isProcessing ? (
                        <>Processing {Math.round(progress)}%...</>
                    ) : (
                        <><FileArchive size={18} /> Process & Download Zip</>
                    )}
                </button>
            </div>

            {/* Right Panel: Image List */}
            <div className="image-list-panel" style={{
                flex: 1,
                backgroundColor: 'var(--bg-secondary)',
                padding: '1.5rem',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ImageIcon size={20} /> Images ({images.length})
                    </h2>
                    <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={18} /> Add Images
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                <div className="image-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '1rem',
                    overflowY: 'auto',
                    flex: 1,
                    padding: '0.5rem'
                }}>
                    {images.map((img, index) => (
                        <div key={index} style={{
                            position: 'relative',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            border: '1px solid var(--border-color)'
                        }}>
                            <button
                                onClick={() => removeImage(index)}
                                style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    background: 'red',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                <X size={14} />
                            </button>
                            <div style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                <img
                                    src={img.preview}
                                    alt={img.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onLoad={(e) => updateImageDimensions(index, e.target.naturalWidth, e.target.naturalHeight)}
                                />
                            </div>
                            <div style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {img.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {img.dimensions ? `${img.dimensions.width}x${img.dimensions.height}` : 'Loading...'}
                            </div>
                        </div>
                    ))}
                    {images.length === 0 && (
                        <div style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'var(--text-secondary)',
                            opacity: 0.5
                        }}>
                            <Upload size={48} style={{ marginBottom: '1rem' }} />
                            <p>No images added yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BatchResize;
