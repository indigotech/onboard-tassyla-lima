const resolvers = {
  Query: {
    hello: () => 'Hello, World!',
  },
  Mutation: {
    createUser: (_, { data }): User => {
      const id = 1;
      return { id, ...data };
    },
  },
};

interface User {
  id: string;
  name: string;
  email: string;
  birthDate: string;
}

export default resolvers;
