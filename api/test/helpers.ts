import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import type { Express } from 'express';

// Postgres em memória (PGlite) servido por TCP, para o driver pg real conectar nele.
// Cada arquivo de teste roda em processo próprio, então cada um ganha um banco limpo.
export async function startTestDatabase() {
  const db = await PGlite.create();
  const server = new PGLiteSocketServer({ db, port: 0, maxConnections: 10 });
  await server.start();

  return {
    url: `postgresql://postgres:postgres@${server.getServerConn()}/postgres`,
    async stop() {
      await server.stop();
      await db.close();
    },
  };
}

// Sobe a API numa porta livre e devolve a URL base para usar com fetch.
export async function listen(app: Express) {
  const server: Server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      // fetch mantém conexões keep-alive, que segurariam o close()
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
