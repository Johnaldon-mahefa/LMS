import { withTransaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const checkFeature = (codeFonctionnalite) => {
  return async (req, _res, next) => {
    try {
      const idEtablissement = req.user?.id_etablissement;

      if (!idEtablissement) {
        return next(new AppError(403, "Aucun établissement actif trouvé pour cet utilisateur."));
      }

      const aAcces = await withTransaction(async (client) => {
        const query = `
          SELECT 1 
          FROM etablissement e
          JOIN plan_fonctionnalite pf ON e.id_plan = pf.id_plan
          JOIN fonctionnalite f ON pf.id_fonctionnalite = f.id_fonctionnalite
          WHERE e.id_etablissement = $1 AND f.code_unique = $2
        `;
        const result = await client.query(query, [idEtablissement, codeFonctionnalite]);
        return result.rowCount > 0;
      });

      if (!aAcces) {
        return next(new AppError(403, "Votre plan d'abonnement actuel ne permet pas d'accéder à cette fonctionnalité. Veuillez mettre à niveau."));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};