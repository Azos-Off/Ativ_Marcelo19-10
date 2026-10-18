export function autorizar(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario.role)) {
      return res.status(403).json({ erro: "Acesso negado para o seu perfil" });
    }
    next();
  };
}