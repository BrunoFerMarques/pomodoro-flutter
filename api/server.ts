import './env.js';

import { app } from './app.js';
import { migrate } from './db.js';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Copie .env.example para .env e preencha.');
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3000);

await migrate();

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
