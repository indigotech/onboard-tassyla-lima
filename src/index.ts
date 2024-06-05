import { config } from 'dotenv';
import { setupDatabase } from './setup-database.js';
import { setupServer } from './setup-server.js';

config({
  path: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
});

await setupDatabase();
await setupServer();
