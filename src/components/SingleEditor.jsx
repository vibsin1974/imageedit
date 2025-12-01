import React, { useState, useRef, useCallback } from 'react';
import { centerCrop, makeAspectCrop } from 'react-image-crop';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', width: '100%' }}>
      {!imageSrc ? (
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
          />
        </>
      )}
    </div>
  );
};

export default SingleEditor;
