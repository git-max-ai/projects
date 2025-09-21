import React, { useState, useEffect } from "react";
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import UploadForm from "./components/UploadForm";
import ImageGallery from './components/ImageGallery';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import { Upload, Image, BarChart3 } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [processedImages, setProcessedImages] = useState([]);

  // Load processed images from localStorage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('processedImages');
    if (savedImages) {
      try {
        setProcessedImages(JSON.parse(savedImages));
      } catch (error) {
        console.error('Error loading saved images:', error);
      }
    }
  }, []);

  // Save processed images to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('processedImages', JSON.stringify(processedImages));
  }, [processedImages]);

  const handleImageProcessed = (newImages) => {
    const imagesWithTimestamp = newImages.map(img => ({
      ...img,
      timestamp: new Date().toISOString()
    }));
    setProcessedImages(prev => [...imagesWithTimestamp, ...prev]);
  };

  const handleDownloadImage = async (image) => {
    try {
      const response = await fetch(image.optimizedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimized-${image.originalFile.name}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDeleteImage = (imageToDelete) => {
    setProcessedImages(prev => prev.filter(img => img.id !== imageToDelete.id));
  };

  const handleClearAllImages = () => {
    if (window.confirm('Delete all processed images?')) {
      setProcessedImages([]);
    }
  };

  const handleNavigateToUpload = () => {
    setActiveTab('upload');
    // Scroll to upload form after tab change
    setTimeout(() => {
      const uploadSection = document.querySelector('#upload-section');
      if (uploadSection) {
        uploadSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleTabClick = (tabId) => {
    if (tabId === 'upload') {
      handleNavigateToUpload();
    } else {
      setActiveTab(tabId);
    }
  };

  const tabs = [
    {
      id: 'upload',
      label: 'Upload & Optimize',
      icon: Upload,
      component: (
        <UploadForm
          onImagesProcessed={handleImageProcessed}
        />
      )
    },
    {
      id: 'gallery',
      label: 'Image Gallery',
      icon: Image,
      component: (
        <ImageGallery
          images={processedImages}
          onDownload={handleDownloadImage}
          onDelete={handleDeleteImage}
          onClearAll={handleClearAllImages}
          onNavigateToUpload={handleNavigateToUpload}
        />
      )
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      component: (
        <PerformanceAnalytics
          images={processedImages}
        />
      )
    }
  ];

  return (
    <ThemeProvider>
      <div className="App">
        <Header />
        <main className="main-content">
          <div className="container">
            {/* Hero Section - Only show on upload tab */}
            {activeTab === 'upload' && (
              <section className="hero-section">
                <div className="hero-content">
                  <h1 className="heading-1">
                    Optimize Your Images
                    <br />
                    <span className="gradient-text">Instantly</span>
                  </h1>
                  <p className="text-large">
                    Compress images up to 90% without losing quality.
                    Support for WebP, AVIF, JPEG, and PNG formats with advanced processing.
                  </p>
                  <div className="hero-features">
                    <div className="feature">
                      <span className="feature-icon">⚡</span>
                      <span>Lightning Fast</span>
                    </div>
                    <div className="feature">
                      <span className="feature-icon">🎯</span>
                      <span>Perfect Quality</span>
                    </div>
                    <div className="feature">
                      <span className="feature-icon">🔒</span>
                      <span>Privacy First</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Navigation Tabs */}
            <nav className="tab-navigation">
              <div className="tab-container">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    >
                      <IconComponent size={18} />
                      <span>{tab.label}</span>
                      {tab.id === 'gallery' && processedImages.length > 0 && (
                        <span className="tab-badge">{processedImages.length}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Main Content Area */}
            <section className="content-section">
              {tabs.find(tab => tab.id === activeTab)?.component}
            </section>
          </div>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
