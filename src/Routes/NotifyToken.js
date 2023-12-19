import express from "express";
import {
  createNotifyToken,
  getAllToken,
  getOneToken,
} from "../Controllers/NotifyToken.js";

const router = express.Router();
router.get("/notifyTokens", getAllToken);
router.get("/notifyTokens/:token", getOneToken);
router.post("/notifyTokens", createNotifyToken);
export default router;
