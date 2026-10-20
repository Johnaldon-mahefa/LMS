// Petites fonctions qui évitent de répéter le même code dans les contrôleurs.
import { asyncHandler } from "./asyncHandler.js";

export const ok = (fn) => asyncHandler(async (req, res) => res.json(await fn(req)));
export const cree = (fn) => asyncHandler(async (req, res) => res.status(201).json(await fn(req)));
export const sansContenu = (fn) => asyncHandler(async (req, res) => { await fn(req); res.status(204).end(); });
export const id = (req, nom = "id") => Number(req.params[nom]);
