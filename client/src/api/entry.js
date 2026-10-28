import axios from "axios";

export const createEntry = async (entryData) => {
  try {
    const response = await axios.post("/api/entries/add-entry", entryData);
    return response.data;
  } catch (error) {
    console.error("Error creating entry:", error);
    throw error;
  }
};
