import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DragDropUpload = ({ onFilesSelected, maxFiles = 10, acceptedFormats = ['image/*'] }) => {
    const [files, setFiles] = useState([]);

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            preview: URL.createObjectURL(file),
            status: 'ready', // ready, uploading, completed, error
            progress: 0
        }));

        setFiles(prev => [...prev, ...newFiles]);
        onFilesSelected([...files, ...newFiles]);
    }, [files, onFilesSelected]);

    const removeFile = (id) => {
        setFiles(prev => {
            const updatedFiles = prev.filter(f => f.id !== id);
            onFilesSelected(updatedFiles);
            return updatedFiles;
        });
    };

    const updateFileStatus = (id, status, progress = 0) => {
        setFiles(prev => prev.map(f =>
            f.id === id ? { ...f, status, progress } : f
        ));
    };

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp', '.tiff']
        },
        maxFiles,
        multiple: true
    });

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="drag-drop-container">
            <motion.div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'drag-active' : ''} ${isDragReject ? 'drag-reject' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <input {...getInputProps()} />
                <div className="dropzone-content">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Upload size={48} className="upload-icon" />
                    </motion.div>
                    {isDragActive ? (
                        <div className="dropzone-text">
                            <h3>Drop the images here...</h3>
                            <p>Release to upload your images</p>
                        </div>
                    ) : (
                        <div className="dropzone-text">
                            <h3>Drag & drop images here</h3>
                            <p>or <span className="text-primary">click to browse</span></p>
                            <small>Supports: JPEG, PNG, WebP, GIF, BMP, TIFF (max {maxFiles} files)</small>
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="file-list"
                    >
                        <h4 className="file-list-title">Selected Files ({files.length})</h4>
                        <div className="file-grid">
                            {files.map((fileObj) => (
                                <motion.div
                                    key={fileObj.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="file-item"
                                >
                                    <div className="file-preview">
                                        <img src={fileObj.preview} alt={fileObj.file.name} />
                                        <div className="file-overlay">
                                            <button
                                                onClick={() => removeFile(fileObj.id)}
                                                className="remove-btn"
                                                type="button"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="file-info">
                                        <div className="file-name" title={fileObj.file.name}>
                                            {fileObj.file.name}
                                        </div>
                                        <div className="file-size">
                                            {formatFileSize(fileObj.file.size)}
                                        </div>
                                        <div className="file-status">
                                            {fileObj.status === 'ready' && <span className="status-ready">Ready</span>}
                                            {fileObj.status === 'uploading' && (
                                                <div className="status-uploading">
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${fileObj.progress}%` }}
                                                        />
                                                    </div>
                                                    <span>{fileObj.progress}%</span>
                                                </div>
                                            )}
                                            {fileObj.status === 'completed' && (
                                                <span className="status-completed">
                                                    <CheckCircle size={14} /> Complete
                                                </span>
                                            )}
                                            {fileObj.status === 'error' && <span className="status-error">Error</span>}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
        .drag-drop-container {
          width: 100%;
          margin-bottom: var(--spacing-xl);
        }

        .dropzone {
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-2xl);
          text-align: center;
          cursor: pointer;
          transition: var(--transition);
          background: var(--surface);
        }

        .dropzone:hover {
          border-color: var(--primary-color);
          background: var(--background);
        }

        .dropzone.drag-active {
          border-color: var(--primary-color);
          background: rgba(99, 102, 241, 0.05);
          transform: scale(1.02);
        }

        .dropzone.drag-reject {
          border-color: var(--error-color);
          background: rgba(239, 68, 68, 0.05);
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
        }

        .upload-icon {
          color: var(--primary-color);
          margin-bottom: var(--spacing-sm);
        }

        .dropzone-text h3 {
          margin: 0;
          color: var(--text-primary);
          font-weight: 600;
        }

        .dropzone-text p {
          margin: 0;
          color: var(--text-secondary);
        }

        .dropzone-text small {
          color: var(--text-light);
          margin-top: var(--spacing-sm);
          display: block;
        }

        .file-list {
          margin-top: var(--spacing-xl);
        }

        .file-list-title {
          margin-bottom: var(--spacing-md);
          color: var(--text-primary);
        }

        .file-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .file-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: var(--transition);
        }

        .file-item:hover {
          box-shadow: var(--shadow);
        }

        .file-preview {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
        }

        .file-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-overlay {
          position: absolute;
          top: 0;
          right: 0;
          padding: var(--spacing-sm);
          opacity: 0;
          transition: var(--transition);
        }

        .file-item:hover .file-overlay {
          opacity: 1;
        }

        .remove-btn {
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .remove-btn:hover {
          background: var(--error-color);
        }

        .file-info {
          padding: var(--spacing-sm);
        }

        .file-name {
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: var(--spacing-xs);
        }

        .file-size {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .file-status {
          font-size: 0.75rem;
        }

        .status-ready {
          color: var(--text-secondary);
        }

        .status-uploading {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--primary-color);
        }

        .progress-bar {
          flex: 1;
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--primary-color);
          transition: width 0.3s ease;
        }

        .status-completed {
          color: var(--success-color);
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .status-error {
          color: var(--error-color);
        }

        @media (max-width: 768px) {
          .file-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
          
          .dropzone {
            padding: var(--spacing-lg);
          }
        }
      `}</style>
        </div>
    );
};

export default DragDropUpload;