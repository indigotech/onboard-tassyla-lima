import axios, { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { expect } from 'chai';
import { serverUrl } from '../setup-server';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { Repository } from 'typeorm';
import { tokenExpiration } from './index';

interface CreateUserInputData {
  name: string;
  email: string;
  birthDate: string;
  password: string;
}

async function postUserQuery(id: number, token?: string): Promise<AxiosResponse> {
  return axios.post(
    `${serverUrl}graphql`,
    {
      query: `
      query User($data: ID!) {
        user(id: $data) {
          id
          name
          email
          birthDate
        }
      }
      `,
      variables: {
        data: id,
      },
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}

describe('user query', () => {
  let userRepository: Repository<User>;
  let token: string;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    await userRepository.clear();

    token = jwt.sign({ id: 1 }, process.env.TOKEN_SECRET, { expiresIn: tokenExpiration });
  });

  it('should get a user by the id', async () => {
    const setupUser: CreateUserInputData = {
      name: 'Setup User',
      email: 'setup@example.com',
      password: 'password123',
      birthDate: '2000-01-11',
    };

    const user = await userRepository.save({
      ...setupUser,
      password: await bcrypt.hash(setupUser.password, 1),
    });

    const generatedId = user.id;

    const response = await postUserQuery(generatedId, token);

    const expectedUser = {
      id: String(generatedId),
      name: setupUser.name,
      email: setupUser.email,
      birthDate: setupUser.birthDate,
    };

    expect(response.data.data.user).to.deep.equal(expectedUser);
  });
  it('should not be able to get a user with the wrong id', async () => {
    const expectedError = {
      code: 404,
      message: 'User not found',
      additionalInfo: 'The user with the provided ID was not found.',
    };

    const response = await postUserQuery(1, token);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });
});
