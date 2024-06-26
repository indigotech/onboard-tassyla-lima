import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import faker from 'faker';
import { AxiosResponse } from 'axios';
import { expect } from 'chai';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { Repository } from 'typeorm';
import { postQuery } from './postQuery.js';
import { tokenCreation } from '../schema/resolvers.js';
import { Address } from '../entity/Address.js';

async function postUsersQuery(token?: string, maxUsers?: number, skip?: number): Promise<AxiosResponse> {
  const query = `
    query Users($maxUsers: Int, $skip: Int) {
      users(maxUsers: $maxUsers, skip: $skip) {
        hasNextPage
        hasPreviousPage
        totalUsers
        users {
          id
          name
          email
          birthDate
          addresses {
            id
            city
            cep
            complement
            neighborhood
            state
            street
            streetNumber
          }
        }
      }
    }
    `;

  const variables = {
    maxUsers: maxUsers,
    skip: skip,
  };

  return postQuery(query, variables, token);
}

describe('users query', () => {
  let userRepository: Repository<User>;
  let addressRepository: Repository<Address>;
  let token: string;
  let users;
  let quantityOfUsersToSave;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    addressRepository = AppDataSource.getRepository(Address);
    await addressRepository.delete({});
    await userRepository.delete({});
    users = [];
    quantityOfUsersToSave = 10;
    const maxAddressesByUser = 3;

    const createdUsers: User[] = await userRepository.save(
      await Promise.all(
        [...Array(quantityOfUsersToSave)].map(async () => ({
          name: faker.name.findName(),
          email: faker.internet.email(),
          password: await bcrypt.hash(faker.internet.password(), 1),
          birthDate: faker.date.past().toISOString().slice(0, 10),
          addresses: [...Array(faker.datatype.number({ min: 0, max: maxAddressesByUser }))].map(() => ({
            city: faker.address.city(),
            cep: faker.address.zipCode(),
            complement: faker.address.secondaryAddress(),
            neighborhood: faker.address.streetName(),
            state: faker.address.stateAbbr(),
            street: faker.address.streetName(),
            streetNumber: String(faker.datatype.number({ min: 1, max: 1000 })),
          })),
        })),
      ),
    );

    users = createdUsers.map((user) => ({
      id: String(user.id),
      name: user.name,
      email: user.email,
      birthDate: user.birthDate,
      addresses: user.addresses.map((address) => ({ ...address, id: String(address.id) })),
    }));

    users.sort((a, b) => a.name.localeCompare(b.name));

    token = tokenCreation(1);
  });

  it('should get users with default maxUsers', async () => {
    const defaultMaxUsers = 10;
    const response = await postUsersQuery(token);

    const expectedResponse = {
      hasNextPage: false,
      hasPreviousPage: false,
      totalUsers: quantityOfUsersToSave,
      users: users.slice(0, defaultMaxUsers),
    };

    const sortedUsersByAddresses = response.data.data.users.users.map((user) => ({
      ...user,
      addresses: user.addresses.sort((a, b) => a.id.localeCompare(b.id)),
    }));

    expect({ ...response.data.data.users, users: sortedUsersByAddresses }).to.deep.equal(expectedResponse);
  });

  it('should get the first page of users', async () => {
    const maxUsers = 3;
    const response = await postUsersQuery(token, maxUsers);

    const expectedResponse = {
      hasNextPage: true,
      hasPreviousPage: false,
      totalUsers: quantityOfUsersToSave,
      users: users.slice(0, maxUsers),
    };

    const sortedUsersByAddresses = response.data.data.users.users.map((user) => ({
      ...user,
      addresses: user.addresses.sort((a, b) => a.id.localeCompare(b.id)),
    }));

    expect({ ...response.data.data.users, users: sortedUsersByAddresses }).to.deep.equal(expectedResponse);
  });

  it('should get the last page of users', async () => {
    const maxUsers = 3;
    const skip = 7;
    const response = await postUsersQuery(token, maxUsers, skip);

    const expectedResponse = {
      hasNextPage: false,
      hasPreviousPage: true,
      totalUsers: quantityOfUsersToSave,
      users: users.slice(skip, skip + maxUsers),
    };

    const sortedUsersByAddresses = response.data.data.users.users.map((user) => ({
      ...user,
      addresses: user.addresses.sort((a, b) => a.id.localeCompare(b.id)),
    }));

    expect({ ...response.data.data.users, users: sortedUsersByAddresses }).to.deep.equal(expectedResponse);
  });

  it('should get a middle page of users', async () => {
    const maxUsers = 3;
    const skip = 3;
    const response = await postUsersQuery(token, maxUsers, skip);

    const expectedResponse = {
      hasNextPage: true,
      hasPreviousPage: true,
      totalUsers: quantityOfUsersToSave,
      users: users.slice(skip, skip + maxUsers),
    };

    const sortedUsersByAddresses = response.data.data.users.users.map((user) => ({
      ...user,
      addresses: user.addresses.sort((a, b) => a.id.localeCompare(b.id)),
    }));

    expect({ ...response.data.data.users, users: sortedUsersByAddresses }).to.deep.equal(expectedResponse);
  });

  it('should get an empty page of users when skip is bigger than the total quantity of users', async () => {
    const maxUsers = 3;
    const skip = 15;
    const response = await postUsersQuery(token, maxUsers, skip);

    const expectedResponse = {
      hasNextPage: false,
      hasPreviousPage: true,
      totalUsers: quantityOfUsersToSave,
      users: users.slice(skip, skip + maxUsers),
    };

    expect(response.data.data.users).to.deep.equal(expectedResponse);
  });

  it('should not be able to get a user with no token given', async () => {
    const expectedError = {
      code: 401,
      message: 'Unauthorized access',
      additionalInfo: 'The token is not valid.',
    };

    const response = await postUsersQuery();

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });
  it('should not be able to get a user with expirated token', async () => {
    const expectedError = {
      code: 401,
      message: 'Unauthorized access',
      additionalInfo: 'The token is not valid.',
    };

    token = jwt.sign({ id: 1 }, process.env.TOKEN_SECRET, { expiresIn: `-300s` });

    const response = await postUsersQuery(token);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });
});
