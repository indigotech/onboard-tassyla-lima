import axios from 'axios';
import { expect } from 'chai';
import { serverUrl } from '../setup-server';

describe('createUser mutation', () => {
  it('should create a new user', async () => {
    const inputData = {
      name: 'John Phill',
      email: 'john@example.com',
      password: 'password123',
      birthDate: '1990-01-01',
    };

    const response = await axios.post(`${serverUrl}graphql`, {
      query: `
        mutation CreateUser($data: UserInput!) {
        createUser(data: $data) {
            id
            name
            email
            birthDate
          }
        }
        `,
      variables: {
        data: inputData,
      },
    });

    expect(response.status).to.equal(200);

    const { data } = response.data;
    expect(data.createUser).to.be.an('object');
    expect(data.createUser.id).to.be.a('string');
    expect(data.createUser.name).to.equal(inputData.name);
    expect(data.createUser.email).to.equal(inputData.email);
    expect(data.createUser.birthDate).to.equal(inputData.birthDate);
  });
});
