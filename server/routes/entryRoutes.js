import express from "express";
import { addEntry, getEntries } from "../controllers/entryController.js";

const router = express.Router();

router.get("/", getEntries);
router.post("/add-entry", addEntry);

export default router;
