import { expect } from 'chai';
import { postQuery } from './postQuery';

describe('Sample Test', () => {
  it('should run hello query', async () => {
    const response = await postQuery(`
        query {
        hello
        }
    `);

    expect(response.data.data.hello).to.be.eq('Hello, World!');
  });
});
