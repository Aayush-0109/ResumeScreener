import { Router } from "express";
import { getProfile, loginUser, logout, refreshAccessToken, registerUser } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../middleware/validation.middleware.js";
import { idParams, loginBody, refreshBody, registerBody } from "../types/zod/auth.schema.js";
import { moderateLimit, strictLimit } from "../middleware/ratelimit.middleware.js";

const router = Router();

router.post('/register', strictLimit ,validateBody(registerBody), registerUser);
router.post('/login', strictLimit,validateBody(loginBody), loginUser);
router.post('/refresh', strictLimit, refreshAccessToken);


// Protected routes
router.post('/logout', authMiddleware, logout);
router.get('/profile',authMiddleware, moderateLimit,getProfile);

export default router;