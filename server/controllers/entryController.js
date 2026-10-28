import userEntries from "../models/userEntries.js";

export const getEntries = async (_req, res) => {
  try {
    const entries = await userEntries.find().sort({ _id: -1 });
    res.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ message: "Unable to fetch entries" });
  }
};

export const addEntry = async (req, res) => {
  try {
    const { song, artist = "", mood, note = "" } = req.body;

    if (!song || !mood) {
      return res.status(400).json({
        message: "song and mood are required",
      });
    }

    const newEntry = new userEntries({
      id: Date.now(),
      song,
      artist,
      mood,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      }),
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
