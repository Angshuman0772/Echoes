import mongoose from "mongoose";

const entrySchema = new mongoose.Schema({
  id: { type: Number, required: true },
  song: { type: String, required: true },
  artist: { type: String, required: true },
  mood: { type: String, required: true },
  date: { type: String, required: true },
  note: { type: String, required: true },
});

const userEntries = mongoose.model("Entry", entrySchema);
export default userEntries;
