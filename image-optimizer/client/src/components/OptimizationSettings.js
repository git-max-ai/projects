import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import {
    Settings,
    Info,
    Zap,
    Shield,
    FileImage,
    Sliders,
    Image,
    Maximize2,
    ToggleLeft,
    ToggleRight,
    ChevronDown,
    ChevronRight,
    Sparkles
} from 'lucide-react';

const OptimizationSettings = ({ onSettingsChange, disabled = false }) => {
    const { isDark } = useTheme();
    const [settings, setSettings] = useState({
        format: 'webp',
        quality: 75,
        width: 'auto',
        height: 'auto',
        preserveMetadata: false,
        progressive: true,
        optimize: true
    });

    const [expandedSections, setExpandedSections] = useState({
        format: false,
        quality: false,
        size: false,
        advanced: false
    });

    const formats = [
        {
            value: 'webp',
            label: 'WebP',
            description: 'Modern, efficient',
            icon: <Zap size={20} />,
            savings: '25-50%',
            color: '#10b981',
            popular: true
        },
        {
            value: 'avif',
            label: 'AVIF',
            description: 'Next-generation',
            icon: <Sparkles size={20} />,
            savings: '30-60%',
            color: '#8b5cf6',
            badge: 'Latest'
        },
        {
            value: 'jpeg',
            label: 'JPEG',
            description: 'Universal support',
            icon: <FileImage size={20} />,
            savings: '10-30%',
            color: '#f59e0b'
        },
        {
            value: 'png',
            label: 'PNG',
            description: 'Lossless quality',
            icon: <Shield size={20} />,
            savings: '5-20%',
            color: '#3b82f6'
        }
    ];

    const sizePresets = [
        { label: 'Original', width: 'auto', height: 'auto' },
        { label: 'Large (1920px)', width: 1920, height: 'auto' },
        { label: 'Medium (1200px)', width: 1200, height: 'auto' },
        { label: 'Small (800px)', width: 800, height: 'auto' },
        { label: 'Thumbnail (400px)', width: 400, height: 'auto' },
        { label: 'Custom', width: 'custom', height: 'custom' }
    ];

    const qualityPresets = [
        { value: 95, label: 'Maximum', description: 'Largest files', color: '#ef4444' },
        { value: 85, label: 'High', description: 'Great for photos', color: '#f59e0b' },
        { value: 75, label: 'Balanced', description: 'Recommended', color: '#10b981', recommended: true },
        { value: 65, label: 'Compact', description: 'Smaller files', color: '#3b82f6' }
    ];

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const updateSettings = (newSettings) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        onSettingsChange(updated);
    };

    const handleFormatChange = (format) => {
        updateSettings({ format });
    };

    const handleQualityChange = (quality) => {
        updateSettings({ quality });
    };

    const handleSizePreset = (preset) => {
        if (preset.width === 'custom') {
            updateSettings({ width: '', height: '' });
        } else {
            updateSettings({ width: preset.width, height: preset.height });
        }
    };

    const getQualityColor = (quality) => {
        if (quality >= 85) return 'var(--success-color)';
        if (quality >= 70) return 'var(--warning-color)';
        return 'var(--error-color)';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`optimization-settings-modern ${disabled ? 'disabled' : ''}`}
        >
            {/* Header */}
            <div className="settings-header-modern">
                <div className="header-icon-modern">
                    <Sliders size={24} />
                </div>
                <div className="header-content-modern">
                    <h2>Optimization Settings</h2>
                    <p>Customize your image processing preferences</p>
                </div>
                <div className="header-status">
                    <span className="smart-badge">
                        <Sparkles size={16} />
                        Smart Defaults
                    </span>
                </div>
            </div>

            {/* Format Selection Card */}
            <motion.div className="settings-card">
                <div
                    className="card-header"
                    onClick={() => toggleSection('format')}
                >
                    <div className="card-title">
                        <Image size={20} />
                        <span>Output Format</span>
                    </div>
                    <motion.div
                        animate={{ rotate: expandedSections.format ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={20} />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {expandedSections.format && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card-content"
                        >
                            <div className="format-grid-modern">
                                {formats.map((format) => (
                                    <motion.div
                                        key={format.value}
                                        className={`format-card-modern ${settings.format === format.value ? 'selected' : ''}`}
                                        onClick={() => handleFormatChange(format.value)}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {format.popular && (
                                            <div className="popular-badge">Popular</div>
                                        )}
                                        {format.badge && (
                                            <div className="feature-badge">{format.badge}</div>
                                        )}
                                        <div
                                            className="format-icon-modern"
                                            style={{ color: format.color }}
                                        >
                                            {format.icon}
                                        </div>
                                        <div className="format-info-modern">
                                            <h4>{format.label}</h4>
                                            <p>{format.description}</p>
                                            <div className="savings-modern" style={{ color: format.color }}>
                                                {format.savings} smaller
                                            </div>
                                        </div>
                                        {settings.format === format.value && (
                                            <motion.div
                                                layoutId="selected-format"
                                                className="selected-indicator"
                                                style={{ backgroundColor: format.color }}
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Quality Selection Card */}
            <motion.div className="settings-card">
                <div
                    className="card-header"
                    onClick={() => toggleSection('quality')}
                >
                    <div className="card-title">
                        <Sliders size={20} />
                        <span>Quality Level</span>
                    </div>
                    <motion.div
                        animate={{ rotate: expandedSections.quality ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={20} />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {expandedSections.quality && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card-content"
                        >
                            <div className="quality-section">
                                <div className="quality-slider-container">
                                    <div className="quality-labels">
                                        <span>Smaller</span>
                                        <span className="current-quality">{settings.quality}%</span>
                                        <span>Larger</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={settings.quality}
                                        onChange={(e) => updateSettings({ quality: parseInt(e.target.value) })}
                                        className="quality-slider-modern"
                                    />
                                </div>

                                <div className="quality-presets-modern">
                                    {qualityPresets.map((preset) => (
                                        <motion.button
                                            key={preset.value}
                                            type="button"
                                            className={`quality-preset-modern ${settings.quality === preset.value ? 'selected' : ''}`}
                                            onClick={() => handleQualityChange(preset.value)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                '--accent-color': preset.color
                                            }}
                                        >
                                            <div className="preset-info">
                                                <span className="preset-label">{preset.label}</span>
                                                <span className="preset-description">{preset.description}</span>
                                            </div>
                                            <span className="preset-value">{preset.value}%</span>
                                            {preset.recommended && (
                                                <div className="recommended-badge">Recommended</div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Size Settings Card */}
            <motion.div className="settings-card">
                <div
                    className="card-header"
                    onClick={() => toggleSection('size')}
                >
                    <div className="card-title">
                        <Maximize2 size={20} />
                        <span>Size & Dimensions</span>
                        <span className="optional-badge">Optional</span>
                    </div>
                    <motion.div
                        animate={{ rotate: expandedSections.size ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={20} />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {expandedSections.size && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card-content"
                        >
                            <div className="size-section">
                                <div className="size-presets-modern">
                                    {sizePresets.map((preset, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`size-preset-modern ${(settings.width === preset.width && settings.height === preset.height) ||
                                                (preset.width === 'custom' && (typeof settings.width === 'string' && settings.width !== 'auto'))
                                                ? 'selected' : ''
                                                }`}
                                            onClick={() => handleSizePreset(preset)}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>

                                {(typeof settings.width === 'string' && settings.width !== 'auto') && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="custom-size-modern"
                                    >
                                        <div className="custom-inputs">
                                            <div className="input-group">
                                                <label>Width</label>
                                                <input
                                                    type="number"
                                                    placeholder="Auto"
                                                    value={settings.width}
                                                    onChange={(e) => updateSettings({ width: e.target.value })}
                                                    className="dimension-input"
                                                />
                                                <span>px</span>
                                            </div>
                                            <div className="input-separator">×</div>
                                            <div className="input-group">
                                                <label>Height</label>
                                                <input
                                                    type="number"
                                                    placeholder="Auto"
                                                    value={settings.height}
                                                    onChange={(e) => updateSettings({ height: e.target.value })}
                                                    className="dimension-input"
                                                />
                                                <span>px</span>
                                            </div>
                                        </div>
                                        <p className="size-hint">Leave height empty to maintain aspect ratio</p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Advanced Options Card */}
            <motion.div className="settings-card">
                <div
                    className="card-header"
                    onClick={() => toggleSection('advanced')}
                >
                    <div className="card-title">
                        <Settings size={20} />
                        <span>Advanced Options</span>
                        <span className="optional-badge">Optional</span>
                    </div>
                    <motion.div
                        animate={{ rotate: expandedSections.advanced ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={20} />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {expandedSections.advanced && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card-content"
                        >
                            <div className="advanced-options">
                                {[
                                    {
                                        key: 'preserveMetadata',
                                        label: 'Preserve Metadata',
                                        description: 'Keep EXIF data and other metadata',
                                        icon: <Shield size={18} />
                                    },
                                    {
                                        key: 'progressive',
                                        label: 'Progressive Encoding',
                                        description: 'Enable progressive JPEG loading',
                                        icon: <Zap size={18} />
                                    },
                                    {
                                        key: 'optimize',
                                        label: 'Web Optimization',
                                        description: 'Additional compression for web use',
                                        icon: <Sparkles size={18} />
                                    }
                                ].map((option) => (
                                    <motion.div
                                        key={option.key}
                                        className="advanced-option"
                                        whileHover={{ backgroundColor: 'var(--hover)' }}
                                    >
                                        <div className="option-content">
                                            <div className="option-icon">{option.icon}</div>
                                            <div className="option-text">
                                                <h4>{option.label}</h4>
                                                <p>{option.description}</p>
                                            </div>
                                        </div>
                                        <motion.div
                                            className={`toggle-switch ${settings[option.key] ? 'active' : ''}`}
                                            onClick={() => updateSettings({ [option.key]: !settings[option.key] })}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <motion.div
                                                className="toggle-handle"
                                                animate={{ x: settings[option.key] ? 20 : 0 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <style jsx>{`
        :root {
          --primary-color: #667eea;
          --primary-light: #818cf8;
          --primary-dark: #4338ca;
          --secondary-color: #10b981;
          --accent-color: #f59e0b;
          --success-color: #10b981;
          --warning-color: #f59e0b;
          --error-color: #ef4444;
          
          /* Light theme */
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --bg-tertiary: #f1f5f9;
          --surface-0: #ffffff;
          --surface-1: #f8fafc;
          --surface-2: #f1f5f9;
          --surface-3: #e2e8f0;
          
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --text-muted: #94a3b8;
          --text-inverse: #ffffff;
          
          --border-primary: rgba(0, 0, 0, 0.05);
          --border-secondary: rgba(0, 0, 0, 0.08);
          --border-muted: rgba(0, 0, 0, 0.02);
          
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          
          --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --gradient-secondary: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .dark-theme {
          --primary-color: #818cf8;
          --primary-light: #a5b4fc;
          --primary-dark: #6366f1;
          
          /* Dark theme */
          --bg-primary: #0f172a;
          --bg-secondary: #1e293b;
          --bg-tertiary: #334155;
          --surface-0: #0f172a;
          --surface-1: #1e293b;
          --surface-2: #334155;
          --surface-3: #475569;
          
          --text-primary: #f1f5f9;
          --text-secondary: #cbd5e1;
          --text-muted: #94a3b8;
          --text-inverse: #0f172a;
          
          --border-primary: rgba(255, 255, 255, 0.1);
          --border-secondary: rgba(255, 255, 255, 0.15);
          --border-muted: rgba(255, 255, 255, 0.05);
          
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          
          --gradient-primary: linear-gradient(135deg, #4338ca 0%, #581c87 100%);
          --gradient-secondary: linear-gradient(135deg, #059669 0%, #047857 100%);
        }

        .optimization-settings-modern {
          background: var(--surface-0);
          border-radius: 16px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-primary);
          margin-bottom: var(--spacing-xl);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .optimization-settings-modern:hover {
          box-shadow: var(--shadow-xl);
        }

        .optimization-settings-modern.disabled {
          opacity: 0.6;
          pointer-events: none;
        }

        .settings-header-modern {
          background: var(--gradient-primary);
          padding: 24px;
          color: var(--text-inverse);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon-modern {
          background: rgba(255, 255, 255, 0.2);
          padding: 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .header-content-modern {
          flex: 1;
        }

        .header-content-modern h2 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-inverse);
        }

        .header-content-modern p {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .smart-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.15);
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          backdrop-filter: blur(10px);
          color: var(--text-inverse);
        }

        .settings-card {
          border-bottom: 1px solid var(--border-primary);
          background: var(--surface-0);
        }

        .settings-card:last-child {
          border-bottom: none;
        }

        .card-header {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          background: var(--surface-0);
        }

        .card-header:hover {
          background: var(--surface-1);
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 16px;
          color: var(--text-primary);
        }

        .optional-badge {
          background: var(--surface-2);
          color: var(--text-secondary);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          margin-left: 8px;
        }

        .card-content {
          padding: 0 24px 24px 24px;
          overflow: hidden;
          background: var(--surface-0);
        }

        .format-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .format-card-modern {
          position: relative;
          background: var(--surface-1);
          border: 2px solid var(--border-secondary);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          overflow: hidden;
        }

        .format-card-modern:hover {
          border-color: var(--primary-light);
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        .format-card-modern.selected {
          border-color: var(--primary-color);
          background: var(--surface-2);
          box-shadow: 0 0 0 1px var(--primary-color);
        }

        .popular-badge, .feature-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--success-color);
          color: var(--text-inverse);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .feature-badge {
          background: #8b5cf6;
        }

        .format-icon-modern {
          margin-bottom: 12px;
          display: flex;
          justify-content: center;
        }

        .format-info-modern h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .format-info-modern p {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .savings-modern {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          background: var(--surface-2);
          color: var(--success-color);
          border-radius: 8px;
          display: inline-block;
        }

        .selected-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 12px 12px 0 0;
        }

        .quality-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .quality-slider-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .quality-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .current-quality {
          font-size: 24px;
          font-weight: 700;
          color: var(--primary-color);
        }

        .quality-slider-modern {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #ef4444 0%, #f59e0b 25%, #10b981 75%, #3b82f6 100%);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .quality-slider-modern::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--surface-0);
          border: 3px solid var(--primary-color);
          cursor: pointer;
          box-shadow: var(--shadow-md);
        }

        .quality-slider-modern::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--surface-0);
          border: 3px solid var(--primary-color);
          cursor: pointer;
          box-shadow: var(--shadow-md);
        }

        .quality-presets-modern {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .quality-preset-modern {
          position: relative;
          background: var(--surface-1);
          border: 2px solid var(--border-secondary);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }

        .quality-preset-modern:hover {
          border-color: var(--accent-color, var(--primary-color));
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .quality-preset-modern.selected {
          border-color: var(--accent-color, var(--primary-color));
          background: var(--surface-2);
          box-shadow: 0 0 0 1px var(--accent-color, var(--primary-color));
        }

        .preset-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .preset-label {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }

        .preset-description {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .preset-value {
          font-weight: 700;
          font-size: 16px;
          color: var(--accent-color, var(--primary-color));
        }

        .recommended-badge {
          position: absolute;
          top: -6px;
          right: 8px;
          background: var(--success-color);
          color: var(--text-inverse);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }

        .size-presets-modern {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .size-preset-modern {
          background: var(--surface-2);
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .size-preset-modern:hover {
          background: var(--surface-3);
          color: var(--primary-color);
        }

        .size-preset-modern.selected {
          background: var(--primary-color);
          color: var(--text-inverse);
        }

        .custom-size-modern {
          margin-top: 16px;
        }

        .custom-inputs {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .input-group label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .dimension-input {
          padding: 12px;
          border: 2px solid var(--border-secondary);
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: var(--surface-1);
          color: var(--text-primary);
        }

        .dimension-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
        }

        .input-separator {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 16px;
        }

        .size-hint {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        .advanced-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .advanced-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-radius: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
          background: var(--surface-1);
          border: 1px solid var(--border-primary);
        }

        .advanced-option:hover {
          background: var(--surface-2);
          border-color: var(--border-secondary);
        }

        .option-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .option-icon {
          color: var(--primary-color);
        }

        .option-text h4 {
          margin: 0 0 2px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .option-text p {
          margin: 0;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .toggle-switch {
          width: 44px;
          height: 24px;
          background: var(--surface-2);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-switch.active {
          background: var(--primary-color);
        }

        .toggle-handle {
          width: 20px;
          height: 20px;
          background: var(--surface-0);
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
        }

        .toggle-switch.active .toggle-handle {
          transform: translateX(20px);
        }

        @media (max-width: 768px) {
          .format-grid-modern {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .quality-presets-modern {
            grid-template-columns: 1fr;
          }
          
          .custom-inputs {
            flex-direction: column;
          }
          
          .input-separator {
            margin-top: 0;
            align-self: center;
          }
        }
      `}</style>
        </motion.div>
    );
};

export default OptimizationSettings;