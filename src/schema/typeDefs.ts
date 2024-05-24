const typeDefs = `
  type Query {
    hello: String
  }

  type Mutation {
    createUser(data: CreateUserInput!): OutUser!
    login(data: LoginInput!): LoginResponse!
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    birthDate: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type OutUser {
    id: Int!
    name: String!
    email: String!
    birthDate: String!
  }

  type LoginResponse {
    user: OutUser!
    token: String!
  }
`;

export default typeDefs;
