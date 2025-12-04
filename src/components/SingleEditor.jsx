import React, { useState, useRef, useCallback } from 'react';
import 'react-image-crop/dist/ReactCrop.css';
import { jsPDF } from 'jspdf';
import ImageUploader from './ImageUploader';
import EditorCanvas from './EditorCanvas';
import Toolbar from './Toolbar';

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

const SingleEditor = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [filters, setFilters] = useState(defaultFilters);
  const [selectionMode, setSelectionMode] = useState(false);
  const [fillColor, setFillColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState(5);
  const imgRef = useRef(null);

  const onImageUpload = (src) => {
    setImageSrc(src);
    setFilters(defaultFilters);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setSelectionMode(false);
  };

  const onImageLoad = (e) => {
    // No initial selection on load
    setCrop(undefined);
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
  };

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

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('edited-image.pdf');
  }, [filters, completedCrop]);

  const handleFill = () => {
    if (!imgRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = imgRef.current;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.drawImage(image, 0, 0);

    if (completedCrop?.width && completedCrop?.height) {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const fillX = completedCrop.x * scaleX;
      const fillY = completedCrop.y * scaleY;
      const fillWidth = completedCrop.width * scaleX;
      const fillHeight = completedCrop.height * scaleY;

      ctx.fillStyle = fillColor;
      ctx.fillRect(fillX, fillY, fillWidth, fillHeight);
    } else {
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    setImageSrc(canvas.toDataURL('image/png'));
  };

  const handleBorder = () => {
    if (!imgRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = imgRef.current;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.drawImage(image, 0, 0);

    if (completedCrop?.width && completedCrop?.height) {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const borderX = completedCrop.x * scaleX;
      const borderY = completedCrop.y * scaleY;
      const borderW = completedCrop.width * scaleX;
      const borderH = completedCrop.height * scaleY;

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(borderX, borderY, borderW, borderH);
    } else {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    setImageSrc(canvas.toDataURL('image/png'));
  };

  const handleCrop = () => {
    const canvas = getProcessedCanvas();
    if (!canvas) return;
    setImageSrc(canvas.toDataURL('image/png'));
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleUnselect = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setSelectionMode(false);
  };

  const fileInputRef = useRef(null);

  const handleOpenImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => onImageUpload(reader.result));
      reader.readAsDataURL(file);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', width: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      {!imageSrc ? (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ImageUploader onImageUpload={onImageUpload} />
        </div>
      ) : (
        <>
          <EditorCanvas
            imageSrc={imageSrc}
            crop={crop}
            onChange={(_, percentCrop) => {
              if (selectionMode) setCrop(percentCrop);
            }}
            onComplete={(c) => setCompletedCrop(c)}
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
            onClear={() => setImageSrc(null)}
            onFlip={handleFlip}
            selectionMode={selectionMode}
            onSelectionModeToggle={() => setSelectionMode(!selectionMode)}
            onUnselect={handleUnselect}
            onCrop={handleCrop}
            fillColor={fillColor}
            onFillColorChange={setFillColor}
            onFill={handleFill}
            borderColor={borderColor}
            onBorderColorChange={setBorderColor}
            borderWidth={borderWidth}
            onBorderWidthChange={setBorderWidth}
            onBorder={handleBorder}
            onOpen={handleOpenImage}
          />
        </>
      )}
    </div>
  );
};

export default SingleEditor;
