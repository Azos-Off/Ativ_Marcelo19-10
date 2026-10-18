-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER'
);

-- CreateTable
CREATE TABLE "Treino" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "diaSemana" TEXT NOT NULL,
    "exercicios" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "alunoId" INTEGER NOT NULL,
    CONSTRAINT "Treino_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
