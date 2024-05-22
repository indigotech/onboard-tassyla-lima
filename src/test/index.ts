import { config } from 'dotenv';
import { setupServer } from '../setup-server';
import { setupDatabase } from '../setup-database';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';

config({
  path: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
});

before(async () => {
  await setupDatabase();
  await setupServer();
});

beforeEach(async () => {
  const userRepository = AppDataSource.getRepository(User);
  await userRepository.clear();
});

import './hello-query-test';
import './create-user-test';
