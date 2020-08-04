import express from 'express';
import path from 'path';
import morgan from 'morgan';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import cors from 'cors';

const debug = require('debug')('app:app');

const schema = buildSchema(`
  type Query {
    hello: String
  }
`);

const root = { hello: () => 'Hello world!' };

require('dotenv').config(); //For env variables

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  '/',
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
  })
);

const listener = app.listen(process.env.PORT || 8080 || 8500, function () {
  console.log('Listening on port ' + listener.address().port);
});

export default app;
