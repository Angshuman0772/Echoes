import mongoose from "mongoose";

const entrySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  song: { type: String, required: true },
  artist: { type: String, default: "" },
  mood: {
    type: String,
    required: true,
    enum: ["joyful", "melancholic", "romantic", "peaceful", "excited"],
  },
  date: { type: String, required: true },
  note: { type: String, required: true, default: "" },
});

const userEntries = mongoose.model("Entry", entrySchema);
export default userEntries;
