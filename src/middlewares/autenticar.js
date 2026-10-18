import jwt from "jsonwebtoken";

export function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  const [tipo, token] = header.split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Formato inválido. Use: Bearer <token>" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}