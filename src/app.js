import express from "express";
import authRoutes from "./routes/authRoutes.js";
import treinoRoutes from "./routes/treinoRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ mensagem: "API Academia no ar" });
});

app.use("/auth", authRoutes);
app.use("/treinos", treinoRoutes);
app.use("/users", userRoutes);

export default app;