const { AuthenticationError } = require('apollo-server-express');
// Import user model
const { User } = require('../models');
// Import sign token function from auth
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw new AuthenticationError('Cannot find a user with this id!');
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });

      if (!user) {
        throw new AuthenticationError('Something is wrong!');
      }

      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, { bookId, authors, description, title, image, link }, context) => {
      try {
        if (context.user) {
          const updatedUserProfile = await User.findOneAndUpdate(
            { _id: context.user._id },
            {
              $addToSet: { bookId, authors, description, title, image, link }
            },
            { new: true, runValidators: true }
          );
          return updatedUserProfile;
        }
      } catch (err) {
        console.log(err);
        throw new AuthenticationError({ message: err });
      }
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUserProfile = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { bookId } },
          { new: true }
        );

        return updatedUserProfile;
      }
      throw new AuthenticationError("Couldn't find user with this id!");
    },
  },
};

module.exports = resolvers;
