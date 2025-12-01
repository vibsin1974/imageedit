import React, { useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const EditorCanvas = ({
    imageSrc,
    crop,
    completedCrop,
    setCrop,
    setCompletedCrop,
    onImageLoad,
    filterStyle,
    imgRef,
    selectionColor
}) => {

    return (
        <div className="editor-canvas" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            overflow: 'hidden',
            borderRadius: 'var(--radius-lg)',
            position: 'relative',
            minHeight: '500px'
        }}>
            <style>{`
                .ReactCrop__crop-selection {
                    border: 2px solid ${selectionColor} !important;
                    box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.5);
                }
                .ReactCrop__drag-handle::after {
                    background-color: ${selectionColor} !important;
                    border: 1px solid rgba(0,0,0,0.2);
                }
            `}</style>
            {imageSrc && (
                <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    style={{ maxHeight: '80vh' }}
                >
                    <img
                        ref={imgRef}
                        alt="Edit"
                        src={imageSrc}
                        style={{
                            display: 'block',
                            maxWidth: '100%',
                            maxHeight: '80vh',
                            filter: `brightness(${filterStyle.brightness}%) contrast(${filterStyle.contrast}%) saturate(${filterStyle.saturate}%) grayscale(${filterStyle.grayscale}%) sepia(${filterStyle.sepia}%) hue-rotate(${filterStyle.hueRotate}deg) blur(${filterStyle.blur}px)`,
                            transform: `rotate(${filterStyle.rotate}deg) scale(${filterStyle.scale}) scaleX(${filterStyle.flipHorizontal ? -1 : 1}) scaleY(${filterStyle.flipVertical ? -1 : 1})`,
                            transition: 'filter 0.1s ease-out, transform 0.2s ease-out'
                        }}
                        onLoad={onImageLoad}
                    />
                </ReactCrop>
            )}
        </div>
    );
};

export default EditorCanvas;
