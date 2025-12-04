import React, { useState, useRef, useCallback, useEffect } from 'react';
import { centerCrop, makeAspectCrop } from 'react-image-crop';
import { jsPDF } from 'jspdf';
import ImageUploader from './components/ImageUploader';
import EditorCanvas from './components/EditorCanvas';
import Toolbar from './components/Toolbar';
import BatchResize from './components/BatchResize';
import MergeTool from './components/MergeTool';

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

const createEmptyImage = (width = 636, height = 310) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  return canvas.toDataURL('image/png');
};

function App() {
  const [imageSrc, setImageSrc] = useState(createEmptyImage());
  const [canvasSize, setCanvasSize] = useState({ width: 636, height: 310 });
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [filters, setFilters] = useState(defaultFilters);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'batch'
  const [fillColor, setFillColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState(5);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectionMode, setSelectionMode] = useState(false); // Control whether crop is visible/active

  const handleCanvasResize = (width, height) => {
    setCanvasSize({ width, height });
    setImageSrc(createEmptyImage(width, height));
    // Reset crop and filters might be good, or keep them if possible. 
    // For now, let's reset to avoid issues with crop being out of bounds.
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const onImageUpload = (src) => {
    setImageSrc(src);
    setFilters(defaultFilters);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => onImageUpload(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e) => {
    const img = e.currentTarget;
    // No automatic crop on load
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

  const PADDING = 0;

  const getProcessedCanvas = (ignoreCrop = false) => {
    if (!imgRef.current) return null;

    const image = imgRef.current;
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    // 1. Create intermediate canvas for filters & rotation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate new dimensions if rotated
    const rad = (filters.rotate * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const newWidth = naturalWidth * cos + naturalHeight * sin;
    const newHeight = naturalWidth * sin + naturalHeight * cos;

    canvas.width = newWidth;
    canvas.height = newHeight;

    // Apply filters
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) hue-rotate(${filters.hueRotate}deg) blur(${filters.blur}px)`;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(filters.scale, filters.scale);
    ctx.scale(filters.flipHorizontal ? -1 : 1, filters.flipVertical ? -1 : 1);

    // Draw image centered
    ctx.drawImage(image, -naturalWidth / 2, -naturalHeight / 2);

    // If we are just downloading/saving the "full" image (which now means the full cropped area if it was cropped, 
    // but here 'ignoreCrop' means "ignore the CURRENT selection box").
    // However, if the user wants to "Save" the result of the crop, they usually crop first.
    // If they just hit "Save" with a selection active, they might expect the selection to be saved?
    // The user request said: "save 시 선택영역이 아닌 전체 이미지가 저장되도록".
    // So if I have a selection, Save should save the WHOLE image (the intermediate canvas).
    if (ignoreCrop || !completedCrop?.width || !completedCrop?.height) {
      return canvas;
    }

    // 2. Create crop canvas
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');

    // completedCrop is in pixel coordinates relative to the img element
    // Subtract PADDING to get coordinates relative to the actual image content
    const contentX = completedCrop.x - PADDING;
    const contentY = completedCrop.y - PADDING;

    // Scale from displayed size to natural size
    // img.width is the displayed content width (not including padding)
    const scale = naturalWidth / image.width;

    // Convert to natural coordinates
    const naturalX = contentX * scale;
    const naturalY = contentY * scale;
    const naturalWidth_crop = completedCrop.width * scale;
    const naturalHeight_crop = completedCrop.height * scale;

    cropCanvas.width = naturalWidth_crop;
    cropCanvas.height = naturalHeight_crop;

    // The rotated canvas has the image centered
    const offsetX = (canvas.width - naturalWidth) / 2;
    const offsetY = (canvas.height - naturalHeight) / 2;

    // Draw the exact crop area from the transformed canvas
    cropCtx.drawImage(
      canvas,
      offsetX + naturalX,
      offsetY + naturalY,
      naturalWidth_crop,
      naturalHeight_crop,
      0,
      0,
      naturalWidth_crop,
      naturalHeight_crop
    );

    return cropCanvas;
  };

  const handleCrop = () => {
    if (!completedCrop?.width || !completedCrop?.height) return;

    const canvas = getProcessedCanvas(false); // Respect crop for cropping action
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
    const canvas = getProcessedCanvas(true); // Ignore crop for download
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [filters, completedCrop]);

  const handleDownloadPdf = useCallback(() => {
    const canvas = getProcessedCanvas(true); // Ignore crop for download
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

  const handleFill = useCallback(() => {
    if (!imgRef.current) return;

    const canvas = document.createElement('canvas');
    const img = imgRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    // First, draw the existing image
    ctx.drawImage(img, 0, 0);

    // If there's a selection, fill only that area
    if (completedCrop?.width && completedCrop?.height) {
      // Calculate the scale from displayed size to natural size
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      // Convert crop coordinates to natural size
      const x = completedCrop.x * scaleX;
      const y = completedCrop.y * scaleY;
      const width = completedCrop.width * scaleX;
      const height = completedCrop.height * scaleY;

      // Fill the selected area
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);
    } else {
      // Fill the entire canvas if no selection
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Update image source
    setImageSrc(canvas.toDataURL('image/png'));
  }, [fillColor, completedCrop]);

  const handleBorder = useCallback(() => {
    if (!imgRef.current) return;

    const canvas = document.createElement('canvas');
    const img = imgRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    // First, draw the current image
    ctx.drawImage(img, 0, 0);

    // Set border style
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;

    // If there's a selection, draw border only around that area
    if (completedCrop?.width && completedCrop?.height) {
      // Calculate the scale from displayed size to natural size
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      // Convert crop coordinates to natural size
      const x = completedCrop.x * scaleX;
      const y = completedCrop.y * scaleY;
      const width = completedCrop.width * scaleX;
      const height = completedCrop.height * scaleY;

      // Draw border around the selected area
      ctx.strokeRect(x + borderWidth / 2, y + borderWidth / 2, width - borderWidth, height - borderWidth);
    } else {
      // Draw border around the entire canvas
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);
    }

    // Update image source
    setImageSrc(canvas.toDataURL('image/png'));
  }, [borderColor, borderWidth, completedCrop]);

  const handleSelectionModeToggle = () => {
    setSelectionMode(true);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleUnselect = () => {
    setSelectionMode(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (activeTab !== 'editor') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            onImageUpload(event.target.result);
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleUnselect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="app">
      <header className="header" style={{ padding: '0 2rem', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>ImageEdit</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '2rem', position: 'relative', right: '5cm' }}>
          <nav className="nav-tabs" style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setActiveTab('editor')}
              className={`nav-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
            >
              Single Editor
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`nav-tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
            >
              Batch Resize
            </button>
            <button
              onClick={() => setActiveTab('merge')}
              className={`nav-tab-btn ${activeTab === 'merge' ? 'active' : ''}`}
            >
              Merge
            </button>
          </nav>
          {activeTab === 'editor' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => {
                setImageSrc(createEmptyImage());
                handleUnselect();
              }}>New</button>
              <button className="btn btn-secondary" onClick={triggerFileUpload}>Open</button>
              <button className="btn btn-secondary" onClick={handleDownload}>Save</button>
              <button className="btn btn-secondary" onClick={handleDownloadPdf}>Save as PDF</button>
            </div>
          )}
        </div>
      </header>

      <main className="container" style={{ flexDirection: 'row', gap: '2rem', padding: '0 2rem 2rem 2rem' }}>
        {activeTab === 'editor' ? (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <EditorCanvas
              imageSrc={imageSrc}
              crop={selectionMode ? crop : undefined}
              completedCrop={selectionMode ? completedCrop : undefined}
              setCrop={setCrop}
              setCompletedCrop={setCompletedCrop}
              onImageLoad={onImageLoad}
              filterStyle={filters}
              imgRef={imgRef}
              selectionMode={selectionMode}
            />
            <Toolbar
              filters={filters}
              onFilterChange={handleFilterChange}
              onRotate={handleRotate}
              onZoom={handleZoom}
              onReset={handleReset}
              onDownload={handleDownload}
              onDownloadPdf={handleDownloadPdf}
              onClear={() => setImageSrc(createEmptyImage())}
              onFlip={handleFlip}
              selectionColor={selectionColor}
              onSelectionColorChange={setSelectionColor}
              onCrop={handleCrop}
              onOpen={triggerFileUpload}
              canvasSize={canvasSize}
              onCanvasResize={handleCanvasResize}
              fillColor={fillColor}
              onFillColorChange={setFillColor}
              onFill={handleFill}
              borderColor={borderColor}
              onBorderColorChange={setBorderColor}
              borderWidth={borderWidth}
              onBorderWidthChange={setBorderWidth}
              onBorder={handleBorder}
              selectionMode={selectionMode}
              onSelectionModeToggle={handleSelectionModeToggle}
              onUnselect={handleUnselect}
            />
          </>
        ) : activeTab === 'batch' ? (
          <div style={{ width: '100%' }}>
            <BatchResize />
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <MergeTool />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
