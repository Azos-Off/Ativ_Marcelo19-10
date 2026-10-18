import { prisma } from "../lib/prisma.js";

export async function listar(req, res) {
  const users = await prisma.user.findMany();
  res.json(users);
}

export async function alterarRole(req, res) {
  const id = Number(req.params.id);
  const { role } = req.body;

  if (!["USER", "ADMIN"].includes(role)) {
    return res.status(400).json({ erro: "role deve ser USER ou ADMIN" });
  }
  const existente = await prisma.user.findUnique({ where: { id } });
  if (!existente) return res.status(404).json({ erro: "Usuário não encontrado" });

  const user = await prisma.user.update({ where: { id }, data: { role } });
  res.json(user);
}