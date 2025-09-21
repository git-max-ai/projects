import express from "express";
import multer from "multer";
import sharp from "sharp";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// ---------- Middlewares ----------
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ---------- Postgres ----------
const pool = new Pool();

// ---------- Folders ----------
const uploadDir = path.join(process.cwd(), "uploads");
const optimizedDir = path.join(process.cwd(), "optimized");
[uploadDir, optimizedDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// ---------- Multer (file upload) ----------
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) =>
        cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images are allowed.'));
        }
    }
});

// ---------- Helper Functions ----------

const getFileExtension = (format) => {
    const extensions = {
        'jpeg': 'jpg',
        'jpg': 'jpg',
        'png': 'png',
        'webp': 'webp',
        'avif': 'avif',
        'gif': 'gif',
        'bmp': 'bmp',
        'tiff': 'tiff'
    };
    return extensions[format] || 'webp';
};

const getFormatOptions = (format, quality = 75) => {
    const qualityNum = parseInt(quality);

    switch (format) {
        case 'jpeg':
        case 'jpg':
            return {
                format: 'jpeg',
                options: { quality: qualityNum, progressive: true, mozjpeg: true }
            };
        case 'png':
            return {
                format: 'png',
                options: { quality: qualityNum, compressionLevel: 9, progressive: true }
            };
        case 'webp':
            return {
                format: 'webp',
                options: { quality: qualityNum, effort: 6 }
            };
        case 'avif':
            return {
                format: 'avif',
                options: { quality: qualityNum, effort: 9 }
            };
        case 'gif':
            return {
                format: 'gif',
                options: {}
            };
        case 'bmp':
            return {
                format: 'bmp',
                options: {}
            };
        case 'tiff':
            return {
                format: 'tiff',
                options: { quality: qualityNum, compression: 'lzw' }
            };
        default:
            return {
                format: 'webp',
                options: { quality: qualityNum, effort: 6 }
            };
    }
};

const extractMetadata = async (imagePath) => {
    try {
        const metadata = await sharp(imagePath).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: metadata.size,
            density: metadata.density,
            hasAlpha: metadata.hasAlpha,
            orientation: metadata.orientation,
            exif: metadata.exif ? true : false
        };
    } catch (error) {
        console.error('Error extracting metadata:', error);
        return null;
    }
};

// ---------- Routes ----------

// Health check
app.get("/", (req, res) => res.send("Image Optimizer Pro running! 🚀"));

// Get image processing capabilities
app.get("/capabilities", (req, res) => {
    res.json({
        supportedFormats: ['jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff'],
        maxFileSize: '50MB',
        maxFiles: 10,
        features: [
            'batch_processing',
            'format_conversion',
            'quality_adjustment',
            'resize_presets',
            'metadata_extraction',
            'progressive_encoding'
        ]
    });
});

