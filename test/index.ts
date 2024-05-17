import axios from 'axios';
import { setupServer, serverUrl } from '../src/setup-server';

describe('Sample Test', () => {
  before(async () => {
    await setupServer();
  });

  it('should run hello query', async () => {
    const response = await axios.post(`${serverUrl}graphql`, {
      query: `
        query {
          hello
        }
      `,
    });

    console.log('Response:', response.data);
  });
});
