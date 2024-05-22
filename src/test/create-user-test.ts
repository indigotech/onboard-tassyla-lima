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

    const { data } = response.data;
    expect(data.createUser).to.be.an('object');
    expect(data.createUser.id).to.be.a('string');
    expect(data.createUser.name).to.equal(inputData.name);
    expect(data.createUser.email).to.equal(inputData.email);
    expect(data.createUser.birthDate).to.equal(inputData.birthDate);
  });

  it('should return an error when creating a user with the same email', async () => {
    const inputData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password456',
      birthDate: '1985-05-10',
    };

    try {
      await axios.post(`${serverUrl}graphql`, {
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
    } catch (error) {
      expect(error.response.data.errors[0].message).to.equal('There is already another user with this email.');
    }
  });

  it('should return an error when password is less than 6 characters long', async () => {
    const inputData = {
      name: 'Matheus Felix',
      email: 'matheus@example.com',
      password: 'p4ss',
      birthDate: '1995-07-11',
    };

    try {
      await axios.post(`${serverUrl}graphql`, {
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
    } catch (error) {
      expect(error.response.data.errors[0].message).to.equal('Password must be at least 6 characters long.');
    }
  });

  it('should return an error when password does not contain at least one letter', async () => {
    const inputData = {
      name: 'Daniel Ueno',
      email: 'daniel@example.com',
      password: '123456',
      birthDate: '1996-12-20',
    };

    try {
      await axios.post(`${serverUrl}graphql`, {
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
    } catch (error) {
      expect(error.response.data.errors[0].message).to.equal('Password must contain at least one letter.');
    }
  });

  it('should return an error when password does not contain at least one number', async () => {
    const inputData = {
      name: 'Alan Raso',
      email: 'john@example.com',
      password: 'password',
      birthDate: '1993-03-25',
    };

    try {
      await axios.post(`${serverUrl}graphql`, {
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
    } catch (error) {
      expect(error.response.data.errors[0].message).to.equal('Password must contain at least one number.');
    }
  });

  it('should create another new user', async () => {
    const inputData = {
      name: 'Tassyla Lima',
      email: 'Tassyla@example.com',
      password: 'password987',
      birthDate: '2003-12-11',
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
