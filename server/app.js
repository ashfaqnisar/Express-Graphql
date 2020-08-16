import express from 'express';
import path from 'path';
import { ApolloServer, gql } from 'apollo-server-express';
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

const books = [
  {
    title: 'Harry Potter and the Chamber of Secrets',
    author: 'J.K. Rowling'
  },
  {
    title: 'Jurassic Park',
    author: 'Michael Crichton'
  }
];

const typeDefs = gql`
  #Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: [Book]
  }
`;

const resolvers = {
  Query: {
    books: () => books
  }
};

const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app });

const port = process.env.PORT || 8080 || 8500;
app.listen({ port: port }, () =>
  console.log(`Now browse to http://localhost:${port}` + server.graphqlPath)
);

export default app;
