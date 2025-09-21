-- Migration script to upgrade the images table with new columns
-- Run this script to add support for advanced features

-- Add new columns to the existing images table
ALTER TABLE images ADD COLUMN IF NOT EXISTS original_size BIGINT;
ALTER TABLE images ADD COLUMN IF NOT EXISTS optimized_size BIGINT;
ALTER TABLE images ADD COLUMN IF NOT EXISTS compression_ratio DECIMAL(5,2);
ALTER TABLE images ADD COLUMN IF NOT EXISTS format VARCHAR(10);
ALTER TABLE images ADD COLUMN IF NOT EXISTS quality INTEGER;
ALTER TABLE images ADD COLUMN IF NOT EXISTS processing_time INTEGER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
CREATE INDEX IF NOT EXISTS idx_images_format ON images(format);
CREATE INDEX IF NOT EXISTS idx_images_compression_ratio ON images(compression_ratio);

-- Update existing records with default values (if needed)
UPDATE images SET 
  format = 'webp',
  quality = 75,
  compression_ratio = 0.0
WHERE format IS NULL;

-- Create a view for statistics
CREATE OR REPLACE VIEW image_stats AS
SELECT 
  COUNT(*) as total_images,
  SUM(original_size) as total_original_size,
  SUM(optimized_size) as total_optimized_size,
  AVG(compression_ratio) as avg_compression_ratio,
  AVG(processing_time) as avg_processing_time,
  COUNT(DISTINCT format) as formats_used,
  SUM(original_size) - SUM(optimized_size) as total_bytes_saved
FROM images;

-- Optional: Create table for user sessions/preferences (future use)
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE,
  default_format VARCHAR(10) DEFAULT 'webp',
  default_quality INTEGER DEFAULT 75,
  default_width INTEGER,
  default_height INTEGER,
  preserve_metadata BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create table for batch processing jobs (future use)
CREATE TABLE IF NOT EXISTS batch_jobs (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(255) UNIQUE,
  total_files INTEGER,
  processed_files INTEGER DEFAULT 0,
  failed_files INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

COMMENT ON TABLE images IS 'Stores information about processed images';
COMMENT ON TABLE user_preferences IS 'Stores user optimization preferences';
COMMENT ON TABLE batch_jobs IS 'Tracks batch processing jobs';