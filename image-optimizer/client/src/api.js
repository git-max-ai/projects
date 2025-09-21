import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000", // backend URL
});

export const optimizeImage = (formData) =>
  API.post("/optimize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
