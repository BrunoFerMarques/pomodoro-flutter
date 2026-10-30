import { existsSync } from 'node:fs';

// Local: lê o .env. No Render as variáveis vêm do painel (Environment).
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}
