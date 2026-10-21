// RG15 : chaque fonctionnalité est réservée aux rôles autorisés.
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function authenticate(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new AppError(401, "Authentification requise."));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    // On récupère l'id_etablissement depuis le token
    req.user = { 
      id: Number(payload.sub), 
      roles: payload.roles,
      id_etablissement: payload.id_etablissement // <-- NOUVEAU
    };
    next();
  } catch {
    next(new AppError(401, "Session expirée ou invalide."));
  }
}

export const requireRole = (...rolesAutorises) => (req, _res, next) => {
  const autorise = req.user?.roles?.some((r) => rolesAutorises.includes(r));
  if (!autorise) return next(new AppError(403, "Accès refusé pour votre rôle."));
  next();
};