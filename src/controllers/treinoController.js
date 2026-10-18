import { prisma } from "../lib/prisma.js";

export async function listar(req, res) {
  const where = req.usuario.role === "ADMIN" ? {} : { alunoId: req.usuario.id };
  const treinos = await prisma.treino.findMany({ where });
  res.json(treinos);
}

export async function criar(req, res) {
  const { titulo, objetivo, diaSemana, exercicios } = req.body;
  if (!titulo || !objetivo || !diaSemana || !exercicios) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
  }
  // o dono vem do TOKEN; qualquer alunoId enviado no body é ignorado
  const treino = await prisma.treino.create({
    data: { titulo, objetivo, diaSemana, exercicios, alunoId: req.usuario.id },
  });
  res.status(201).json(treino);
}

// busca o treino e confere: 404 primeiro, depois 403 (dono ou ADMIN)
async function buscarComPermissao(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" });
    return null;
  }
  const treino = await prisma.treino.findUnique({ where: { id } });
  if (!treino) {
    res.status(404).json({ erro: "Treino não encontrado" });
    return null;
  }
  const ehDono = treino.alunoId === req.usuario.id;
  if (!ehDono && req.usuario.role !== "ADMIN") {
    res.status(403).json({ erro: "Você só pode alterar os seus treinos" });
    return null;
  }
  return treino;
}

export async function atualizar(req, res) {
  const treino = await buscarComPermissao(req, res);
  if (!treino) return;

  const { titulo, objetivo, diaSemana, exercicios, status } = req.body;
  const atualizado = await prisma.treino.update({
    where: { id: treino.id },
    data: { titulo, objetivo, diaSemana, exercicios, status },
  });
  res.json(atualizado);
}

export async function remover(req, res) {
  const treino = await buscarComPermissao(req, res);
  if (!treino) return;

  await prisma.treino.delete({ where: { id: treino.id } });
  res.status(204).send();
}