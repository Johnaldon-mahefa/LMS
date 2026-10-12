// Génération du document PDF de l'attestation (RG14).
import PDFDocument from "pdfkit";

export function genererAttestationPdf({ numero, dateDelivrance, apprenant, formation, dateDebut, dateFin }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 70 });
    const morceaux = [];
    doc.on("data", (m) => morceaux.push(m));
    doc.on("end", () => resolve(Buffer.concat(morceaux)));
    doc.on("error", reject);

    doc.fontSize(14).text("Innov-T Learning Hub", { align: "center" });
    doc.moveDown(3).fontSize(26).text("ATTESTATION DE FORMATION", { align: "center" });
    doc.moveDown(2).fontSize(12).text(`Numéro : ${numero}`, { align: "center" });
    doc.moveDown(3).fontSize(13).text(
      `Il est attesté que ${apprenant} a suivi avec succès la formation « ${formation} », du ${dateDebut} au ${dateFin}, ` +
      "et a validé l'ensemble des modules de cette formation.", { align: "justify", lineGap: 6 });
    doc.moveDown(4).fontSize(12).text(`Délivrée le ${dateDelivrance}`, { align: "right" });
    doc.end();
  });
}
