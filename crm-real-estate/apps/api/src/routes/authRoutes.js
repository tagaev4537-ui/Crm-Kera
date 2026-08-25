import { Router } from "express";
import { body } from "express-validator";
import {
  login,
  refresh,
  logout,
  me,
  changePassword,
  createUser,
} from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/login", loginRateLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

router.post(
  "/change-password",
  requireAuth,
  [
    body("currentPassword").notEmpty().withMessage("Укажите текущий пароль"),
    body("newPassword").notEmpty().withMessage("Укажите новый пароль"),
  ],
  validate,
  changePassword
);

// Только админ может создавать новых пользователей (менеджеров)
router.post("/users", requireAuth, requireRole("ADMIN"), createUser);

export default router;
