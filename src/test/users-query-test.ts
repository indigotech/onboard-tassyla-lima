import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import faker from 'faker';
import { AxiosResponse } from 'axios';
import { expect } from 'chai';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { Repository } from 'typeorm';
import { postQuery } from './create-user-test';
import { tokenCreation } from '../schema/resolvers.js';

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
  let token: string;
  let users;
  let quantityOfUsersToSave;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    await userRepository.clear();
    users = [];
    quantityOfUsersToSave = 50;

    const createdUsers = await userRepository.save(
      await Promise.all(
        [...Array(quantityOfUsersToSave)].map(async () => ({
          name: faker.name.findName(),
          email: faker.internet.email(),
          password: await bcrypt.hash(faker.internet.password(), 1),
          birthDate: faker.date.past().toISOString().slice(0, 10),
        })),
      ),
    );

    users = createdUsers.map((user) => ({
      id: String(user.id),
      name: user.name,
      email: user.email,
      birthDate: user.birthDate,
    }));

    users.sort((a, b) => a.name.localeCompare(b.name));

    token = tokenCreation(1);
  });

  it('should get users with default maxUsers', async () => {
    const defaultMaxUsers = 10;
    const response = await postUsersQuery(token);

    const expectedResponse = {
      hasNextPage: true,
      hasPreviousPage: false,
      totalUsers: quantityOfUsersToSave,
      users: users.slice(0, defaultMaxUsers),
    };

    expect(response.data.data.users).to.deep.equal(expectedResponse);
  });
  it('should get the maximum amount of users defined in maxUsers', async () => {
    const maxUsers = 30;
    const response = await postUsersQuery(token, maxUsers);

    const expectedResponse = {
      hasNextPage: true,
      hasPreviousPage: false,
      totalUsers: quantityOfUsersToSave,
      users: users.slice(0, maxUsers),
    };

    expect(response.data.data.users).to.deep.equal(expectedResponse);
  });

  it('should get last page of users', async () => {
    const maxUsers = 30;
    const skip = 30;
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
