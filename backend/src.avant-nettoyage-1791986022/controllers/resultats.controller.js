// Cas d'utilisation « Consulter ses résultats et son attestation ».
import { ok, cree, id } from "../utils/http.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as Service from "../services/resultats.service.js";

export const resultats = ok((req) => Service.resultatsApprenant(id(req), req.user.id));
export const attestation = cree((req) => Service.delivrerAttestation(id(req), req.user.id));
export const attestationPdf = asyncHandler(async (req, res) => {
  const { pdf, nom } = await Service.attestationPdf(id(req), req.user.id);
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nom}"` }).send(pdf);
});
