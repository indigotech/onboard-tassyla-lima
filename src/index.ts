import { setupDatabase } from './setup-database.js';
import { setupServer } from './setup-server.js';

before(async () => {
  await setupDatabase();
  await setupServer();
});
