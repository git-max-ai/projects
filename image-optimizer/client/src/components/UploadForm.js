// client/src/components/UploadForm.js
import React, { useState } from "react";
import { optimizeImage } from "../api";

function UploadForm() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null); // clear previous result
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);
      const { data } = await optimizeImage(formData);
      console.log("Server response:", data);
      setResult(data);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed! Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h2>Image Optimizer</h2>

      {/* File selector */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ marginBottom: 12 }}
      />

      {/* Preview of selected file */}
      {preview && (
        <div style={{ marginBottom: 12 }}>
          <strong>Preview:</strong>
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: "100%", marginTop: 6 }}
          />
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          padding: "8px 14px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Optimizing..." : "Optimize Image"}
      </button>

      {/* Result section */}
      {result && (
        <div style={{ marginTop: 20 }}>
          <h4>{result.message}</h4>
          <p>Size: {result.size_kb} KB</p>
          <img
            src={result.optimizedFile}   // absolute URL from backend
            alt="Optimized"
            style={{
              maxWidth: "100%",
              marginTop: 8,
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default UploadForm;
// ---------- End of file ----------