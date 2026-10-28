import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import entryRoutes from "./routes/entryRoutes.js";
import connectDB from "./config/mongoDB.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

await connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("API is running");
});

// Routes
app.use("/api/entries", entryRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
