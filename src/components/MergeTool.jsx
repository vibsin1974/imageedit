import React, { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Download, Loader, ArrowUp, ArrowDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using bundled version
if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();
}

const MergeTool = () => {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [spacing, setSpacing] = useState(0); // 0: 없음, 10: 좁게, 20: 보통, 40: 넓게

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                id: Math.random().toString(36).substr(2, 9),
                preview: URL.createObjectURL(file),
                type: file.type
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const newFiles = Array.from(droppedFiles).map(file => ({
                file,
                id: Math.random().toString(36).substr(2, 9),
                preview: URL.createObjectURL(file),
                type: file.type
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const moveFileUp = (index) => {
        if (index === 0) return;
        setFiles(prev => {
            const newFiles = [...prev];
            [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
            return newFiles;
        });
    };

    const moveFileDown = (index) => {
        setFiles(prev => {
            if (index >= prev.length - 1) return prev;
            const newFiles = [...prev];
            [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
            return newFiles;
        });
    };

    const processFileToImages = async (fileObj) => {
        if (fileObj.type.startsWith('image/')) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve([img]);
                img.src = fileObj.preview;
            });
        } else if (fileObj.type === 'application/pdf') {
            try {
                const arrayBuffer = await fileObj.file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const images = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport: viewport }).promise;

                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const img = await new Promise((resolve) => {
                        const image = new Image();
                        image.onload = () => resolve(image);
                        image.src = imgData;
                    });
                    images.push(img);
                }
                return images;
            } catch (error) {
                console.error('Error processing PDF:', error);
                throw error;
            }
        }
        return [];
    };


    const handleMergeImage = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);

        try {
            const images = [];
            let maxWidth = 0;

            for (const fileObj of files) {
                const fileImages = await processFileToImages(fileObj);
                for (const img of fileImages) {
                    images.push(img);
                    maxWidth = Math.max(maxWidth, img.width);
                }
            }

            const scaledImages = images.map(img => {
                const scale = maxWidth / img.width;
                return {
                    img,
                    width: maxWidth,
                    height: img.height * scale
                };
            });

            // Calculate total height including spacing
            const totalSpacing = spacing * (scaledImages.length - 1);
            const totalHeight = scaledImages.reduce((sum, scaled) => sum + scaled.height, 0) + totalSpacing;

            const canvas = document.createElement('canvas');
            canvas.width = maxWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext('2d');

            // Fill background with white if there's spacing
            if (spacing > 0) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, maxWidth, totalHeight);
            }

            let currentY = 0;
            for (let i = 0; i < scaledImages.length; i++) {
                const scaled = scaledImages[i];
                ctx.drawImage(scaled.img, 0, currentY, scaled.width, scaled.height);
                currentY += scaled.height;

                // Add spacing after each image except the last one
                if (i < scaledImages.length - 1) {
                    currentY += spacing;
                }
            }

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'merged.png';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);

                // Clear files after successful merge
                setFiles([]);
                setIsProcessing(false);
            }, 'image/png');

        } catch (error) {
            console.error('Error merging images:', error);
            alert('Failed to merge files: ' + error.message);
            setIsProcessing(false);
        }
    };

    const handleMergePDF = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);

        try {
            let doc = null;
            let isFirstPage = true;

            for (const fileObj of files) {
                const images = await processFileToImages(fileObj);

                for (const img of images) {
                    if (isFirstPage) {
                        doc = new jsPDF({
                            orientation: img.width > img.height ? 'landscape' : 'portrait',
                            unit: 'px',
                            format: [img.width, img.height]
                        });
                        isFirstPage = false;
                    } else {
                        doc.addPage([img.width, img.height]);
                    }

                    doc.addImage(img, 'JPEG', 0, 0, img.width, img.height);
                }
            }

            doc.save('merged.pdf');

            // Clear files after successful merge
            setFiles([]);
        } catch (error) {
            console.error('Error merging PDF:', error);
            alert('Failed to merge files: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMerge = () => {
        const allImages = files.every(f => f.type.startsWith('image/'));

        if (allImages) {
            handleMergeImage();
        } else {
            handleMergePDF();
        }
    };

    const allImages = files.length > 0 && files.every(f => f.type.startsWith('image/'));

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div className="card" style={{ backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Merge Files</h2>

                <div
                    onClick={() => document.getElementById('mergeInput').click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '3rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginBottom: '2rem',
                        backgroundColor: 'var(--bg-primary)'
                    }}
                >
                    <input
                        type="file"
                        id="mergeInput"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <Upload size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Click or drag files to upload</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Supports JPG, PNG, PDF</p>
                </div>

                {/* Spacing Options - Only show for images */}
                {files.length > 0 && allImages && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                            이미지 간격
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className={`btn ${spacing === 0 ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSpacing(0)}
                                style={{ flex: 1, fontSize: '0.875rem' }}
                            >
                                없음
                            </button>
                            <button
                                className={`btn ${spacing === 10 ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSpacing(10)}
                                style={{ flex: 1, fontSize: '0.875rem' }}
                            >
                                좁게 (10px)
                            </button>
                            <button
                                className={`btn ${spacing === 20 ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSpacing(20)}
                                style={{ flex: 1, fontSize: '0.875rem' }}
                            >
                                보통 (20px)
                            </button>
                            <button
                                className={`btn ${spacing === 40 ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSpacing(40)}
                                style={{ flex: 1, fontSize: '0.875rem' }}
                            >
                                넓게 (40px)
                            </button>
                        </div>
                    </div>
                )}

                {files.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Selected Files ({files.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {files.map((file, index) => (
                                <div key={file.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--bg-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <span style={{ color: 'var(--text-secondary)', marginRight: '1rem', fontSize: '0.875rem' }}>{index + 1}</span>
                                    {file.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                    <span style={{ marginLeft: '1rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {file.file.name}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => moveFileUp(index)}
                                            disabled={index === 0}
                                            style={{
                                                color: 'var(--text-secondary)',
                                                padding: '0.25rem',
                                                opacity: index === 0 ? 0.3 : 1,
                                                cursor: index === 0 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <ArrowUp size={18} />
                                        </button>
                                        <button
                                            onClick={() => moveFileDown(index)}
                                            disabled={index === files.length - 1}
                                            style={{
                                                color: 'var(--text-secondary)',
                                                padding: '0.25rem',
                                                opacity: index === files.length - 1 ? 0.3 : 1,
                                                cursor: index === files.length - 1 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <ArrowDown size={18} />
                                        </button>
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            style={{ color: 'var(--text-secondary)', padding: '0.25rem' }}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleMerge}
                        disabled={files.length === 0 || isProcessing}
                        style={{ flex: 1, opacity: (files.length === 0 || isProcessing) ? 0.5 : 1 }}
                    >
                        {isProcessing ? (
                            <>
                                <Loader className="spin" size={18} /> Processing...
                            </>
                        ) : (
                            <>
                                <Download size={18} /> Merge & Download {allImages ? 'Image' : 'PDF'}
                            </>
                        )}
                    </button>
                </div>
            </div>
            <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default MergeTool;
