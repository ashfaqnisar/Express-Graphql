import express from 'express';
import path from 'path';
const { ApolloServer, gql } = require('apollo-server-express');
import morgan from 'morgan';
import cors from 'cors';
const debug = require('debug')('app:app');
require('dotenv').config(); //For env variables

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello World'
  }
};

const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app });

const port = process.env.PORT || 8080 || 8500;
app.listen({ port: port }, () =>
  console.log(`Now browse to http://localhost:${port}` + server.graphqlPath)
);

export default app;
