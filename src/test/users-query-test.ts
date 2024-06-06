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

async function postUsersQuery(token?: string, maxUsers?: number): Promise<AxiosResponse> {
  const query = `
  query Users($data: Int) {
    users (maxUsers: $data){
      id
      email
      birthDate
      name
    }
  }
  `;

  const variables = {
    data: maxUsers,
  };

  return postQuery(query, variables, token);
}

describe('users query', () => {
  let userRepository: Repository<User>;
  let token: string;
  let users;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    await userRepository.clear();
    users = [];

    const createdUsers = await userRepository.save(
      await Promise.all(
        [...Array(15)].map(async () => ({
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

    expect(response.data.data.users).to.deep.equal(users.slice(0, defaultMaxUsers));
  });

  it('should get the maximum amount of users defined in maxUsers', async () => {
    const maxUsers = 30;
    const response = await postUsersQuery(token, maxUsers);

    expect(response.data.data.users).to.deep.equal(users.slice(0, maxUsers));
  });

  it('should not be able to get a user with no token given', async () => {
    const expectedError = {
      code: 401,
      message: 'Unauthorized access',
      additionalInfo: 'The token is not valid.',
    };

    const response = await postUsersQuery();

    expect(response.data).to.deep.equal({ data: { users: null }, errors: [expectedError] });
  });

  it('should not be able to get a user with expirated token', async () => {
    const expectedError = {
      code: 401,
      message: 'Unauthorized access',
      additionalInfo: 'The token is not valid.',
    };

    token = jwt.sign({ id: 1 }, process.env.TOKEN_SECRET, { expiresIn: `-300s` });

    const response = await postUsersQuery(token);

    expect(response.data).to.deep.equal({ data: { users: null }, errors: [expectedError] });
  });
});
