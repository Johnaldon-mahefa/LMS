import { ok } from "../utils/http.js";
import * as Service from "../services/statistiques.service.js";

export const globales = ok(() => Service.globales());
