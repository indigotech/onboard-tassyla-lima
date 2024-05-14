import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `
  type Query {
    hello: String
  }

  input UserInput {
    name: String!
    email: String!
    password: String!
    birthDate: String!
  }
  
  type User {
    id: ID!
    name: String!
    email: String!
    birthDate: String!
  }

  type Mutation {
    createUser(data: UserInput!): User
  }
`;
interface IUser {
  id: string;
  name: string;
  email: string;
  birthDate: string;
}

const resolvers = {
  Query: {
    hello: () => 'Hello, World!',
  },
  Mutation: {
    createUser: (_, { data }): IUser => {
      const id = 1;
      return { id, ...data };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
