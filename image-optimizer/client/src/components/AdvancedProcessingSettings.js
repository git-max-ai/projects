import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import {
    Crop,
    Type,
    Filter,
    Palette,
    Eye,
    EyeOff,
    Zap,
    Sparkles,
    ChevronRight,
    Focus,
    Settings,
    Info,
    HelpCircle,
    Gauge,
    RotateCcw,
    Star,
    Target,
    Image,
    Monitor,
    Printer
} from 'lucide-react';

const AdvancedProcessingSettings = ({ settings = {}, updateSettings, disabled = false }) => {
    const { isDark } = useTheme();
    const [showPreview, setShowPreview] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        crop: false,
        watermark: false,
        enhancement: false,
        colorSpace: false
    });

    // Smart presets for common use cases
    const presets = [
        {
            name: 'Web Optimization',
            icon: <Monitor size={20} />,
            description: 'Optimized for web display with fast loading',
            settings: {
                smartCrop: true,
                cropFocus: 'attention',
                watermark: false,
                sharpen: true,
                sharpenAmount: 1.2,
                noise: true,
                noiseAmount: 2,
                colorSpace: 'srgb'
            },
            color: '#10b981'
        },
        {
            name: 'Social Media',
            icon: <Target size={20} />,
            description: 'Perfect for social platforms with face detection',
            settings: {
                smartCrop: true,
                cropFocus: 'faces',
                watermark: true,
                watermarkText: '@yourhandle',
                watermarkPosition: 'bottom-right',
                watermarkOpacity: 0.7,
                sharpen: true,
                sharpenAmount: 1.5,
                noise: false,
                colorSpace: 'srgb'
            },
            color: '#f59e0b'
        },
        {
            name: 'Print Quality',
            icon: <Printer size={20} />,
            description: 'High quality settings for printing',
            settings: {
                smartCrop: false,
                watermark: false,
                sharpen: false,
                noise: false,
                colorSpace: 'adobe'
            },
            color: '#8b5cf6'
        }
    ];

    const applyPreset = (preset) => {
        updateSettings(preset.settings);
    };

    const resetToDefaults = () => {
        updateSettings({
            smartCrop: false,
            cropFocus: 'center',
            watermark: false,
            watermarkText: '',
            watermarkPosition: 'bottom-right',
            watermarkOpacity: 0.5,
            sharpen: false,
            sharpenAmount: 1.0,
            noise: false,
            noiseAmount: 2,
            colorSpace: 'srgb'
        });
    };

    // Check if current settings match a preset
    const getActivePreset = () => {
        return presets.find(preset => {
            const presetSettings = preset.settings;
            return Object.keys(presetSettings).every(key => {
                return settings[key] === presetSettings[key];
            });
        });
    };

    const activePreset = getActivePreset();

    const getProcessingComplexity = () => {
        let complexity = 0;
        if (settings.smartCrop) complexity += 2;
        if (settings.watermark) complexity += 1;
        if (settings.sharpen) complexity += 1;
        if (settings.noise) complexity += 2;
        if (settings.colorSpace !== 'srgb') complexity += 1;
        return complexity;
    };

    const getComplexityColor = (complexity) => {
        if (complexity <= 2) return '#10b981'; // Green
        if (complexity <= 4) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    const getComplexityLabel = (complexity) => {
        if (complexity <= 2) return 'Fast';
        if (complexity <= 4) return 'Moderate';
        return 'Slow';
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Crop focus options
    const cropFocusOptions = [
        { value: 'center', label: 'Center', description: 'Focus on center of image' },
        { value: 'faces', label: 'Faces', description: 'Detect and focus on faces' },
        { value: 'attention', label: 'Attention', description: 'AI-powered attention detection' },
        { value: 'entropy', label: 'Entropy', description: 'Focus on high-detail areas' }
    ];

    // Watermark positions
    const watermarkPositions = [
        { value: 'top-left', label: 'Top Left' },
        { value: 'top-right', label: 'Top Right' },
        { value: 'bottom-left', label: 'Bottom Left' },
        { value: 'bottom-right', label: 'Bottom Right' },
        { value: 'center', label: 'Center' }
    ];

    // Color space options
    const colorSpaceOptions = [
        { value: 'srgb', label: 'sRGB', description: 'Standard web color space' },
        { value: 'p3', label: 'Display P3', description: 'Wide gamut for modern displays' },
        { value: 'rec2020', label: 'Rec. 2020', description: 'HDR and 4K content' },
        { value: 'adobe', label: 'Adobe RGB', description: 'Photography and printing' }
    ];

    // Simple watermark preview component
    const WatermarkPreview = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="watermark-preview"
        >
            <div className="preview-container">
                <div className="preview-image">
                    <span className="preview-text" style={{ opacity: settings.watermarkOpacity }}>
                        {settings.watermarkText || 'Sample Watermark'}
                    </span>
                </div>
            </div>
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`advanced-processing-settings-modern ${disabled ? 'disabled' : ''}`}
        >
            {/* Header */}
            <div className="settings-header-modern">
                <div className="header-icon-modern">
                    <Settings size={24} />
                </div>
                <div className="header-content-modern">
                    <h2>Advanced Processing</h2>
                    <p>Fine-tune your images with professional-grade enhancements</p>
                </div>
                <div className="header-status">
                    <motion.button
                        className="info-button"
                        onClick={() => setShowInfo(!showInfo)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Info size={16} />
                        Info
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="info-panel"
                    >
                        <div className="info-content">
                            <p>
                                <strong>When to use:</strong> Advanced settings are perfect for professional workflows,
                                social media content, or when you need specific image enhancements.
                            </p>
                            <p>
                                <strong>Performance impact:</strong> More settings enabled = longer processing time.
                                Use presets for optimal results.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Processing Impact Indicator */}
            <div className="processing-indicator">
                <div className="indicator-content">
                    <Gauge size={16} />
                    <span>Processing Speed: </span>
                    <span
                        className={`complexity-label complexity-${getComplexityLabel(getProcessingComplexity()).toLowerCase()}`}
                    >
                        {getComplexityLabel(getProcessingComplexity())}
                    </span>
                </div>
                <div
                    className={`complexity-bar complexity-bar-${getComplexityLabel(getProcessingComplexity()).toLowerCase()}`}
                    style={{
                        width: `${Math.min(getProcessingComplexity() * 14.3, 100)}%`
                    }}
                />
            </div>

            {/* Smart Presets Section */}
            <motion.div className="presets-section">
                <div className="presets-header">
                    <div className="presets-title">
                        <Star size={18} />
                        <span>Quick Presets</span>
                    </div>
                    <motion.button
                        className="reset-button"
                        onClick={resetToDefaults}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <RotateCcw size={16} />
                        Reset All
                    </motion.button>
                </div>

                <div className="presets-grid">
                    {presets.map((preset, index) => (
                        <motion.div
                            key={preset.name}
                            className={`preset-card ${activePreset?.name === preset.name ? 'selected' : ''}`}
                            onClick={() => applyPreset(preset)}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ '--preset-color': preset.color }}
                        >
                            <div className="preset-icon" style={{ backgroundColor: preset.color }}>
                                {preset.icon}
                            </div>
                            <div className="preset-info">
                                <h4>{preset.name}</h4>
                                <p>{preset.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
            {/* Smart Cropping Card */}
            <motion.div className="settings-card">
                <div
                    className="card-header"
                    onClick={() => toggleSection('crop')}
                >
                    <div className="card-title">
                        <Crop size={20} />
                        <span>Smart Cropping</span>
                        {settings.smartCrop && (
                            <div className="active-indicator">
                                <div className="active-dot" />
                            </div>
                        )}
                    </div>
                    <motion.div
                        animate={{ rotate: expandedSections.crop ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={20} />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {expandedSections.crop && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card-content"
                        >
                            <div className="toggle-section-modern">
                                <motion.div
                                    className={`toggle-switch-modern ${settings.smartCrop ? 'active' : ''}`}
                                    onClick={() => updateSettings({ smartCrop: !settings.smartCrop })}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <motion.div
                                        className="toggle-handle-modern"
                                        animate={{ x: settings.smartCrop ? 20 : 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                </motion.div>
                                <div className="toggle-info">
                                    <h4>{settings.smartCrop ? 'Enabled' : 'Disabled'}</h4>
                                    <p>Intelligently crop images to maintain focus on important areas</p>
                                </div>
                            </div>

                            <AnimatePresence>
                                {settings.smartCrop && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="crop-options-modern"
                                    >
                                        <h5 className="subsection-title">Focus Area</h5>
                                        <div className="crop-focus-grid-modern">
                                            {cropFocusOptions.map((option) => (
                                                <motion.div
                                                    key={option.value}
                                                    className={`focus-option-modern ${settings.cropFocus === option.value ? 'selected' : ''}`}
                                                    onClick={() => updateSettings({ cropFocus: option.value })}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className="focus-icon-modern">
                                                        <Focus size={18} />
                                                    </div>
                                                    <div className="focus-info-modern">
                                                        <span className="focus-label">{option.label}</span>
                                                        <span className="focus-description">{option.description}</span>
                                                    </div>
                                                    {settings.cropFocus === option.value && (
                                                        <motion.div
                                                            layoutId="selected-crop"
                                                            className="selected-indicator-modern"
                                                        />
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Watermark Card */}
            <motion.div className="settings-card">
                <div
                    className="card-header"
                    onClick={() => toggleSection('watermark')}
                >
                    <div className="card-title">
                        <Type size={20} />
                        <span>Watermark</span>
                        {settings.watermark && (
                            <div className="active-indicator">
                                <div className="active-dot" />
                            </div>
                        )}
                    </div>
                    <motion.div
                        animate={{ rotate: expandedSections.watermark ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={20} />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {expandedSections.watermark && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card-content"
                        >
                            <div className="toggle-section-modern">
                                <motion.div
                                    className={`toggle-switch-modern ${settings.watermark ? 'active' : ''}`}
                                    onClick={() => updateSettings({ watermark: !settings.watermark })}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <motion.div
                                        className="toggle-handle-modern"
                                        animate={{ x: settings.watermark ? 20 : 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                </motion.div>
                                <div className="toggle-info">
                                    <h4>{settings.watermark ? 'Enabled' : 'Disabled'}</h4>
                                    <p>Add custom text watermark to protect your images</p>
                                </div>
                            </div>

                            <AnimatePresence>
                                {settings.watermark && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="watermark-options-modern"
                                    >
                                        <div className="watermark-controls-modern">
                                            <div className="input-group-modern">
                                                <label>Watermark Text</label>
                                                <input
                                                    type="text"
                                                    value={settings.watermarkText}
                                                    onChange={(e) => updateSettings({ watermarkText: e.target.value })}
                                                    placeholder="Enter watermark text..."
                                                    className="modern-input"
                                                />
                                            </div>

                                            <div className="input-group-modern">
                                                <label>Position</label>
                                                <select
                                                    value={settings.watermarkPosition}
                                                    onChange={(e) => updateSettings({ watermarkPosition: e.target.value })}
                                                    className="modern-select"
                                                >
                                                    {watermarkPositions.map((pos) => (
                                                        <option key={pos.value} value={pos.value}>
                                                            {pos.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="input-group-modern">
                                                <label>Opacity: {Math.round(settings.watermarkOpacity * 100)}%</label>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1"
                                                    step="0.1"
                                                    value={settings.watermarkOpacity}
                                                    onChange={(e) => updateSettings({ watermarkOpacity: parseFloat(e.target.value) })}
                                                    className="modern-slider"
                                                />
                                            </div>
                                        </div>

                                        <div className="watermark-preview-controls-modern">
                                            <motion.button
                                                type="button"
                                                onClick={() => setShowPreview(!showPreview)}
                                                className="preview-btn"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                                            </motion.button>
                                        </div>

                                        <AnimatePresence>
                                            {showPreview && <WatermarkPreview />}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Image Enhancement Card */}
            <motion.div className="settings-card">
                <div
                    className="card-header"
                    onClick={() => toggleSection('enhancement')}
                >
                    <div className="card-title">
                        <Filter size={20} />
                        <span>Image Enhancement</span>
                        {(settings.sharpen || settings.noise) && (
                            <div className="active-indicator">
                                <div className="active-dot" />
                            </div>
                        )}
                    </div>
                    <motion.div
                        animate={{ rotate: expandedSections.enhancement ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={20} />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {expandedSections.enhancement && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card-content"
                        >
                            <div className="enhancement-options-modern">
                                {/* Sharpen Option */}
                                <motion.div
                                    className="enhancement-option"
                                    whileHover={{ backgroundColor: 'var(--hover)' }}
                                >
                                    <div className="option-content">
                                        <div className="option-icon">
                                            <Zap size={18} />
                                        </div>
                                        <div className="option-text">
                                            <h4>Sharpen</h4>
                                            <p>Enhance image details and edges</p>
                                        </div>
                                    </div>
                                    <motion.div
                                        className={`toggle-switch-small ${settings.sharpen ? 'active' : ''}`}
                                        onClick={() => updateSettings({ sharpen: !settings.sharpen })}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <motion.div
                                            className="toggle-handle-small"
                                            animate={{ x: settings.sharpen ? 16 : 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    </motion.div>
                                </motion.div>

                                <AnimatePresence>
                                    {settings.sharpen && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="enhancement-control-modern"
                                        >
                                            <label>Sharpening Amount: {settings.sharpenAmount}</label>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="3"
                                                step="0.1"
                                                value={settings.sharpenAmount}
                                                onChange={(e) => updateSettings({ sharpenAmount: parseFloat(e.target.value) })}
                                                className="modern-slider"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Noise Reduction Option */}
                                <motion.div
                                    className="enhancement-option"
                                    whileHover={{ backgroundColor: 'var(--hover)' }}
                                >
                                    <div className="option-content">
                                        <div className="option-icon">
                                            <Sparkles size={18} />
                                        </div>
                                        <div className="option-text">
                                            <h4>Noise Reduction</h4>
                                            <p>Reduce image noise and grain</p>
                                        </div>
                                    </div>
                                    <motion.div
                                        className={`toggle-switch-small ${settings.noise ? 'active' : ''}`}
                                        onClick={() => updateSettings({ noise: !settings.noise })}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <motion.div
                                            className="toggle-handle-small"
                                            animate={{ x: settings.noise ? 16 : 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    </motion.div>
                                </motion.div>

                                <AnimatePresence>
                                    {settings.noise && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="enhancement-control-modern"
                                        >
                                            <label>Noise Reduction: {settings.noiseAmount}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                step="1"
                                                value={settings.noiseAmount}
                                                onChange={(e) => updateSettings({ noiseAmount: parseInt(e.target.value) })}
                                                className="modern-slider"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Color Space Card */}
            <motion.div className="settings-card">
                <div
                    className="card-header"
                    onClick={() => toggleSection('colorSpace')}
                >
                    <div className="card-title">
                        <Palette size={20} />
                        <span>Color Space</span>
                        {settings.colorSpace && settings.colorSpace !== 'srgb' && (
                            <div className="active-indicator">
                                <div className="active-dot" />
                            </div>
                        )}
                    </div>
                    <motion.div
                        animate={{ rotate: expandedSections.colorSpace ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={20} />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {expandedSections.colorSpace && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card-content"
                        >
                            <div className="color-space-grid-modern">
                                {colorSpaceOptions.map((option) => (
                                    <motion.div
                                        key={option.value}
                                        className={`color-space-option-modern ${settings.colorSpace === option.value ? 'selected' : ''}`}
                                        onClick={() => updateSettings({ colorSpace: option.value })}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="color-space-info">
                                            <h4>{option.label}</h4>
                                            <p>{option.description}</p>
                                        </div>
                                        {settings.colorSpace === option.value && (
                                            <motion.div
                                                layoutId="selected-colorspace"
                                                className="selected-indicator-modern"
                                            />
                                        )}
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

                .advanced-processing-settings-modern {
                    background: var(--surface-0);
                    border-radius: 16px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-primary);
                    margin-bottom: var(--spacing-xl);
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .advanced-processing-settings-modern:hover {
                    box-shadow: var(--shadow-xl);
                }

                .advanced-processing-settings-modern.disabled {
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

                .header-status {
                    display: flex;
                    align-items: center;
                }

                .info-button {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.15);
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    backdrop-filter: blur(10px);
                    border: none;
                    color: var(--text-inverse);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .info-button:hover {
                    background: rgba(255, 255, 255, 0.25);
                }

                .info-panel {
                    padding: 20px 24px;
                    background: rgba(255, 255, 255, 0.1);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-inverse);
                    overflow: hidden;
                }

                .info-content p {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    line-height: 1.5;
                    color: rgba(255, 255, 255, 0.9);
                }

                .info-content p:last-child {
                    margin-bottom: 0;
                }

                .processing-indicator {
                    padding: 16px 24px;
                    background: var(--surface-1);
                    border-bottom: 1px solid var(--border-primary);
                    color: var(--text-primary);
                }

                .indicator-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    margin-bottom: 8px;
                }

                .complexity-label {
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .complexity-label.complexity-fast {
                    color: var(--success-color);
                }

                .complexity-label.complexity-moderate {
                    color: var(--warning-color);
                }

                .complexity-label.complexity-slow {
                    color: var(--error-color);
                }

                .complexity-bar {
                    height: 4px;
                    border-radius: 2px;
                    transition: all 0.3s ease;
                    background: var(--surface-2);
                }

                .complexity-bar-fast {
                    background: var(--success-color);
                }

                .complexity-bar-moderate {
                    background: var(--warning-color);
                }

                .complexity-bar-slow {
                    background: var(--error-color);
                }

                .presets-section {
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-primary);
                    background: var(--surface-1);
                }

                .presets-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .presets-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 16px;
                }

                .reset-button {
                    background: var(--surface-2);
                    border: none;
                    border-radius: 8px;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .reset-button:hover {
                    background: var(--primary-color);
                    color: var(--text-inverse);
                }

                .presets-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                }

                .preset-card {
                    background: var(--surface-0);
                    border: 2px solid var(--border-secondary);
                    border-radius: 12px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-align: left;
                    position: relative;
                }

                .preset-card:hover {
                    border-color: var(--preset-color);
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-2px);
                }

                .preset-card.selected {
                    border-color: var(--preset-color);
                    background: var(--surface-1);
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-2px);
                }

                .preset-card.selected::after {
                    content: '';
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 16px;
                    height: 16px;
                    background: var(--preset-color);
                    border-radius: 50%;
                    box-shadow: 0 0 0 3px var(--surface-0), 0 2px 8px rgba(0, 0, 0, 0.2);
                    animation: selectedPulse 2s infinite;
                }

                @keyframes selectedPulse {
                    0% {
                        box-shadow: 0 0 0 3px var(--surface-0), 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 0 var(--preset-color);
                    }
                    70% {
                        box-shadow: 0 0 0 3px var(--surface-0), 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 8px transparent;
                    }
                    100% {
                        box-shadow: 0 0 0 3px var(--surface-0), 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 0 transparent;
                    }
                }

                .preset-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-inverse);
                    flex-shrink: 0;
                }

                .preset-info h4 {
                    margin: 0 0 4px 0;
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 14px;
                }

                .preset-info p {
                    margin: 0;
                    font-size: 12px;
                    color: var(--text-secondary);
                    line-height: 1.4;
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

                .active-indicator {
                    display: flex;
                    align-items: center;
                    margin-left: 8px;
                }

                .active-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--success-color);
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                    }
                }

                .card-content {
                    padding: 0 24px 24px 24px;
                    overflow: hidden;
                    background: var(--surface-0);
                }

                .toggle-section-modern {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    padding: 16px;
                    background: var(--surface-1);
                    border-radius: 8px;
                    border: 1px solid var(--border-primary);
                }

                .toggle-switch-modern {
                    width: 48px;
                    height: 28px;
                    background: var(--surface-2);
                    border-radius: 14px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                }

                .toggle-switch-modern.active {
                    background: var(--primary-color);
                }

                .toggle-handle-modern {
                    width: 24px;
                    height: 24px;
                    background: var(--surface-0);
                    border-radius: 50%;
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    box-shadow: var(--shadow-sm);
                    transition: all 0.3s ease;
                }

                .toggle-switch-modern.active .toggle-handle-modern {
                    transform: translateX(20px);
                }

                .toggle-switch-small {
                    width: 36px;
                    height: 20px;
                    background: var(--surface-2);
                    border-radius: 10px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                }

                .toggle-switch-small.active {
                    background: var(--primary-color);
                }

                .toggle-handle-small {
                    width: 16px;
                    height: 16px;
                    background: var(--surface-0);
                    border-radius: 50%;
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    box-shadow: var(--shadow-sm);
                    transition: all 0.3s ease;
                }

                .toggle-switch-small.active .toggle-handle-small {
                    transform: translateX(16px);
                }

                .toggle-info h4 {
                    margin: 0 0 4px 0;
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 16px;
                }

                .toggle-info p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 14px;
                    line-height: 1.5;
                }

                .subsection-title {
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 14px;
                    margin: 0 0 16px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .crop-focus-grid-modern {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 12px;
                }

                .focus-option-modern {
                    background: var(--surface-1);
                    border: 2px solid var(--border-secondary);
                    border-radius: 8px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .focus-option-modern:hover {
                    border-color: var(--primary-color);
                    box-shadow: var(--shadow-lg);
                }

                .focus-option-modern.selected {
                    border-color: var(--primary-color);
                    background: var(--surface-2);
                    box-shadow: 0 0 0 1px var(--primary-color);
                }

                .focus-icon-modern {
                    width: 36px;
                    height: 36px;
                    background: var(--primary-color);
                    color: var(--text-inverse);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .focus-info-modern {
                    flex: 1;
                }

                .focus-label {
                    display: block;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }

                .focus-description {
                    display: block;
                    font-size: 14px;
                    color: var(--text-secondary);
                    line-height: 1.4;
                }

                .selected-indicator-modern {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 12px;
                    height: 12px;
                    background: var(--primary-color);
                    border-radius: 50%;
                }

                .watermark-options-modern,
                .crop-options-modern {
                    margin-top: 16px;
                }

                .watermark-controls-modern {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .input-group-modern {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .input-group-modern label {
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 14px;
                }

                .modern-input,
                .modern-select {
                    padding: 12px 16px;
                    border: 2px solid var(--border-secondary);
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: var(--surface-1);
                    color: var(--text-primary);
                }

                .modern-input:focus,
                .modern-select:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
                }

                .modern-slider {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    outline: none;
                    -webkit-appearance: none;
                    appearance: none;
                    background: linear-gradient(to right, var(--surface-2) 0%, var(--primary-color) 100%);
                    cursor: pointer;
                }

                .modern-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    cursor: pointer;
                    box-shadow: var(--shadow-md);
                    transition: all 0.3s ease;
                }

                .modern-slider::-webkit-slider-thumb:hover {
                    box-shadow: var(--shadow-lg);
                    transform: scale(1.1);
                }

                .modern-slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    cursor: pointer;
                    border: none;
                    box-shadow: var(--shadow-md);
                }

                .watermark-preview-controls-modern {
                    display: flex;
                    justify-content: center;
                    margin-top: 16px;
                }

                .preview-btn {
                    background: var(--primary-color);
                    color: var(--text-inverse);
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                }

                .preview-btn:hover {
                    background: var(--primary-dark);
                    box-shadow: var(--shadow-lg);
                }

                .enhancement-options-modern {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .enhancement-option {
                    background: var(--surface-1);
                    border: 1px solid var(--border-primary);
                    border-radius: 8px;
                    padding: 16px;
                    transition: all 0.3s ease;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                }

                .enhancement-option:hover {
                    background: var(--surface-2);
                    border-color: var(--primary-color);
                }

                .option-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .option-icon {
                    width: 36px;
                    height: 36px;
                    background: var(--success-color);
                    color: var(--text-inverse);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .option-text h4 {
                    margin: 0 0 4px 0;
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 15px;
                }

                .option-text p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 13px;
                    line-height: 1.4;
                }

                .enhancement-control-modern {
                    margin-top: 16px;
                    padding: 16px;
                    background: var(--surface-1);
                    border-radius: 8px;
                    border: 1px solid var(--border-primary);
                }

                .enhancement-control-modern label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: 14px;
                }

                .color-space-grid-modern {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 12px;
                }

                .color-space-option-modern {
                    background: var(--surface-1);
                    border: 2px solid var(--border-secondary);
                    border-radius: 8px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .color-space-option-modern:hover {
                    border-color: var(--primary-color);
                    box-shadow: var(--shadow-lg);
                }

                .color-space-option-modern.selected {
                    border-color: var(--primary-color);
                    background: var(--surface-2);
                    box-shadow: 0 0 0 1px var(--primary-color);
                }

                .color-space-info h4 {
                    margin: 0 0 8px 0;
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 15px;
                }

                .color-space-info p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 13px;
                    line-height: 1.4;
                }

                .watermark-preview {
                    margin-top: 16px;
                    padding: 16px;
                    background: var(--surface-1);
                    border-radius: 8px;
                    border: 1px solid var(--border-primary);
                }

                .preview-container {
                    background: linear-gradient(45deg, var(--surface-2) 25%, transparent 25%), 
                                linear-gradient(-45deg, var(--surface-2) 25%, transparent 25%), 
                                linear-gradient(45deg, transparent 75%, var(--surface-2) 75%), 
                                linear-gradient(-45deg, transparent 75%, var(--surface-2) 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .preview-image {
                    width: 200px;
                    height: 150px;
                    background: var(--surface-2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    margin: 0 auto;
                }

                .preview-text {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    color: var(--text-inverse);
                    background: rgba(0, 0, 0, 0.7);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }

                @media (max-width: 768px) {
                    .settings-header-modern {
                        padding: 20px;
                        flex-direction: column;
                        gap: 12px;
                        align-items: flex-start;
                    }

                    .header-content-modern h2 {
                        font-size: 18px;
                    }

                    .header-content-modern p {
                        font-size: 13px;
                    }

                    .presets-section {
                        padding: 16px 20px;
                    }

                    .presets-grid {
                        grid-template-columns: 1fr;
                    }

                    .card-content {
                        padding: 0 20px 20px 20px;
                    }

                    .card-header {
                        padding: 16px 20px;
                    }

                    .crop-focus-grid-modern {
                        grid-template-columns: 1fr;
                    }

                    .color-space-grid-modern {
                        grid-template-columns: 1fr;
                    }

                    .watermark-controls-modern {
                        grid-template-columns: 1fr;
                    }

                    .toggle-section-modern {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }

                    .preset-card {
                        flex-direction: column;
                        text-align: center;
                        padding: 20px 16px;
                    }

                    .preset-icon {
                        width: 48px;
                        height: 48px;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default AdvancedProcessingSettings;