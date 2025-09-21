import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    Clock,
    HardDrive,
    Zap,
    Target,
    Award,
    Download,
    FileImage,
    Activity,
    Gauge
} from 'lucide-react';

function PerformanceAnalytics({ images = [], className = '' }) {
    const [timeRange, setTimeRange] = useState('7d');
    const [analytics, setAnalytics] = useState({});

    useEffect(() => {
        calculateAnalytics();
    }, [images, timeRange]);

    const calculateAnalytics = () => {
        if (!images || images.length === 0) {
            setAnalytics({});
            return;
        }

        // Filter images by time range
        const now = new Date();
        const timeRangeMs = {
            '1d': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            'all': Infinity
        };

        const filteredImages = images.filter(img => {
            if (!img.timestamp) return true;
            const imageTime = new Date(img.timestamp);
            return (now - imageTime) <= timeRangeMs[timeRange];
        });

        // Calculate statistics
        const totalImages = filteredImages.length;
        const successfulOptimizations = filteredImages.filter(img => img.optimizedUrl).length;
        const failedOptimizations = totalImages - successfulOptimizations;

        const totalOriginalSize = filteredImages.reduce((sum, img) => sum + (img.originalSize || 0), 0);
        const totalOptimizedSize = filteredImages.reduce((sum, img) => sum + (img.optimizedSize || 0), 0);
        const totalSpaceSaved = totalOriginalSize - totalOptimizedSize;
        const avgCompressionRatio = totalOriginalSize > 0 ? Math.round((totalSpaceSaved / totalOriginalSize) * 100) : 0;

        const totalProcessingTime = filteredImages.reduce((sum, img) => sum + (img.processingTime || 0), 0);
        const avgProcessingTime = totalImages > 0 ? Math.round(totalProcessingTime / totalImages) : 0;

        // Format breakdown
        const formatBreakdown = filteredImages.reduce((acc, img) => {
            const format = img.settings?.format || 'unknown';
            if (!acc[format]) {
                acc[format] = { count: 0, spaceSaved: 0 };
            }
            acc[format].count++;
            acc[format].spaceSaved += (img.originalSize || 0) - (img.optimizedSize || 0);
            return acc;
        }, {});

        // Quality settings breakdown
        const qualityBreakdown = filteredImages.reduce((acc, img) => {
            const quality = img.settings?.quality || 'unknown';
            const qualityRange = quality === 'unknown' ? 'unknown' :
                quality >= 90 ? 'high' :
                    quality >= 70 ? 'medium' : 'low';

            if (!acc[qualityRange]) {
                acc[qualityRange] = { count: 0, avgSavings: 0 };
            }
            acc[qualityRange].count++;
            const savings = img.originalSize && img.optimizedSize ?
                ((img.originalSize - img.optimizedSize) / img.originalSize) * 100 : 0;
            acc[qualityRange].avgSavings =
                (acc[qualityRange].avgSavings * (acc[qualityRange].count - 1) + savings) / acc[qualityRange].count;
            return acc;
        }, {});

        // Performance trends (simplified for demo)
        const trends = calculateTrends(filteredImages);

        setAnalytics({
            totalImages,
            successfulOptimizations,
            failedOptimizations,
            successRate: totalImages > 0 ? Math.round((successfulOptimizations / totalImages) * 100) : 0,
            totalOriginalSize,
            totalOptimizedSize,
            totalSpaceSaved,
            avgCompressionRatio,
            totalProcessingTime,
            avgProcessingTime,
            formatBreakdown,
            qualityBreakdown,
            trends
        });
    };

    const calculateTrends = (images) => {
        // Group images by day for trend analysis
        const dayGroups = images.reduce((acc, img) => {
            if (!img.timestamp) return acc;

            const date = new Date(img.timestamp).toDateString();
            if (!acc[date]) {
                acc[date] = { images: [], totalSaved: 0, avgProcessingTime: 0 };
            }
            acc[date].images.push(img);
            acc[date].totalSaved += (img.originalSize || 0) - (img.optimizedSize || 0);
            return acc;
        }, {});

        return Object.entries(dayGroups)
            .map(([date, data]) => ({
                date,
                imageCount: data.images.length,
                spaceSaved: data.totalSaved,
                avgProcessingTime: data.images.reduce((sum, img) => sum + (img.processingTime || 0), 0) / data.images.length
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTime = (ms) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };

    const getPerformanceGrade = () => {
        if (analytics.avgCompressionRatio >= 60) return { grade: 'A+', color: '#10b981' };
        if (analytics.avgCompressionRatio >= 45) return { grade: 'A', color: '#059669' };
        if (analytics.avgCompressionRatio >= 30) return { grade: 'B', color: '#0d9488' };
        if (analytics.avgCompressionRatio >= 15) return { grade: 'C', color: '#f59e0b' };
        return { grade: 'D', color: '#ef4444' };
    };

    if (Object.keys(analytics).length === 0) {
        return (
            <div className={`analytics-empty ${className}`}>
                <Activity size={48} className="empty-icon" />
                <h3>No Analytics Data</h3>
                <p>Optimize some images to see performance analytics.</p>
            </div>
        );
    }

    const performanceGrade = getPerformanceGrade();

    return (
        <div className={`performance-analytics ${className}`}>
            {/* Header */}
            <div className="analytics-header">
                <div className="header-title">
                    <h2>Performance Analytics</h2>
                    <div className="performance-grade" style={{ color: performanceGrade.color }}>
                        <Award size={20} />
                        <span>Grade: {performanceGrade.grade}</span>
                    </div>
                </div>

                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="time-range-select"
                >
                    <option value="1d">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="metric-card primary"
                >
                    <div className="metric-icon">
                        <FileImage size={24} />
                    </div>
                    <div className="metric-content">
                        <h3 className="metric-value">{analytics.totalImages}</h3>
                        <p className="metric-label">Images Processed</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="metric-card success"
                >
                    <div className="metric-icon">
                        <HardDrive size={24} />
                    </div>
                    <div className="metric-content">
                        <h3 className="metric-value">{formatFileSize(analytics.totalSpaceSaved)}</h3>
                        <p className="metric-label">Space Saved</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="metric-card info"
                >
                    <div className="metric-icon">
                        <Target size={24} />
                    </div>
                    <div className="metric-content">
                        <h3 className="metric-value">{analytics.avgCompressionRatio}%</h3>
                        <p className="metric-label">Avg Compression</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="metric-card warning"
                >
                    <div className="metric-icon">
                        <Clock size={24} />
                    </div>
                    <div className="metric-content">
                        <h3 className="metric-value">{formatTime(analytics.avgProcessingTime)}</h3>
                        <p className="metric-label">Avg Processing Time</p>
                    </div>
                </motion.div>
            </div>

            {/* Success Rate */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="success-rate-card"
            >
                <h3>Success Rate</h3>
                <div className="success-rate-content">
                    <div className="rate-circle">
                        <svg viewBox="0 0 100 100" className="rate-svg">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="var(--border)"
                                strokeWidth="6"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="var(--success-color)"
                                strokeWidth="6"
                                strokeDasharray={`${analytics.successRate * 2.83} 283`}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <span className="rate-percentage">{analytics.successRate}%</span>
                    </div>
                    <div className="rate-details">
                        <div className="rate-item">
                            <span className="rate-dot success"></span>
                            <span>{analytics.successfulOptimizations} Successful</span>
                        </div>
                        <div className="rate-item">
                            <span className="rate-dot error"></span>
                            <span>{analytics.failedOptimizations} Failed</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Format Breakdown */}
            {Object.keys(analytics.formatBreakdown).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="breakdown-card"
                >
                    <h3>Format Breakdown</h3>
                    <div className="breakdown-list">
                        {Object.entries(analytics.formatBreakdown).map(([format, data]) => (
                            <div key={format} className="breakdown-item">
                                <div className="breakdown-label">
                                    <span className="format-badge">{format.toUpperCase()}</span>
                                    <span className="breakdown-count">{data.count} images</span>
                                </div>
                                <div className="breakdown-value">
                                    <span className="space-saved">{formatFileSize(data.spaceSaved)} saved</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Quality Analysis */}
            {Object.keys(analytics.qualityBreakdown).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="breakdown-card"
                >
                    <h3>Quality Settings Analysis</h3>
                    <div className="breakdown-list">
                        {Object.entries(analytics.qualityBreakdown).map(([quality, data]) => (
                            <div key={quality} className="breakdown-item">
                                <div className="breakdown-label">
                                    <span className={`quality-badge ${quality}`}>
                                        {quality === 'high' ? 'High (90%+)' :
                                            quality === 'medium' ? 'Medium (70-89%)' :
                                                quality === 'low' ? 'Low (<70%)' : 'Unknown'}
                                    </span>
                                    <span className="breakdown-count">{data.count} images</span>
                                </div>
                                <div className="breakdown-value">
                                    <span className="avg-savings">{Math.round(data.avgSavings)}% avg savings</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Recommendations */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="recommendations-card"
            >
                <h3>Optimization Recommendations</h3>
                <div className="recommendations-list">
                    {analytics.avgCompressionRatio < 30 && (
                        <div className="recommendation">
                            <Gauge className="rec-icon" />
                            <div>
                                <p><strong>Try lower quality settings</strong></p>
                                <p>Your compression rate is below 30%. Consider using quality settings between 70-85% for better optimization.</p>
                            </div>
                        </div>
                    )}

                    {analytics.avgProcessingTime > 5000 && (
                        <div className="recommendation">
                            <Zap className="rec-icon" />
                            <div>
                                <p><strong>Consider batch processing</strong></p>
                                <p>Processing time is high. Use batch processing for multiple images to improve efficiency.</p>
                            </div>
                        </div>
                    )}

                    {Object.keys(analytics.formatBreakdown).some(format => format === 'jpeg') && (
                        <div className="recommendation">
                            <TrendingUp className="rec-icon" />
                            <div>
                                <p><strong>Try modern formats</strong></p>
                                <p>Consider using WebP or AVIF formats for better compression ratios and smaller file sizes.</p>
                            </div>
                        </div>
                    )}

                    {analytics.successRate < 95 && (
                        <div className="recommendation">
                            <Target className="rec-icon" />
                            <div>
                                <p><strong>Check failed optimizations</strong></p>
                                <p>Some optimizations are failing. Ensure images are valid and within size limits.</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <style jsx>{`
        .performance-analytics {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-lg);
        }

        .analytics-empty {
          text-align: center;
          padding: var(--spacing-4xl);
          color: var(--text-secondary);
        }

        .empty-icon {
          margin-bottom: var(--spacing-lg);
          opacity: 0.5;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .header-title h2 {
          margin: 0;
          color: var(--text-primary);
        }

        .performance-grade {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-weight: 600;
        }

        .time-range-select {
          padding: var(--spacing-sm);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          color: var(--text-primary);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .metric-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          box-shadow: var(--shadow);
        }

        .metric-icon {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .metric-card.primary .metric-icon {
          background: var(--primary-color);
        }

        .metric-card.success .metric-icon {
          background: var(--success-color);
        }

        .metric-card.info .metric-icon {
          background: #3b82f6;
        }

        .metric-card.warning .metric-icon {
          background: #f59e0b;
        }

        .metric-content {
          flex: 1;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }

        .metric-label {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .success-rate-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          box-shadow: var(--shadow);
        }

        .success-rate-card h3 {
          margin: 0 0 var(--spacing-lg) 0;
          color: var(--text-primary);
        }

        .success-rate-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-xl);
        }

        .rate-circle {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .rate-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .rate-percentage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .rate-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .rate-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .rate-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .rate-dot.success {
          background: var(--success-color);
        }

        .rate-dot.error {
          background: var(--error-color);
        }

        .breakdown-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          box-shadow: var(--shadow);
        }

        .breakdown-card h3 {
          margin: 0 0 var(--spacing-lg) 0;
          color: var(--text-primary);
        }

        .breakdown-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm);
          background: var(--background);
          border-radius: var(--radius);
        }

        .breakdown-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .format-badge {
          background: var(--primary-color);
          color: white;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .quality-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        .quality-badge.high {
          background: var(--success-color);
        }

        .quality-badge.medium {
          background: #f59e0b;
        }

        .quality-badge.low {
          background: var(--error-color);
        }

        .quality-badge.unknown {
          background: var(--text-secondary);
        }

        .breakdown-count {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .breakdown-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .space-saved {
          color: var(--success-color);
        }

        .avg-savings {
          color: var(--primary-color);
        }

        .recommendations-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow);
        }

        .recommendations-card h3 {
          margin: 0 0 var(--spacing-lg) 0;
          color: var(--text-primary);
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .recommendation {
          display: flex;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--background);
          border-radius: var(--radius);
          border-left: 4px solid var(--primary-color);
        }

        .rec-icon {
          color: var(--primary-color);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .recommendation p {
          margin: 0;
          color: var(--text-primary);
        }

        .recommendation p:first-child {
          margin-bottom: var(--spacing-xs);
        }

        .recommendation p:last-child {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .analytics-header {
            flex-direction: column;
            gap: var(--spacing-md);
            align-items: stretch;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .success-rate-content {
            flex-direction: column;
            text-align: center;
          }

          .breakdown-item {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }

          .recommendation {
            flex-direction: column;
          }
        }
      `}</style>
        </div>
    );
}

export default PerformanceAnalytics;