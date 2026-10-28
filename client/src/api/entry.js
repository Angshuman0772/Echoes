import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

export const getEntries = async () => {
  const response = await api.get("/entries");
  return response.data;
};

export const createEntry = async (entryData) => {
  const response = await api.post("/entries/add-entry", entryData);
  return response.data;
};
