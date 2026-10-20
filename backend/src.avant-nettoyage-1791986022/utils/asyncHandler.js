// Évite d'écrire try/catch dans chaque contrôleur : toute erreur est transmise au gestionnaire d'erreurs.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
