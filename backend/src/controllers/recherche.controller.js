import { asyncHandler } from "../utils/asyncHandler.js";
import * as Service from "../services/recherche.service.js";

export const chercher = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (q.length < 2) return res.json({ formations: [], modules: [], evaluations: [], utilisateurs: [] });
  res.json(await Service.rechercher(q, req.user));
});