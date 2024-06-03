import axios, { AxiosResponse } from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { expect } from 'chai';
import { serverUrl } from '../setup-server';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { Repository } from 'typeorm';
import { addDays, addHours } from 'date-fns';

interface CreateUserInputData {
  name: string;
  email: string;
  birthDate: string;
  password: string;
}

interface LoginInputData {
  email: string;
  password: string;
  rememberMe?: boolean;
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

  it('should be able to login with correct expiration for no rememberMe option set', async () => {
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
    const expectedExpiration = addHours(new Date(), 8).getTime();
    const tokenExpiration = decodedToken.exp * 1000;

    expect(tokenExpiration).to.be.closeTo(expectedExpiration, 1000);

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
  it('should return a token with correct expiration for rememberMe option set as true', async () => {
    const inputUser: CreateUserInputData = {
      name: 'Daniel Ueno',
      email: 'daniel@example.com',
      password: 'password123',
      birthDate: '1995-01-01',
    };

    const inputLogin: LoginInputData = {
      email: inputUser.email,
      password: inputUser.password,
      rememberMe: true,
    };

    await userRepository.save({
      ...inputUser,
      password: await bcrypt.hash(inputUser.password, 10),
    });

    const response = await postLogin(inputLogin);

    const decodedToken = jwt.verify(response.data.data.login.token, process.env.TOKEN_SECRET) as {
      id: number;
      iat: number;
      exp: number;
    };

    const expectedExpiration = addDays(new Date(), 7).getTime();
    const tokenExpiration = decodedToken.exp * 1000;

    expect(tokenExpiration).to.be.closeTo(expectedExpiration, 1000);
  });

  it('should return a token with correct expiration for rememberMe option set as false', async () => {
    const inputUser: CreateUserInputData = {
      name: 'Tassyla Lima',
      email: 'tassyla@example.com',
      password: 'password123',
      birthDate: '2003-12-11',
    };

    const inputLogin: LoginInputData = {
      email: inputUser.email,
      password: inputUser.password,
      rememberMe: false,
    };

    await userRepository.save({
      ...inputUser,
      password: await bcrypt.hash(inputUser.password, 10),
    });

    const response = await postLogin(inputLogin);

    const decodedToken = jwt.verify(response.data.data.login.token, process.env.TOKEN_SECRET) as {
      id: number;
      iat: number;
      exp: number;
    };

    const expectedExpiration = addHours(new Date(), 8).getTime();
    const tokenExpiration = decodedToken.exp * 1000;

    expect(tokenExpiration).to.be.closeTo(expectedExpiration, 1000);
  });
});
