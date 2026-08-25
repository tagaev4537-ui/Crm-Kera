import { Router } from "express";
import { getRate, getRateHistory, setRate } from "../controllers/exchangeRateController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getRate);
router.get("/history", requireAuth, getRateHistory);
router.post("/", requireAuth, requireRole("ADMIN"), setRate);

export default router;
