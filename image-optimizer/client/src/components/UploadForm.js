import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from 'react-hot-toast';
import { optimizeImage } from "../api";
import DragDropUpload from './DragDropUpload';
import OptimizationSettings from './OptimizationSettings';
import AdvancedProcessingSettings from './AdvancedProcessingSettings';
import ImageComparison from './ImageComparison';
import { Play, Download, Trash2, Settings, BarChart3, Zap, HardDrive, FileImage } from 'lucide-react';

function UploadForm({ onImagesProcessed }) {
    const [files, setFiles] = useState([]);
    const [optimizationSettings, setOptimizationSettings] = useState({
        format: 'webp',
        quality: 75,
        maxSize: null
    });
    const [advancedSettings, setAdvancedSettings] = useState({
        smartCrop: false,
        cropFocus: 'center',
        watermark: false,
        watermarkText: '',
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 0.5,
        sharpen: false,
        sharpenAmount: 0.5,
        noise: false,
        noiseAmount: 20,
        colorSpace: 'srgb'
    });
    const [results, setResults] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState('basic'); // 'basic' or 'advanced'

    const resultsRef = useRef(null);

    const handleFilesSelected = (selectedFiles) => {
        setFiles(selectedFiles);
        setResults([]); // Clear previous results
    };

    const handleOptimizationSettingsChange = (newSettings) => {
        setOptimizationSettings(prev => ({ ...prev, ...newSettings }));
    };

    const handleAdvancedSettingsChange = (newSettings) => {
        setAdvancedSettings(prev => ({ ...prev, ...newSettings }));
    };

    const processImages = async () => {
        if (files.length === 0) {
            toast.error('Please select at least one image');
            return;
        }

        setIsProcessing(true);
        const newResults = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const fileObj = files[i];

                // Update file status to uploading
                setFiles(prev => prev.map(f =>
                    f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f
                ));

                const formData = new FormData();
                formData.append("image", fileObj.file);

                // Add optimization settings to form data
                const allSettings = { ...optimizationSettings, ...advancedSettings };
                Object.keys(allSettings).forEach(key => {
                    if (allSettings[key] !== undefined && allSettings[key] !== null) {
                        formData.append(key, allSettings[key]);
                    }
                });

                try {
                    // Simulate progress updates
                    const progressInterval = setInterval(() => {
                        setFiles(prev => prev.map(f =>
                            f.id === fileObj.id && f.status === 'uploading'
                                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                                : f
                        ));
                    }, 200);

                    const { data } = await optimizeImage(formData);

                    clearInterval(progressInterval);

                    // Update file status to completed
                    setFiles(prev => prev.map(f =>
                        f.id === fileObj.id ? { ...f, status: 'completed', progress: 100 } : f
                    ));

                    const result = {
                        id: fileObj.id,
                        originalFile: fileObj.file,
                        originalPreview: fileObj.preview,
                        optimizedUrl: data.optimizedFile,
                        originalSize: fileObj.file.size,
                        optimizedSize: data.optimized ? parseFloat(data.optimized.size_kb) * 1024 : 0,
                        compressionRatio: data.compression_ratio || 0,
                        processingTime: data.processing_time || 0,
                        message: data.message,
                        settings: data.settings || allSettings
                    };

                    newResults.push(result);
                    toast.success(`${fileObj.file.name} optimized successfully!`);

                } catch (error) {
                    console.error(`Error processing ${fileObj.file.name}:`, error);

                    // Update file status to error
                    setFiles(prev => prev.map(f =>
                        f.id === fileObj.id ? { ...f, status: 'error' } : f
                    ));

                    toast.error(`Failed to optimize ${fileObj.file.name}`);
                }
            }

            setResults(newResults);

            // Scroll to results section after results are set
            setTimeout(() => {
                if (resultsRef.current && newResults.length > 0) {
                    resultsRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                        inline: 'nearest'
                    });
                }
            }, 100);

            // Notify parent component about processed images
            if (onImagesProcessed && newResults.length > 0) {
                onImagesProcessed(newResults);
            }

        } catch (error) {
            console.error("Processing failed:", error);
            toast.error("Processing failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadImage = async (result) => {
        try {
            const response = await fetch(result.optimizedUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `optimized-${result.originalFile.name}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Download started!');
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Download failed');
        }
    };

    const downloadAll = async () => {
        if (results.length === 0) return;

        try {
            for (const result of results) {
                await downloadImage(result);
                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error('Bulk download failed:', error);
            toast.error('Bulk download failed');
        }
    };

    const clearAll = () => {
        setFiles([]);
        setResults([]);
        toast.success('All files cleared');
    };

    const getTotalSavings = () => {
        if (results.length === 0) return { bytes: 0, percentage: 0 };

        const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
        const totalOptimized = results.reduce((sum, r) => sum + r.optimizedSize, 0);
        const savedBytes = totalOriginal - totalOptimized;
        const percentage = totalOriginal > 0 ? Math.round((savedBytes / totalOriginal) * 100) : 0;

        return { bytes: savedBytes, percentage };
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const savings = getTotalSavings();

    return (
        <>
            <div className="upload-form">
                {/* Settings Tabs */}
                <div className="settings-tabs">
                    <button
                        onClick={() => setActiveSettingsTab('basic')}
                        className={`settings-tab ${activeSettingsTab === 'basic' ? 'active' : ''}`}
                    >
                        <Settings size={16} />
                        <span>Basic</span>
                    </button>

                    <button
                        onClick={() => setActiveSettingsTab('advanced')}
                        className={`settings-tab ${activeSettingsTab === 'advanced' ? 'active' : ''}`}
                    >
                        <Zap size={16} />
                        <span>Advanced</span>
                    </button>

                    {/* Animated Tab Indicator */}
                    <motion.div
                        className="tab-indicator"
                        animate={{
                            x: activeSettingsTab === 'basic' ? 0 : '100%'
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                    />
                </div>

                {/* Settings Content */}
                <div className="settings-content">
                    <AnimatePresence mode="wait">
                        {activeSettingsTab === 'basic' && (
                            <motion.div
                                key="basic"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <OptimizationSettings
                                    onSettingsChange={handleOptimizationSettingsChange}
                                    disabled={isProcessing}
                                />
                            </motion.div>
                        )}

                        {activeSettingsTab === 'advanced' && (
                            <motion.div
                                key="advanced"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <AdvancedProcessingSettings
                                    settings={advancedSettings}
                                    updateSettings={handleAdvancedSettingsChange}
                                    disabled={isProcessing}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {/* <AnimatePresence mode="wait">
                    {activeSettingsTab === 'basic' && (
                        <motion.div
                            key="basic"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <OptimizationSettings
                                onSettingsChange={handleOptimizationSettingsChange}
                                disabled={isProcessing}
                            />
                        </motion.div>
                    )}

                    {activeSettingsTab === 'advanced' && (
                        <motion.div
                            key="advanced"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <AdvancedProcessingSettings
                                settings={advancedSettings}
                                updateSettings={handleAdvancedSettingsChange}
                                disabled={isProcessing}
                            />
                        </motion.div>
                    )}
                </AnimatePresence> */}
            </div>

            {/* Drag & Drop Upload */}
            <div id="upload-section">
                <DragDropUpload
                    onFilesSelected={handleFilesSelected}
                    maxFiles={10}
                />
            </div>

            {/* Summary Stats */}
            {results.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="summary-section"
                >
                    <div className="summary-stats">
                        <div className="stat-card">
                            <BarChart3 size={20} className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-value">{savings.percentage}%</span>
                                <span className="stat-label">Space Saved</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <HardDrive size={20} className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-value">{formatFileSize(savings.bytes)}</span>
                                <span className="stat-label">Reduced</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <FileImage size={20} className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-value">{results.length}</span>
                                <span className="stat-label">Images Processed</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Action Buttons */}
            {files.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="action-buttons"
                >
                    <button
                        onClick={processImages}
                        disabled={isProcessing}
                        className="btn btn-primary btn-large"
                    >
                        <Play size={20} />
                        {isProcessing ? 'Processing...' : `Optimize ${files.length} Image${files.length > 1 ? 's' : ''}`}
                    </button>

                    <div className="secondary-actions">
                        {results.length > 0 && (
                            <button
                                onClick={downloadAll}
                                className="btn btn-secondary"
                            >
                                <Download size={16} />
                                Download All
                            </button>
                        )}

                        <button
                            onClick={clearAll}
                            className="btn btn-secondary"
                        >
                            <Trash2 size={16} />
                            Clear All
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Results Scroll Target */}
            <div ref={resultsRef}></div>

            {/* Results Section */}
            <AnimatePresence>
                {results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="results-section"
                    >
                        <h3 className="results-title">Optimization Results</h3>
                        <div className="results-grid">
                            {results.map((result) => (
                                <motion.div
                                    key={result.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="result-item"
                                >
                                    <ImageComparison
                                        originalImage={result.originalPreview}
                                        optimizedImage={result.optimizedUrl}
                                        originalSize={result.originalSize}
                                        optimizedSize={result.optimizedSize}
                                        compressionRatio={result.compressionRatio}
                                        onDownload={() => downloadImage(result)}
                                    />

                                    {/* Processing Details */}
                                    <div className="processing-details">
                                        <h4 className="detail-title">{result.originalFile.name}</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Format:</span>
                                                <span className="detail-value">{result.settings?.format?.toUpperCase()}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Quality:</span>
                                                <span className="detail-value">{result.settings?.quality}%</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Dimensions:</span>
                                                <span className="detail-value">
                                                    {result.settings?.width}×{result.settings?.height}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Processing Time:</span>
                                                <span className="detail-value">{result.processingTime}ms</span>
                                            </div>
                                            {result.settings?.watermark && (
                                                <div className="detail-item">
                                                    <span className="detail-label">Watermark:</span>
                                                    <span className="detail-value">Applied</span>
                                                </div>
                                            )}
                                            {result.settings?.smartCrop && (
                                                <div className="detail-item">
                                                    <span className="detail-label">Smart Crop:</span>
                                                    <span className="detail-value">Applied</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
        .upload-form {
          max-width: 1000px;
          margin: 0 auto;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .settings-toggles {
          display: flex;
          gap: var(--spacing-sm);
        }

        .btn.active {
          background: var(--primary-color);
          color: white;
        }

        .summary-stats {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .stat-icon {
          color: var(--success-color);
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        .btn-large {
          padding: var(--spacing-md) var(--spacing-xl);
          font-size: 1rem;
          min-width: 200px;
        }

        .secondary-actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .results-section {
          margin-top: var(--spacing-2xl);
        }

        .results-title {
          text-align: center;
          margin-bottom: var(--spacing-xl);
          color: var(--text-primary);
        }

        .results-grid {
          display: grid;
          gap: var(--spacing-xl);
        }

        .result-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow);
        }

        .processing-details {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--border);
        }

        .detail-title {
          margin-bottom: var(--spacing-md);
          color: var(--text-primary);
          font-weight: 600;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-sm);
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-xs) 0;
        }

        .detail-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .detail-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .form-header {
            flex-direction: column;
            gap: var(--spacing-md);
            align-items: stretch;
          }

          .settings-toggles {
            justify-content: center;
          }

          .summary-stats {
            justify-content: center;
          }

          .secondary-actions {
            flex-direction: column;
            width: 100%;
          }

          .btn-large {
            width: 100%;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </>
    );
}

export default UploadForm;