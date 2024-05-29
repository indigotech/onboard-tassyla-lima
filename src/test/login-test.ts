import axios, { AxiosResponse } from 'axios';
import bcrypt from 'bcrypt';
import { expect } from 'chai';
import { serverUrl } from '../setup-server';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { Repository } from 'typeorm';
import jwt from 'jsonwebtoken';

interface CreateUserInputData {
  name: string;
  email: string;
  birthDate: string;
  password: string;
}

interface LoginInputData {
  email: string;
  password: string;
}

async function postLogin(loginInputData: LoginInputData): Promise<AxiosResponse> {
  const response = await axios.post(`${serverUrl}graphql`, {
    query: `
    mutation Login($data: LoginInput!) {
      login(data: $data) {
        user {
          birthDate
          email
          id
          name
        }
        token
      }
    }
      `,
    variables: {
      data: loginInputData,
    },
  });

  return response;
}

describe('login mutation', () => {
  let userRepository: Repository<User>;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    await userRepository.clear();
  });

  it('should be able to login', async () => {
    const inputUser: CreateUserInputData = {
      name: 'John Phill',
      email: 'john@example.com',
      password: 'password123',
      birthDate: '1990-01-01',
    };

    const inpuLogin: LoginInputData = {
      email: inputUser.email,
      password: inputUser.password,
    };

    const inputUserWithoutPassword = {
      name: inputUser.name,
      email: inputUser.email,
      birthDate: inputUser.birthDate,
    };

    await userRepository.save({
      ...inputUser,
      password: await bcrypt.hash(inputUser.password, 10),
    });

    const response = await postLogin(inpuLogin);

    const { id, ...login } = response.data.data.login.user;
    const decodedToken = jwt.verify(response.data.data.login.token, process.env.TOKEN_SECRET) as {
      id: number;
      iat: number;
      exp: number;
    };

    expect(login).to.deep.equal(inputUserWithoutPassword);
    expect(Number(id)).to.deep.equal(decodedToken.id);
  });

  it('should return an error when logging in with an email that does not exist', async () => {
    const inputUser: CreateUserInputData = {
      name: 'Matheus Felix',
      email: 'matheus@example.com',
      password: 'password123',
      birthDate: '1995-07-11',
    };

    const inpuLogin: LoginInputData = {
      email: 'matheus.felix@example.com',
      password: `password456`,
    };

    const expectedError = {
      code: 400,
      message: 'Invalid email',
      additionalInfo: 'There is not an user with this email.',
    };

    await userRepository.save({
      ...inputUser,
      password: await bcrypt.hash(inputUser.password, 10),
    });

    const response = await postLogin(inpuLogin);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });

  it('should return an error when logging in with the wrong password', async () => {
    const inputUser: CreateUserInputData = {
      name: 'Alan Raso',
      email: 'alan@example.com',
      password: 'password123',
      birthDate: '1995-07-11',
    };

    const inpuLogin: LoginInputData = {
      email: 'alan@example.com',
      password: `password456`,
    };

    const expectedError = {
      code: 400,
      message: 'Invalid password',
      additionalInfo: 'The password is incorrect.',
    };

    await userRepository.save({
      ...inputUser,
      password: await bcrypt.hash(inputUser.password, 10),
    });

    const response = await postLogin(inpuLogin);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });
});
