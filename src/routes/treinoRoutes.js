import { Router } from "express";
import { listar, criar, atualizar, remover } from "../controllers/treinoController.js";
import { autenticar } from "../middlewares/autenticar.js";

const router = Router();
router.use(autenticar); // todas as rotas de treino exigem login

router.get("/", listar);
router.post("/", criar);
router.put("/:id", atualizar);
router.delete("/:id", remover);

export default router;