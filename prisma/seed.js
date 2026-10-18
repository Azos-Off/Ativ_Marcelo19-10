import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("123456", 10);

  await prisma.treino.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: { nome: "Instrutor Admin", email: "admin@academia.com", password: hash, role: "ADMIN" },
  });
  const ana = await prisma.user.create({
    data: { nome: "Ana Souza", email: "ana@academia.com", password: hash },
  });
  const bruno = await prisma.user.create({
    data: { nome: "Bruno Lima", email: "bruno@academia.com", password: hash },
  });

  await prisma.treino.createMany({
    data: [
      { titulo: "Treino A - Peito e tríceps", objetivo: "Hipertrofia", diaSemana: "Segunda",
        exercicios: "Supino 4x10, Crucifixo 3x12, Tríceps corda 3x15", alunoId: ana.id },
      { titulo: "Treino B - Costas e bíceps", objetivo: "Hipertrofia", diaSemana: "Quarta",
        exercicios: "Puxada 4x10, Remada 3x12, Rosca direta 3x12", alunoId: ana.id },
      { titulo: "Treino Full Body", objetivo: "Emagrecimento", diaSemana: "Terça",
        exercicios: "Agachamento 3x15, Flexão 3x12, Prancha 3x40s", alunoId: bruno.id },
    ],
  });

  console.log("Seed concluído: 1 ADMIN, 2 USERs e 3 treinos (senha: 123456)");
}

main().finally(() => prisma.$disconnect());