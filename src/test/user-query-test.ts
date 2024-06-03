import axios, { AxiosResponse } from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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

async function postUserQuery(id: number, token: string): Promise<AxiosResponse> {
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
  let generatedId: number;
  let setupUser: CreateUserInputData;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    await userRepository.clear();
    setupUser = {
      name: 'Setup User',
      email: 'setup@example.com',
      password: 'password123',
      birthDate: '2000-01-11',
    };

    const user = await userRepository.save({
      ...setupUser,
      password: await bcrypt.hash(setupUser.password, 10),
    });

    generatedId = user.id;

    token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET, { expiresIn: '300s' });
  });

  it('should get a user by the id', async () => {
    const response = await postUserQuery(generatedId, token);

    const { id, ...userFields } = response.data.data.user;

    const inputUserWithoutPassword = {
      name: setupUser.name,
      email: setupUser.email,
      birthDate: setupUser.birthDate,
    };

    expect(userFields).to.deep.equal(inputUserWithoutPassword);
    expect(Number(id)).to.equal(generatedId);
  });
  it('should not be able to get a user with the wrong id', async () => {
    const expectedError = {
      code: 404,
      message: 'User not found',
      additionalInfo: 'The user with the provided ID was not found.',
    };

    const response = await postUserQuery(generatedId + 1, token);

    expect(response.data).to.deep.equal({ data: { user: null }, errors: [expectedError] });
  });
});
