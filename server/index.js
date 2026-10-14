// Start serwera. Cała aplikacja jest w app.js, żeby testy mogły ją uruchomić na dowolnym porcie.
import { app, PROVIDER } from "./app.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // na serwerze: HOST=127.0.0.1, żeby aplikacja była widoczna tylko przez Caddy
app.listen(PORT, HOST, () => console.log(`Demo działa: http://localhost:${PORT}  (dostawca AI: ${PROVIDER}, nasłuch: ${HOST})`));
