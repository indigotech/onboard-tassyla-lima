import axios from 'axios';
import { config } from 'dotenv';
import { setupServer } from '../setup-server';
import { setupDatabase } from '../setup-database';
import { serverUrl } from '../setup-server';

config({
  path: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
});

before(async () => {
  await setupDatabase();
  await setupServer();
});

beforeEach(async () => {
  await deleteAllUsers();
});

async function deleteAllUsers() {
  try {
    const response = await axios.post(`${serverUrl}graphql`, {
      query: `
        mutation {
          deleteAllUsers
        }
      `,
    });
    console.log(response.data.data.deleteAllUsers);
  } catch (error) {
    console.error('Error deleting users:', error.response.data);
  }
}

import './hello-query-test';
import './create-user-test';
