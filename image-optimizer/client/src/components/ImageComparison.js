import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

const ImageComparison = ({
    originalImage,
    optimizedImage,
    originalSize,
    optimizedSize,
    compressionRatio,
    onDownload
}) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [showLabels, setShowLabels] = useState(true);
    const [zoom, setZoom] = useState(1);

    const handleSliderChange = (e) => {
        setSliderPosition(e.target.value);
    };

    const resetSlider = () => {
        setSliderPosition(50);
    };

    const toggleLabels = () => {
        setShowLabels(!showLabels);
    };

    const handleZoom = (direction) => {
        if (direction === 'in' && zoom < 3) {
            setZoom(zoom + 0.5);
        } else if (direction === 'out' && zoom > 0.5) {
            setZoom(zoom - 0.5);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getSavingsPercentage = () => {
        if (!originalSize || !optimizedSize) return 0;
        return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="image-comparison"
        >
            {/* Stats Header */}
            <div className="comparison-stats">
                <div className="stat-item">
                    <span className="stat-label">Original</span>
                    <span className="stat-value">{formatFileSize(originalSize)}</span>
                </div>
                <div className="stat-item savings">
                    <span className="stat-label">Saved</span>
                    <span className="stat-value">{getSavingsPercentage()}%</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Optimized</span>
                    <span className="stat-value">{formatFileSize(optimizedSize)}</span>
                </div>
            </div>

            {/* Comparison Container */}
            <div className="comparison-container">
                <div className="image-wrapper" style={{ transform: `scale(${zoom})` }}>
                    {/* Original Image */}
                    <div className="image-layer original">
                        <img src={originalImage} alt="Original" />
                        {showLabels && (
                            <div className="image-label original-label">
                                Original
                            </div>
                        )}
                    </div>

                    {/* Optimized Image */}
                    <div
                        className="image-layer optimized"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                        <img src={optimizedImage} alt="Optimized" />
                        {showLabels && (
                            <div className="image-label optimized-label">
                                Optimized
                            </div>
                        )}
                    </div>

                    {/* Slider Line */}
                    <div
                        className="slider-line"
                        style={{ left: `${sliderPosition}%` }}
                    >
                        <div className="slider-handle">
                            <div className="handle-icon">⟷</div>
                        </div>
                    </div>
                </div>

                {/* Range Slider */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={handleSliderChange}
                    className="comparison-slider"
                />
            </div>

            {/* Controls */}
            <div className="comparison-controls">
                <div className="control-group">
                    <button
                        onClick={resetSlider}
                        className="btn btn-secondary"
                        title="Reset comparison"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        onClick={toggleLabels}
                        className="btn btn-secondary"
                        title="Toggle labels"
                    >
                        {showLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                        onClick={() => handleZoom('out')}
                        className="btn btn-secondary"
                        disabled={zoom <= 0.5}
                        title="Zoom out"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={() => handleZoom('in')}
                        className="btn btn-secondary"
                        disabled={zoom >= 3}
                        title="Zoom in"
                    >
                        <ZoomIn size={16} />
                    </button>
                </div>

                <button
                    onClick={onDownload}
                    className="btn btn-primary"
                >
                    <Download size={16} />
                    Download Optimized
                </button>
            </div>

            <style jsx>{`
        .image-comparison {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .comparison-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          padding: var(--spacing-md);
          background: var(--background);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .stat-item {
          text-align: center;
          flex: 1;
        }

        .stat-item.savings {
          position: relative;
        }

        .stat-item.savings::before,
        .stat-item.savings::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 1px;
          height: 20px;
          background: var(--border);
          transform: translateY(-50%);
        }

        .stat-item.savings::before {
          left: 0;
        }

        .stat-item.savings::after {
          right: 0;
        }

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .savings .stat-value {
          color: var(--success-color);
        }

        .comparison-container {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-md);
          background: var(--background);
          border: 1px solid var(--border);
        }

        .image-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          overflow: hidden;
          transform-origin: center;
          transition: transform 0.3s ease;
        }

        .image-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .image-layer img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: var(--background);
        }

        .optimized {
          z-index: 1;
        }

        .image-label {
          position: absolute;
          top: var(--spacing-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .original-label {
          left: var(--spacing-sm);
        }

        .optimized-label {
          right: var(--spacing-sm);
        }

        .slider-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: white;
          z-index: 2;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          transform: translateX(-50%);
        }

        .slider-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: white;
          border: 2px solid var(--primary-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          box-shadow: var(--shadow);
        }

        .slider-handle:active {
          cursor: grabbing;
        }

        .handle-icon {
          font-size: 14px;
          color: var(--primary-color);
          user-select: none;
        }

        .comparison-slider {
          width: 100%;
          height: 6px;
          background: transparent;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
          position: absolute;
          bottom: 0;
          left: 0;
          z-index: 3;
        }

        .comparison-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: var(--primary-color);
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
        }

        .comparison-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: var(--primary-color);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          opacity: 0;
        }

        .comparison-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--spacing-lg);
          gap: var(--spacing-md);
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .zoom-indicator {
          font-size: 0.875rem;
          color: var(--text-secondary);
          min-width: 45px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .comparison-stats {
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .stat-item.savings::before,
          .stat-item.savings::after {
            display: none;
          }

          .comparison-controls {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .control-group {
            justify-content: center;
          }
        }
      `}</style>
        </motion.div>
    );
};

export default ImageComparison;