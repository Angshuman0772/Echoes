import userEntries from "../models/userEntries.js";

export const addEntry = async (req, res) => {
  try {
    const { id, song, artist, mood, date, note } = req.body;

    if (!song || !artist || !mood || !date || !note) {
      return res.status(400).json({
        message: "song, artist, mood, date, and note are required",
      });
    }

    const newEntry = new userEntries({
      id,
      song,
      artist,
      mood,
      date,
      note,
    });
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Error adding entry:", error);
    res.status(500).json({ message: "Unable to add entry" });
  }
};
