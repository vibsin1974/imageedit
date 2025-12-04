import React from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const EditorCanvas = ({
    imageSrc,
    imgRef,
    crop,
    setCrop,
    setCompletedCrop,
    onImageLoad,
    selectionMode,
    filterStyle
}) => {
    return (
        <div className="canvas-container" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '2rem',
            minHeight: '600px',
            position: 'relative',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)'
        }}>
            {/* Custom styling for crop selection */}
            <style>{`
                .ReactCrop__crop-selection {
                    border: ${selectionMode ? '2px dashed rgba(99, 102, 241, 0.8)' : 'none'} !important;
                    background-color: rgba(99, 102, 241, 0.1) !important;
                    box-shadow: ${selectionMode ? '0 0 0 9999px rgba(0, 0, 0, 0.5)' : 'none'} !important;
                    display: ${selectionMode ? 'block' : 'none'} !important;
                }
                .ReactCrop__drag-handle {
                    display: ${selectionMode ? 'block' : 'none'} !important;
                }
                .ReactCrop__drag-handle::after {
                    background-color: rgba(99, 102, 241, 0.9) !important;
                    border: 2px solid rgba(255, 255, 255, 0.8) !important;
                    width: 12px !important;
                    height: 12px !important;
                }
                .ReactCrop {
                    cursor: ${selectionMode ? 'crosshair' : 'default'} !important;
                    max-width: 100% !important;
                    max-height: 70vh !important;
                }
                .ReactCrop__image {
                    max-width: 100% !important;
                    max-height: 70vh !important;
                }
            `}</style>

            <div className="canvas-wrapper" style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
            }}>
                {imageSrc ? (
                    <div className="image-display" style={{
                        position: 'relative',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        overflow: 'visible',
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}>
                        <ReactCrop
                            crop={crop}
                            onChange={(pixelCrop) => {
                                if (selectionMode) setCrop(pixelCrop);
                            }}
                            onComplete={(c) => setCompletedCrop(c)}
                            disabled={!selectionMode}
                            locked={!selectionMode}
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Canvas"
                                draggable={false}
                                onLoad={onImageLoad}
                                style={{
                                    display: 'block',
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    width: 'auto',
                                    height: 'auto',
                                    userSelect: 'none',
                                    filter: filterStyle ? `brightness(${filterStyle.brightness}%) contrast(${filterStyle.contrast}%) saturate(${filterStyle.saturate}%) grayscale(${filterStyle.grayscale}%) sepia(${filterStyle.sepia}%) hue-rotate(${filterStyle.hueRotate}deg) blur(${filterStyle.blur}px)` : 'none',
                                    transform: filterStyle ? `rotate(${filterStyle.rotate}deg) scale(${filterStyle.scale}) scaleX(${filterStyle.flipHorizontal ? -1 : 1}) scaleY(${filterStyle.flipVertical ? -1 : 1})` : 'none',
                                    transition: 'filter 0.2s ease, transform 0.2s ease'
                                }}
                            />
                        </ReactCrop>
                    </div>
                ) : (
                    <div className="empty-state" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        color: '#64748b',
                        textAlign: 'center',
                        padding: '3rem'
                    }}>
                        <svg
                            width="120"
                            height="120"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            style={{ opacity: 0.5 }}
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <div>
                            <h3 style={{
                                margin: '0 0 0.5rem 0',
                                fontSize: '1.25rem',
                                color: '#94a3b8',
                                fontWeight: 600
                            }}>
                                새로운 캔버스
                            </h3>
                            <p style={{
                                margin: 0,
                                fontSize: '0.95rem',
                                color: '#64748b'
                            }}>
                                이미지를 업로드하거나 붙여넣기하여 시작하세요
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Corner decoration */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '40px',
                height: '40px',
                borderTop: '2px solid rgba(99, 102, 241, 0.3)',
                borderRight: '2px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '0 8px 0 0',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                width: '40px',
                height: '40px',
                borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
                borderLeft: '2px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '0 0 0 8px',
                pointerEvents: 'none'
            }} />
        </div>
    );
};

export default EditorCanvas;
