import { setupServer } from '../setup-server';
import { setupDatabase } from '../setup-database';
import { config } from 'dotenv';

config({
  path: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
});

before(async () => {
  await setupDatabase();
  await setupServer();
});

import './hello-query-test';
