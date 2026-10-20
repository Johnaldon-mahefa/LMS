import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => console.log(`API LMS démarrée sur http://localhost:${env.port}/api`));
