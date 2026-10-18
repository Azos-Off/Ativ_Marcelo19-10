import { Router } from "express";
import { listar, alterarRole } from "../controllers/userController.js";
import { autenticar } from "../middlewares/autenticar.js";
import { autorizar } from "../middlewares/autorizar.js";

const router = Router();
// ordem importa: primeiro autenticar (cria req.usuario), depois autorizar (usa req.usuario)
router.use(autenticar, autorizar("ADMIN"));

router.get("/", listar);
router.patch("/:id/role", alterarRole);

export default router;