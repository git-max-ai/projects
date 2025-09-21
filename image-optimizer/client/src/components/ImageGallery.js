import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Download,
    Trash2,
    Eye,
    Grid,
    List,
    Calendar,
    FileImage,
    Zap,
    CheckCircle,
    AlertCircle,
    X,
    Upload,
    Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

function ImageGallery({ images = [], onDownload, onDelete, onClearAll, onNavigateToUpload }) {
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [sortBy, setSortBy] = useState('date');
    const [filterBy, setFilterBy] = useState('all');
    const [selectedImages, setSelectedImages] = useState(new Set());

    // Filter and sort images
    const filteredImages = images
        .filter(image => {
            // Search filter
            if (searchTerm && !image.originalFile.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Status filter
            if (filterBy === 'successful' && !image.optimizedUrl) return false;
            if (filterBy === 'failed' && image.optimizedUrl) return false;

            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.originalFile.name.localeCompare(b.originalFile.name);
                case 'size':
                    return b.originalSize - a.originalSize;
                case 'savings':
                    const savingsA = a.optimizedSize ? (1 - a.optimizedSize / a.originalSize) * 100 : 0;
                    const savingsB = b.optimizedSize ? (1 - b.optimizedSize / b.originalSize) * 100 : 0;
                    return savingsB - savingsA;
                case 'date':
                default:
                    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
            }
        });

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateSavings = (original, optimized) => {
        if (!optimized || !original) return 0;
        return Math.round(((original - optimized) / original) * 100);
    };

    const handleImageSelect = (imageId) => {
        const newSelected = new Set(selectedImages);
        if (newSelected.has(imageId)) {
            newSelected.delete(imageId);
        } else {
            newSelected.add(imageId);
        }
        setSelectedImages(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedImages.size === filteredImages.length) {
            setSelectedImages(new Set());
        } else {
            setSelectedImages(new Set(filteredImages.map(img => img.id)));
        }
    };

    const handleBulkDownload = async () => {
        if (selectedImages.size === 0) return;

        try {
            for (const imageId of selectedImages) {
                const image = images.find(img => img.id === imageId);
                if (image && onDownload) {
                    await onDownload(image);
                    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
                }
            }
            toast.success(`Downloaded ${selectedImages.size} images`);
        } catch (error) {
            toast.error('Bulk download failed');
        }
    };

    const handleBulkDelete = () => {
        if (selectedImages.size === 0) return;

        if (window.confirm(`Delete ${selectedImages.size} selected images?`)) {
            selectedImages.forEach(imageId => {
                const image = images.find(img => img.id === imageId);
                if (image && onDelete) {
                    onDelete(image);
                }
            });
            setSelectedImages(new Set());
            toast.success(`Deleted ${selectedImages.size} images`);
        }
    };

    if (images.length === 0) {
        return (
            <div className="gallery-empty">
                <FileImage size={64} className="empty-icon" />
                <h3>No Images Yet</h3>
                <p>Upload and optimize some images to see them here.</p>
            </div>
        );
    }

    return (
        <div className="image-gallery">
            {/* Gallery Header */}
            <div className="gallery-header">
                <div className="gallery-title">
                    <h2>Image Gallery</h2>
                    <span className="image-count">{filteredImages.length} images</span>
                </div>

                {/* Search and Controls */}
                <div className="gallery-controls">
                    <div className="search-box">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search images..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="name">Sort by Name</option>
                        <option value="size">Sort by Size</option>
                        <option value="savings">Sort by Savings</option>
                    </select>

                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Images</option>
                        <option value="successful">Successful</option>
                        <option value="failed">Failed</option>
                    </select>

                    <div className="view-toggle">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedImages.size > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bulk-actions"
                >
                    <div className="bulk-info">
                        <span>{selectedImages.size} selected</span>
                        <button onClick={handleSelectAll} className="select-all-btn">
                            {selectedImages.size === filteredImages.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    <div className="bulk-buttons">
                        <button onClick={handleBulkDownload} className="btn btn-primary">
                            <Download size={16} />
                            Download Selected
                        </button>
                        <button onClick={handleBulkDelete} className="btn btn-danger">
                            <Trash2 size={16} />
                            Delete Selected
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Image Grid/List */}
            <div className={`gallery-content ${viewMode}`}>
                <AnimatePresence>
                    {filteredImages.map((image) => (
                        <motion.div
                            key={image.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`gallery-item ${selectedImages.has(image.id) ? 'selected' : ''}`}
                        >
                            {/* Selection Checkbox */}
                            <div className="item-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedImages.has(image.id)}
                                    onChange={() => handleImageSelect(image.id)}
                                />
                            </div>

                            {/* Image Preview */}
                            <div className="item-preview" onClick={() => setSelectedImage(image)}>
                                <img
                                    src={image.optimizedUrl || image.originalPreview}
                                    alt={image.originalFile.name}
                                    className="preview-image"
                                />
                                <div className="preview-overlay">
                                    <Eye size={20} />
                                </div>
                            </div>

                            {/* Image Info */}
                            <div className="item-info">
                                <h4 className="item-name">{image.originalFile.name}</h4>
                                <div className="item-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Size:</span>
                                        <span className="detail-value">{formatFileSize(image.originalSize)}</span>
                                    </div>

                                    {image.optimizedSize && (
                                        <>
                                            <div className="detail-row">
                                                <span className="detail-label">Optimized:</span>
                                                <span className="detail-value">{formatFileSize(image.optimizedSize)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Savings:</span>
                                                <span className="savings-value">
                                                    {calculateSavings(image.originalSize, image.optimizedSize)}%
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div className="detail-row">
                                        <span className="detail-label">Date:</span>
                                        <span className="detail-value">{formatDate(image.timestamp)}</span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="item-status">
                                    {image.optimizedUrl ? (
                                        <span className="status-badge success">
                                            <CheckCircle size={14} />
                                            Optimized
                                        </span>
                                    ) : (
                                        <span className="status-badge error">
                                            <AlertCircle size={14} />
                                            Failed
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="item-actions">
                                    {image.optimizedUrl && (
                                        <button
                                            onClick={() => onDownload(image)}
                                            className="action-btn download"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDelete(image)}
                                        className="action-btn delete"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="image-modal"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="modal-close"
                            >
                                <X size={24} />
                            </button>

                            <div className="modal-image">
                                <img
                                    src={selectedImage.optimizedUrl || selectedImage.originalPreview}
                                    alt={selectedImage.originalFile.name}
                                />
                            </div>

                            <div className="modal-info">
                                <h3>{selectedImage.originalFile.name}</h3>
                                <div className="modal-stats">
                                    <div className="stat">
                                        <span className="stat-label">Original Size:</span>
                                        <span className="stat-value">{formatFileSize(selectedImage.originalSize)}</span>
                                    </div>
                                    {selectedImage.optimizedSize && (
                                        <>
                                            <div className="stat">
                                                <span className="stat-label">Optimized Size:</span>
                                                <span className="stat-value">{formatFileSize(selectedImage.optimizedSize)}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Compression Ratio:</span>
                                                <span className="stat-value">{selectedImage.compressionRatio}%</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Processing Time:</span>
                                                <span className="stat-value">{selectedImage.processingTime}ms</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Upload Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNavigateToUpload}
                className="floating-upload-btn"
                title="Upload & Optimize New Images"
            >
                <Plus size={24} />
                <span>Upload More</span>
            </motion.button>

            <style jsx>{`
        .image-gallery {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-lg);
        }

        .gallery-empty {
          text-align: center;
          padding: var(--spacing-4xl);
          color: var(--text-secondary);
        }

        .empty-icon {
          margin-bottom: var(--spacing-lg);
          opacity: 0.5;
        }

        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .gallery-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .gallery-title h2 {
          margin: 0;
          color: var(--text-primary);
        }

        .image-count {
          background: var(--primary-color);
          color: white;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius);
          font-size: 0.875rem;
        }

        .gallery-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: var(--spacing-sm);
          color: var(--text-secondary);
        }

        .search-input {
          padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 2.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          color: var(--text-primary);
          min-width: 200px;
        }

        .sort-select,
        .filter-select {
          padding: var(--spacing-sm);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          color: var(--text-primary);
        }

        .view-toggle {
          display: flex;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }

        .view-btn {
          background: var(--surface);
          border: none;
          padding: var(--spacing-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-btn:hover {
          background: var(--hover);
        }

        .view-btn.active {
          background: var(--primary-color);
          color: white;
        }

        .bulk-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .bulk-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .select-all-btn {
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          text-decoration: underline;
        }

        .bulk-buttons {
          display: flex;
          gap: var(--spacing-sm);
        }

        .gallery-content {
          display: grid;
          gap: var(--spacing-lg);
        }

        .gallery-content.grid {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .gallery-content.list {
          grid-template-columns: 1fr;
        }

        .gallery-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all 0.2s ease;
          position: relative;
        }

        .gallery-item:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        .gallery-item.selected {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .item-checkbox {
          position: absolute;
          top: var(--spacing-sm);
          left: var(--spacing-sm);
          z-index: 2;
        }

        .item-checkbox input {
          width: 16px;
          height: 16px;
        }

        .item-preview {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
          cursor: pointer;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        }

        .gallery-item:hover .preview-image {
          transform: scale(1.05);
        }

        .preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          color: white;
        }

        .item-preview:hover .preview-overlay {
          opacity: 1;
        }

        .item-info {
          padding: var(--spacing-md);
        }

        .item-name {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-sm);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
        }

        .detail-label {
          color: var(--text-secondary);
        }

        .detail-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .savings-value {
          color: var(--success-color);
          font-weight: 600;
        }

        .item-status {
          margin-bottom: var(--spacing-sm);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.success {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success-color);
        }

        .status-badge.error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
        }

        .item-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-xs);
        }

        .action-btn {
          background: none;
          border: none;
          padding: var(--spacing-xs);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: var(--hover);
        }

        .action-btn.download {
          color: var(--primary-color);
        }

        .action-btn.delete {
          color: var(--error-color);
        }

        .image-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--spacing-lg);
        }

        .modal-content {
          background: var(--surface);
          border-radius: var(--radius-lg);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          background: rgba(0, 0, 0, 0.5);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          z-index: 2;
        }

        .modal-image {
          max-height: 70vh;
          overflow: hidden;
        }

        .modal-image img {
          width: 100%;
          height: auto;
          display: block;
        }

        .modal-info {
          padding: var(--spacing-lg);
        }

        .modal-info h3 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--text-primary);
        }

        .modal-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-sm);
        }

        .stat {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-xs) 0;
          border-bottom: 1px solid var(--border);
        }

        .stat-label {
          color: var(--text-secondary);
        }

        .stat-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .floating-upload-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, var(--primary-color), #3b82f6);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
          z-index: 100;
          font-size: 0.875rem;
        }

        .floating-upload-btn:hover {
          box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }

        .floating-upload-btn:active {
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .gallery-header {
            flex-direction: column;
            align-items: stretch;
          }

          .gallery-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .gallery-content.grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }

          .bulk-actions {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .bulk-buttons {
            width: 100%;
            justify-content: stretch;
          }

          .bulk-buttons .btn {
            flex: 1;
          }
        }
      `}</style>
        </div>
    );
}

export default ImageGallery;