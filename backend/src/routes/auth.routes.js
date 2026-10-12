import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import * as AuthController from "../controllers/auth.controller.js";

const router = Router();
router.post("/login", AuthController.login);
router.get("/moi", authenticate, AuthController.moi);
export default router;
