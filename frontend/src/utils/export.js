import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ============================================================
   EXPORT CSV
   columns = [{ cle: "nom", titre: "Nom" }, ...]
   ============================================================ */
export function exporterCSV(donnees, columns, nomFichier = "export") {
  if (!donnees || donnees.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const entetes = columns.map((c) => `"${c.titre}"`).join(";");
  const lignes = donnees.map((item) =>
    columns
      .map((c) => {
        const valeur = item[c.cle];
        if (valeur === null || valeur === undefined) return "";
        const texte = String(valeur).replace(/"/g, '""');
        return `"${texte}"`;
      })
      .join(";")
  );

  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  const csv = "\uFEFF" + [entetes, ...lignes].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `${nomFichier}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

/* ============================================================
   EXPORT PDF (tableau professionnel)
   ============================================================ */
export function exporterPDF(donnees, columns, nomFichier = "export", titre = "Export") {
  if (!donnees || donnees.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // En-tête avec bandeau violet
  doc.setFillColor(76, 29, 149);
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Innov-T Learning Hub", 14, 10);
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(titre, 14, 16);

  // Date à droite
  doc.setFontSize(9);
  doc.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
    283, 12, { align: "right" }
  );

  // Tableau
  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.titre)],
    body: donnees.map((item) =>
      columns.map((c) => {
        const v = item[c.cle];
        return v === null || v === undefined ? "" : String(v);
      })
    ),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      lineColor: [231, 227, 244],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [109, 40, 217],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 243, 255],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber} / ${pageCount}`,
        283, 200, { align: "right" }
      );
    },
  });

  doc.save(`${nomFichier}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
