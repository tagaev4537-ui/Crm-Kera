import { Router } from "express";
import {
  listDeals,
  pipeline,
  getDeal,
  createDeal,
  updateDeal,
  changeStage,
  deleteDeal,
} from "../controllers/dealController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listDeals);
router.get("/pipeline", pipeline);
router.get("/:id", getDeal);
router.post("/", createDeal);
router.patch("/:id", updateDeal);
router.post("/:id/stage", changeStage);
router.delete("/:id", deleteDeal);

export default router;
