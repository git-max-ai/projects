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
const upload = multer({ storage });

// ---------- Routes ----------

// Health check
app.get("/", (req, res) => res.send("Image Optimizer running!"));

// Upload & optimize image
app.post("/optimize", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const optimizedFile = `${Date.now()}-optimized.webp`;
    const outPath = path.join(optimizedDir, optimizedFile);

    // Compress & resize
    await sharp(file.path)
      .resize({ width: 800 })
      .webp({ quality: 75 })
      .toFile(outPath);

    const stats = fs.statSync(outPath);
    const sizeKb = (stats.size / 1024).toFixed(2);

    // Save metadata in DB
    await pool.query(
      `INSERT INTO images 
       (original_name, optimized_path, width, height, size_kb) 
       VALUES ($1,$2,$3,$4,$5)`,
      [file.originalname, optimizedFile, 800, null, sizeKb]
    );

    const payload = {
      message: "Image optimized successfully",
      optimizedFile: `http://localhost:${port}/optimized/${optimizedFile}`,
      size_kb: sizeKb,
    };

    console.log("Sending response:", payload);
    return res.status(200).json(payload);
  } catch (err) {
    console.error("Error in /optimize:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// List all optimized images
app.get("/images", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM images ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error in /images:", err);
    res.status(500).json({ error: "Could not fetch images" });
  }
});

// ---------- Static serving ----------
app.use("/optimized", express.static(optimizedDir));

// ---------- Start server ----------
app.listen(port, () =>
  console.log(`✅ Server running on http://localhost:${port}`)
);
// ---------- End of file ----------