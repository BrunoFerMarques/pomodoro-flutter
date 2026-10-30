import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';

import { signup } from './user/signup.js';

// Ex.: CORS_ORIGIN=https://brunofermarques.github.io,https://outro.site
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// flutter run -d chrome sobe em porta aleatória
const LOCALHOST_REGEX = /^http:\/\/localhost:\d+$/;

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Sem origin = curl, Postman, chamada servidor-servidor
      const allowed = !origin || allowedOrigins.includes(origin) || LOCALHOST_REGEX.test(origin);
      callback(null, allowed);
    },
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/users', signup);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Erro interno' });
};

app.use(errorHandler);
