import { Router } from "express";
import { listComments, createComment, deleteComment } from "../controllers/commentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listComments);
router.post("/", createComment);
router.delete("/:id", deleteComment);

export default router;
