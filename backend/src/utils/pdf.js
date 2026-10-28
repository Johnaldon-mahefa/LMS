// Génération du document PDF de l'attestation (RG14).
import PDFDocument from "pdfkit";
import QRCode from "qrcode"; // <-- NOUVEL IMPORT

// La fonction est maintenant ASYNC pour pouvoir générer le QR Code
export async function genererAttestationPdf({ numero, dateDelivrance, apprenant, formation, dateDebut, dateFin, qrCodeUrl }) {
  return new Promise(async (resolve, reject) => {
    try {
      // Format paysage (A4)
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // 1. FOND ET BORDURES
      // Fond légèrement crème pour faire "papier officiel"
      doc.rect(0, 0, pageWidth, pageHeight).fill("#fcfbf9");

      // Bordure extérieure épaisse (Bleu foncé)
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(6).stroke("#1e293b");
      
      // Bordure intérieure fine (Dorée / Or)
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60).lineWidth(2).stroke("#d4af37");

      // 2. EN-TÊTE
      doc.moveDown(2);
      
      doc.font("Helvetica-Bold").fontSize(36).fillColor("#1e293b")
         .text("ATTESTATION DE FIN DE FORMATION", { align: "center" });
      
      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(14).fillColor("#64748b")
         .text("Ce document atteste que", { align: "center" });

      doc.moveDown(1);

      // 3. NOM DE L'APPRENANT
      doc.font("Helvetica-Bold").fontSize(40).fillColor("#0d6efd")
         .text(apprenant.toUpperCase(), { align: "center" });

      doc.moveDown(1);

      // 4. FORMATION
      doc.font("Helvetica").fontSize(16).fillColor("#1e293b")
         .text("a suivi et validé avec succès la formation :", { align: "center" });

      doc.moveDown(0.5);

      doc.font("Helvetica-Bold").fontSize(24).fillColor("#1e293b")
         .text(formation, { align: "center" });

      doc.moveDown(1.5);

      // 5. DATES
      const dateDebutStr = new Date(dateDebut).toLocaleDateString('fr-FR');
      const dateFinStr = new Date(dateFin).toLocaleDateString('fr-FR');
      
      doc.font("Helvetica").fontSize(14).fillColor("#64748b")
         .text(`Du ${dateDebutStr} au ${dateFinStr}`, { align: "center" });

      doc.moveDown(3);

      // 6. PIED DE PAGE (Numéro, signature et QR CODE)
      const bottomY = pageHeight - 120;

      // --- AJOUT DU QR CODE ---
      if (qrCodeUrl) {
        // Génère l'image du QR Code
        const qrBuffer = await QRCode.toBuffer(qrCodeUrl, { width: 150, margin: 1 });
        
        // On place le QR Code en bas à gauche, au-dessus du numéro d'attestation
        // X = 60 (marge gauche), Y = bottomY - 100 (pour remonter un peu)
        doc.image(qrBuffer, 60, bottomY - 100, { width: 80 });
        
        // Petit texte sous le QR Code
        doc.font("Helvetica").fontSize(8).fillColor("#94a3b8")
           .text("Scannez pour vérifier", 50, bottomY - 15, { width: 100, align: "center" });
      }
      // -------------------------

      // Numéro à gauche (sous le QR code)
      doc.font("Helvetica").fontSize(11).fillColor("#94a3b8")
         .text(`N° d'attestation : ${numero}`, 60, bottomY + 10);
      
      doc.font("Helvetica").fontSize(11).fillColor("#94a3b8")
         .text(`Délivrée le : ${new Date(dateDelivrance).toLocaleDateString('fr-FR')}`, 60, bottomY + 25);

      // Signature à droite
      doc.font("Helvetica").fontSize(12).fillColor("#1e293b")
         .text("Le Responsable Pédagogique", pageWidth - 250, bottomY, { width: 200, align: "center" });
      
      // Ligne de signature
      doc.moveTo(pageWidth - 220, bottomY + 40)
         .lineTo(pageWidth - 80, bottomY + 40)
         .lineWidth(1)
         .stroke("#94a3b8");

      // 7. MENTION LEGALE
      doc.font("Helvetica-Oblique").fontSize(9).fillColor("#94a3b8")
         .text("Ce document est généré électroniquement. Toute modification ou falsification est strictement interdite.", 0, pageHeight - 40, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}