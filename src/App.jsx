import React, { useState, useRef, useCallback } from 'react';
import { centerCrop, makeAspectCrop } from 'react-image-crop';
import { jsPDF } from 'jspdf';
import ImageUploader from './components/ImageUploader';
import EditorCanvas from './components/EditorCanvas';
import Toolbar from './components/Toolbar';
import BatchResize from './components/BatchResize';

const defaultFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  blur: 0,
  rotate: 0,
  scale: 1,
  flipHorizontal: false,
  flipVertical: false,
};

function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [filters, setFilters] = useState(defaultFilters);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'batch'
  const imgRef = useRef(null);

  const onImageUpload = (src) => {
    setImageSrc(src);
    setFilters(defaultFilters);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 9,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRotate = (angle) => {
    setFilters(prev => ({ ...prev, rotate: (prev.rotate + angle) % 360 }));
  };

  const handleZoom = (delta) => {
    setFilters(prev => ({ ...prev, scale: Math.max(0.1, prev.scale + delta) }));
  };

  const handleFlip = (direction) => {
    setFilters(prev => ({
      ...prev,
      [direction === 'horizontal' ? 'flipHorizontal' : 'flipVertical']: !prev[direction === 'horizontal' ? 'flipHorizontal' : 'flipVertical']
    }));
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    if (imgRef.current) {
      // Reset crop logic if needed
    }
  };

  const [selectionColor, setSelectionColor] = useState('#6366f1');

  const getProcessedCanvas = () => {
    if (!imgRef.current) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = imgRef.current;

    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    // Apply filters
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) hue-rotate(${filters.hueRotate}deg) blur(${filters.blur}px)`;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((filters.rotate * Math.PI) / 180);
    ctx.scale(filters.scale, filters.scale);
    ctx.scale(filters.flipHorizontal ? -1 : 1, filters.flipVertical ? -1 : 1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(image, 0, 0);

    // If cropped
    if (completedCrop?.width && completedCrop?.height) {
      const cropCanvas = document.createElement('canvas');
      const cropCtx = cropCanvas.getContext('2d');

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;

      cropCtx.drawImage(
        canvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
      return cropCanvas;
    }

    return canvas;
  };

  const handleCrop = () => {
    if (!completedCrop?.width || !completedCrop?.height) return;

    const canvas = getProcessedCanvas();
    if (canvas) {
      const newImageSrc = canvas.toDataURL('image/png');
      setImageSrc(newImageSrc);
      setCrop(undefined);
      setCompletedCrop(undefined);
      // Reset filters as they are baked into the new image
      setFilters(defaultFilters);
    }
  };

  const handleDownload = useCallback(() => {
    const canvas = getProcessedCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [filters, completedCrop]);

  const handleDownloadPdf = useCallback(() => {
    const canvas = getProcessedCanvas();
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png');

    // Calculate PDF dimensions (fit image to A4 or use image size)
    // For simplicity, let's make PDF size match image size (converted to points? or just fit A4)
    // Let's fit to A4 portrait for now, or landscape if image is wide.

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height] // Custom size matching image
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('edited-image.pdf');
  }, [filters, completedCrop]);

  return (
    <div className="app">
      <header className="header container">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1>ImageEdit</h1>
          <nav className="nav-tabs" style={{ display: 'flex', gap: '1rem', marginLeft: '3rem' }}>
            <button
              onClick={() => setActiveTab('editor')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'editor' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: activeTab === 'editor' ? 'bold' : 'normal',
                padding: '0.5rem 1rem',
                borderBottom: activeTab === 'editor' ? '2px solid var(--accent-primary)' : '2px solid transparent'
              }}
            >
              Single Editor
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'batch' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: activeTab === 'batch' ? 'bold' : 'normal',
                padding: '0.5rem 1rem',
                borderBottom: activeTab === 'batch' ? '2px solid var(--accent-primary)' : '2px solid transparent'
              }}
            >
              Batch Resize
            </button>
          </nav>
        </div>
        <div className="actions">
          {/* Header actions if any */}
        </div>
      </header>

      <main className="container" style={{ flexDirection: 'row', gap: '2rem', padding: '0 2rem 2rem 2rem' }}>
        {activeTab === 'editor' ? (
          !imageSrc ? (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ImageUploader onImageUpload={onImageUpload} />
            </div>
          ) : (
            <>
              <EditorCanvas
                imageSrc={imageSrc}
                crop={crop}
                completedCrop={completedCrop}
                setCrop={setCrop}
                setCompletedCrop={setCompletedCrop}
                onImageLoad={onImageLoad}
                filterStyle={filters}
                imgRef={imgRef}
                selectionColor={selectionColor}
              />
              <Toolbar
                filters={filters}
                onFilterChange={handleFilterChange}
                onRotate={handleRotate}
                onZoom={handleZoom}
                onReset={handleReset}
                onDownload={handleDownload}
                onDownloadPdf={handleDownloadPdf}
                onClear={() => setImageSrc(null)}
                onFlip={handleFlip}
                selectionColor={selectionColor}
                onSelectionColorChange={setSelectionColor}
                onCrop={handleCrop}
              />
            </>
          )
        ) : (
          <div style={{ width: '100%' }}>
            <BatchResize />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
