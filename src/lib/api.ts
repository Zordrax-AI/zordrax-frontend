import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
});

export const fetchAIFLow = async () => {
  const res = await api.get("/mock/ai_flow");
  return res.data;
};

export const fetchManualFlow = async () => {
  const res = await api.get("/mock/manual_flow");
  return res.data;
};
