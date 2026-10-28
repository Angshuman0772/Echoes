import express from "express";
import { addEntry } from "../controllers/entryController.js";

const router = express.Router();

router.post("/add-entry", addEntry);

export default router;
