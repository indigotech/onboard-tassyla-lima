import axios, { AxiosResponse } from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import faker from 'faker';
import { expect } from 'chai';
import { serverUrl } from '../setup-server';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { Repository } from 'typeorm';

interface CreateUserInputData {
  name: string;
  email: string;
  birthDate: string;
  password: string;
}

async function postUsersQuery(token: string, maxUsers?: number): Promise<AxiosResponse> {
  return axios.post(
    `${serverUrl}graphql`,
    {
      query: `
      query Users($data: Int) {
        users (maxUsers: $data){
          id
          email
          birthDate
          name
        }
      }
      `,
      variables: {
        data: maxUsers,
      },
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}

describe('users query', () => {
  let userRepository: Repository<User>;
  let token: string;
  let usersToInsert: CreateUserInputData[];
  let users;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    await userRepository.clear();
    usersToInsert = [];
    users = [];

    for (let i = 1; i <= 15; i++) {
      const user = {
        name: faker.name.findName(),
        email: faker.internet.email(),
        password: await bcrypt.hash(faker.internet.password(), 1),
        birthDate: faker.date.past().toISOString().slice(0, 10),
      };
      usersToInsert.push(user);
    }

    const createdUsers = await Promise.all(usersToInsert.map((user) => userRepository.save(user)));

    createdUsers.forEach((user) => {
      users.push({
        id: String(user.id),
        name: user.name,
        email: user.email,
        birthDate: user.birthDate,
      });
    });

    token = jwt.sign({ id: users[0].id }, process.env.TOKEN_SECRET, { expiresIn: '300s' });
  });

  it('should get users with default maxUsers', async () => {
    const defaultMaxUsers = 10;
    const response = await postUsersQuery(token);

    users.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    expect(response.data.data.users).to.deep.equal(users.slice(0, defaultMaxUsers));
  });
  it('should get the maximum amount of users defined in maxUsers', async () => {
    const maxUsers = 30;
    const response = await postUsersQuery(token, maxUsers);

    users.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    expect(response.data.data.users).to.deep.equal(users.slice(0, maxUsers));
  });
});
