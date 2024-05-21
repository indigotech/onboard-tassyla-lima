import axios from 'axios';
import { expect } from 'chai';
import { serverUrl } from '../setup-server';

describe('Sample Test', () => {
  it('should run hello query', async () => {
    const response = await axios.post(`${serverUrl}graphql`, {
      query: `
        query {
        hello
        }
    `,
    });

    expect(response.data.data.hello).to.be.eq('Hello, World!');
  });
});
