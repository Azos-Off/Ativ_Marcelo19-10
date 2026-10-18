import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export async function register(req, res) {
  const { nome, email, password } = req.body;

  if (!nome || !email || !password) {
    return res.status(400).json({ erro: "nome, email e password são obrigatórios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    // role NÃO vem do body: todo cadastro público nasce USER (padrão do schema)
    const user = await prisma.user.create({
      data: { nome, email, password: hash },
    });
    return res.status(201).json(user);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ erro: "E-mail já cadastrado" });
    }
    throw err;
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ erro: "email e password são obrigatórios" });
  }

  // omit: { password: false } traz a senha só aqui, para comparar o hash
  const user = await prisma.user.findUnique({
    where: { email },
    omit: { password: false },
  });

  const senhaOk = user && (await bcrypt.compare(password, user.password));
  if (!senhaOk) {
    // mesma mensagem para e-mail inexistente e senha errada
    return res.status(401).json({ erro: "Credenciais inválidas" });
  }

  const token = jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.json({ token });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.usuario.id } });
  res.json(user);
}   