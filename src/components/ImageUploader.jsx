import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const ImageUploader = ({ onImageUpload }) => {
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                onImageUpload(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="upload-container"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
            <input
                type="file"
                id="fileInput"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)'
            }}>
                <div style={{
                    background: 'var(--bg-tertiary)',
                    padding: '1.5rem',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    marginBottom: '1.5rem'
                }}>
                    <Upload size={48} color="var(--accent-primary)" />
                </div>
                <h3 style={{
                    fontSize: '1.25rem',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                }}>
                    Upload an Image
                </h3>
                <p>Drag and drop or click to browse</p>
                <p style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
                    Supports JPG, PNG, WEBP
                </p>
            </div>
        </motion.div>
    );
};

export default ImageUploader;
