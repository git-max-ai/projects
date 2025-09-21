import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Zap, Github, Heart } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header = () => {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="header"
        >
            <div className="container header-content">
                {/* Logo and Brand */}
                <div className="brand">
                    <motion.div
                        className="logo"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Zap className="logo-icon" />
                        <span className="logo-text">ImageOptimizer</span>
                    </motion.div>
                    <span className="brand-tagline">Professional Image Compression</span>
                </div>

                {/* Navigation */}
                <nav className="nav">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#gallery" className="nav-link">Gallery</a>
                    <a href="#about" className="nav-link">About</a>
                </nav>

                {/* Actions */}
                <div className="header-actions">
                    <motion.button
                        onClick={toggleTheme}
                        className="theme-toggle"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    >
                        <motion.div
                            initial={false}
                            animate={{ rotate: isDark ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </motion.div>
                    </motion.button>

                    <motion.a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="github-link"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="View on GitHub"
                    >
                        <Github size={20} />
                    </motion.a>
                </div>
            </div>

            <style jsx>{`
        .header {
          background: var(--glass-background);
          border-bottom: 1px solid var(--glass-border);
          padding: var(--spacing-md) 0;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: var(--transition);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-lg);
        }

        .brand {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
          text-decoration: none;
          color: var(--text-primary);
        }

        .logo-icon {
          color: var(--primary-color);
          width: 32px;
          height: 32px;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-tagline {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-left: 40px;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: var(--transition);
          position: relative;
        }

        .nav-link:hover {
          color: var(--primary-color);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--primary-color);
          transition: width 0.3s ease;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .theme-toggle,
        .github-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition);
          text-decoration: none;
        }

        .theme-toggle:hover,
        .github-link:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
          box-shadow: var(--shadow);
          transform: translateY(-1px);
        }

        .theme-toggle:active,
        .github-link:active {
          transform: scale(0.95);
        }

        @media (max-width: 768px) {
          .header-content {
            gap: var(--spacing-md);
          }

          .nav {
            display: none;
          }

          .brand-tagline {
            display: none;
          }

          .logo-text {
            font-size: 1.25rem;
          }

          .header-actions {
            gap: var(--spacing-xs);
          }

          .theme-toggle,
          .github-link {
            width: 36px;
            height: 36px;
          }
        }

        @media (max-width: 480px) {
          .header {
            padding: var(--spacing-sm) 0;
          }

          .brand {
            gap: 0;
          }

          .logo {
            gap: var(--spacing-xs);
          }

          .logo-icon {
            width: 24px;
            height: 24px;
          }

          .logo-text {
            font-size: 1.125rem;
          }
        }
      `}</style>
        </motion.header>
    );
};

export default Header;