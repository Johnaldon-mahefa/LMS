import { AppError } from "../utils/AppError.js";

export const notFound = (_req, _res, next) => next(new AppError(404, "Ressource introuvable."));

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: "Erreur interne du serveur." });
}
