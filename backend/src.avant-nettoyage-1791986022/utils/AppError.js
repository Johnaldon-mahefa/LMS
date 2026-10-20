// Erreur métier avec un code HTTP : lancée par les services, transformée en réponse par le gestionnaire d'erreurs.
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
