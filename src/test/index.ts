import { config } from 'dotenv';
import { setupServer } from '../setup-server';
import { setupDatabase } from '../setup-database';

config({
  path: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
});

before(async () => {
  await setupDatabase();
  await setupServer();
});

import './hello-query-test';
import './create-user-test';
import './login-test';
import './user-query-test';
import './users-query-test';
