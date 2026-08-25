import { Router } from "express";
import { listUsers, updateUser, resetUserPassword } from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", listUsers);
router.patch("/:id", updateUser);
router.post("/:id/reset-password", resetUserPassword);

export default router;
