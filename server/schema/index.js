import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql';

import UserType from '../types/UserType';

const RootQueryType = new GraphQLObjectType({
  name: 'RootQuery',
  fields: {
    user: {
      type: UserType,
      description: 'This is an user',
      args: {
        key: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: () => {
        return {
          id: 1212,
          email: 'ashfaqnisar00@gmail.com'
        };
      }
    }
  }
});

const actualSchema = new GraphQLSchema({
  query: RootQueryType
});

export default actualSchema;
