import express from 'express';
import path from 'path';
// const { ApolloServer, gql } = require('apollo-server-express');
import morgan from 'morgan';
import cors from 'cors';
const debug = require('debug')('app:app');
import actualSchema from './schema';
import { graphqlHTTP } from 'express-graphql';
require('dotenv').config(); //For env variables

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  '/graphql',
  graphqlHTTP({
    schema: actualSchema,
    graphiql: true
  })
);

/*const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app });*/

const port = process.env.PORT || 8080 || 8500;
app.listen({ port: port }, () =>
  console.log(`Now browse to http://localhost:${port}`)
);

export default app;
