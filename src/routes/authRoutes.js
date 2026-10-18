import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import { autenticar } from "../middlewares/autenticar.js";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", autenticar, me);

export default router;