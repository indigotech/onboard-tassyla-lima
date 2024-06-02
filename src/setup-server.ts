import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { errorFormatter } from './schema/customError.js';
import typeDefs from './schema/typeDefs.js';
import resolvers from './schema/resolvers.js';
import jwt from 'jsonwebtoken';

export let serverUrl: string;

export async function setupServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: errorFormatter,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
      const token = req.headers.authorization || '';
      if (token) {
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET) as {
          id: number;
          iat: number;
          exp: number;
        };

        if (new Date().getTime() < decodedToken.exp * 1000) {
          return { userId: decodedToken.id };
        }
      }

      return {};
    },
  });

  console.log(`🚀  Server ready at: ${url}`);

  serverUrl = url;
}