// Upload & optimize image(s)
app.post("/optimize", upload.single("image"), async (req, res) => {
    const startTime = Date.now();

    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Get optimization parameters
        const {
            format = 'webp',
            quality = 75,
            width,
            height,
            preserveMetadata = false,
            progressive = true,
            watermark = false,
            watermarkText = '',
            watermarkPosition = 'bottom-right',
            smartCrop = false,
            cropFocus = 'center'
        } = req.body;

        // Extract original metadata
        const originalMetadata = await extractMetadata(file.path);
        const originalStats = fs.statSync(file.path);

        // Generate optimized filename
        const ext = getFileExtension(format);
        const optimizedFile = `${Date.now()}-optimized.${ext}`;
        const outPath = path.join(optimizedDir, optimizedFile);

        // Create Sharp pipeline
        let pipeline = sharp(file.path);

        // Apply smart cropping if enabled
        if (smartCrop && width && height) {
            const resizeWidth = parseInt(width);
            const resizeHeight = parseInt(height);

            pipeline = pipeline.resize({
                width: resizeWidth,
                height: resizeHeight,
                fit: 'cover',
                position: cropFocus
            });
        } else if (width || height) {
            // Standard resizing
            const resizeOptions = {};
            if (width && width !== 'auto') resizeOptions.width = parseInt(width);
            if (height && height !== 'auto') resizeOptions.height = parseInt(height);

            pipeline = pipeline.resize({
                ...resizeOptions,
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Apply watermark if enabled
        if (watermark && watermarkText) {
            const watermarkSvg = createWatermarkSvg(watermarkText, watermarkPosition, originalMetadata);
            pipeline = pipeline.composite([{
                input: Buffer.from(watermarkSvg),
                gravity: getWatermarkGravity(watermarkPosition),
                blend: 'over'
            }]);
        }

        // Apply format-specific options
        const { format: outputFormat, options: formatOptions } = getFormatOptions(format, quality);

        // Handle metadata preservation
        if (!preserveMetadata) {
            pipeline = pipeline.withMetadata({
                exif: {},
                icc: 'srgb'
            });
        }

        // Apply format and save
        pipeline = pipeline[outputFormat](formatOptions);
        await pipeline.toFile(outPath);

        // Get optimized file stats
        const optimizedStats = fs.statSync(outPath);
        const optimizedMetadata = await extractMetadata(outPath);

        // Calculate compression metrics
        const compressionRatio = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(2);
        const processingTime = Date.now() - startTime;

        // Save to database
        try {
            await pool.query(
                `INSERT INTO images 
         (original_name, optimized_path, original_size, optimized_size, 
          compression_ratio, format, quality, width, height, processing_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    file.originalname,
                    optimizedFile,
                    originalStats.size,
                    optimizedStats.size,
                    parseFloat(compressionRatio),
                    format,
                    quality,
                    optimizedMetadata?.width || null,
                    optimizedMetadata?.height || null,
                    processingTime
                ]
            );
        } catch (dbError) {
            console.error("Database save failed:", dbError);
            // Continue even if DB save fails
        }

        const response = {
            message: "Image optimized successfully",
            optimizedFile: `http://localhost:${port}/optimized/${optimizedFile}`,
            original: {
                name: file.originalname,
                size: originalStats.size,
                metadata: originalMetadata
            },
            optimized: {
                size: optimizedStats.size,
                size_kb: (optimizedStats.size / 1024).toFixed(2),
                metadata: optimizedMetadata
            },
            compression_ratio: parseFloat(compressionRatio),
            processing_time: processingTime,
            settings: {
                format,
                quality: parseInt(quality),
                width: width || 'auto',
                height: height || 'auto',
                preserveMetadata,
                watermark,
                smartCrop
            }
        };

        console.log("Optimization completed:", response);
        return res.status(200).json(response);

    } catch (err) {
        console.error("Error in /optimize:", err);
        return res.status(500).json({
            error: "Optimization failed",
            details: err.message
        });
    }
});

// Helper function to create watermark SVG
const createWatermarkSvg = (text, position, metadata) => {
    const fontSize = Math.max(Math.min(metadata.width / 20, 48), 16);
    const padding = fontSize;

    return `
    <svg width="${metadata.width}" height="${metadata.height}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.8)"/>
        </filter>
      </defs>
      <text 
        x="${getWatermarkX(position, metadata.width, padding)}" 
        y="${getWatermarkY(position, metadata.height, padding)}" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold"
        fill="white" 
        opacity="0.8"
        filter="url(#shadow)"
        text-anchor="${getTextAnchor(position)}"
      >${text}</text>
    </svg>
  `;
};

// Helper functions for watermark positioning
const getWatermarkX = (position, width, padding) => {
    if (position.includes('left')) return padding;
    if (position.includes('right')) return width - padding;
    return width / 2; // center
};

const getWatermarkY = (position, height, padding) => {
    if (position.includes('top')) return padding + 20;
    if (position.includes('bottom')) return height - padding;
    return height / 2; // center
};

const getTextAnchor = (position) => {
    if (position.includes('left')) return 'start';
    if (position.includes('right')) return 'end';
    return 'middle'; // center
};

const getWatermarkGravity = (position) => {
    const gravityMap = {
        'top-left': 'northwest',
        'top-center': 'north',
        'top-right': 'northeast',
        'center-left': 'west',
        'center': 'center',
        'center-right': 'east',
        'bottom-left': 'southwest',
        'bottom-center': 'south',
        'bottom-right': 'southeast'
    };
    return gravityMap[position] || 'southeast';
};

// Batch optimization endpoint
app.post("/optimize-batch", upload.array("images", 10), async (req, res) => {
    const startTime = Date.now();

    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const results = [];
        const {
            format = 'webp',
            quality = 75,
            width,
            height,
            preserveMetadata = false
        } = req.body;

        for (const file of files) {
            try {
                // Process each file individually
                const fileStartTime = Date.now();

                // Extract original metadata
                const originalMetadata = await extractMetadata(file.path);
                const originalStats = fs.statSync(file.path);

                // Generate optimized filename
                const ext = getFileExtension(format);
                const optimizedFile = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-optimized.${ext}`;
                const outPath = path.join(optimizedDir, optimizedFile);

                // Create Sharp pipeline
                let pipeline = sharp(file.path);

                // Apply resizing if specified
                if (width || height) {
                    const resizeOptions = {};
                    if (width && width !== 'auto') resizeOptions.width = parseInt(width);
                    if (height && height !== 'auto') resizeOptions.height = parseInt(height);

                    pipeline = pipeline.resize({
                        ...resizeOptions,
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                }

                // Apply format-specific options
                const { format: outputFormat, options: formatOptions } = getFormatOptions(format, quality);

                // Handle metadata preservation
                if (!preserveMetadata) {
                    pipeline = pipeline.withMetadata({
                        exif: {},
                        icc: 'srgb'
                    });
                }

                // Apply format and save
                pipeline = pipeline[outputFormat](formatOptions);
                await pipeline.toFile(outPath);

                // Get optimized file stats
                const optimizedStats = fs.statSync(outPath);
                const optimizedMetadata = await extractMetadata(outPath);

                // Calculate compression metrics
                const compressionRatio = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(2);
                const processingTime = Date.now() - fileStartTime;

                const result = {
                    original_name: file.originalname,
                    optimized_file: `http://localhost:${port}/optimized/${optimizedFile}`,
                    original_size: originalStats.size,
                    optimized_size: optimizedStats.size,
                    size_kb: (optimizedStats.size / 1024).toFixed(2),
                    compression_ratio: parseFloat(compressionRatio),
                    processing_time: processingTime,
                    status: 'success'
                };

                results.push(result);

            } catch (fileError) {
                console.error(`Error processing ${file.originalname}:`, fileError);
                results.push({
                    original_name: file.originalname,
                    status: 'error',
                    error: fileError.message
                });
            }
        }

        const totalProcessingTime = Date.now() - startTime;
        const successfulResults = results.filter(r => r.status === 'success');
        const totalOriginalSize = successfulResults.reduce((sum, r) => sum + r.original_size, 0);
        const totalOptimizedSize = successfulResults.reduce((sum, r) => sum + r.optimized_size, 0);
        const overallCompressionRatio = totalOriginalSize > 0
            ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(2)
            : 0;

        const response = {
            message: `Batch optimization completed`,
            total_files: files.length,
            successful: successfulResults.length,
            failed: results.filter(r => r.status === 'error').length,
            overall_compression_ratio: parseFloat(overallCompressionRatio),
            total_processing_time: totalProcessingTime,
            results
        };

        console.log("Batch optimization completed:", response);
        return res.status(200).json(response);

    } catch (err) {
        console.error("Error in /optimize-batch:", err);
        return res.status(500).json({
            error: "Batch optimization failed",
            details: err.message
        });
    }
});

// List all optimized images with pagination
app.get("/images", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await pool.query("SELECT COUNT(*) FROM images");
        const total = parseInt(countResult.rows[0].count);

        const { rows } = await pool.query(
            `SELECT * FROM images 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            images: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error("Error in /images:", err);
        res.status(500).json({ error: "Could not fetch images" });
    }
});

// Get optimization statistics
app.get("/stats", async (req, res) => {
    try {
        const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_images,
        SUM(original_size) as total_original_size,
        SUM(optimized_size) as total_optimized_size,
        AVG(compression_ratio) as avg_compression_ratio,
        AVG(processing_time) as avg_processing_time,
        COUNT(DISTINCT format) as formats_used
      FROM images
    `);

        const formatStats = await pool.query(`
      SELECT format, COUNT(*) as count, AVG(compression_ratio) as avg_compression
      FROM images 
      GROUP BY format 
      ORDER BY count DESC
    `);

        const response = {
            overall: stats.rows[0],
            by_format: formatStats.rows,
            total_savings_bytes: stats.rows[0].total_original_size - stats.rows[0].total_optimized_size
        };

        res.json(response);
    } catch (err) {
        console.error("Error in /stats:", err);
        res.status(500).json({ error: "Could not fetch statistics" });
    }
});

// ---------- Static serving ----------
app.use("/optimized", express.static(optimizedDir));

// ---------- Error handling ----------
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
        }
    }

    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// ---------- Start server ----------
app.listen(port, () =>
    console.log(`✅ Image Optimizer Pro running on http://localhost:${port}`)
);
// ---------- End of file ----------