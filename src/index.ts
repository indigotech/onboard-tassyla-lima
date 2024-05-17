import { setupDatabase } from './setup-database.js';
import { setupServer } from './setup-server.js';

await setupDatabase();
await setupServer();
