import { Router } from "express";
import { summary, managerPerformance } from "../controllers/dashboardController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/summary", summary);
router.get("/managers", requireRole("ADMIN"), managerPerformance);

export default router;
