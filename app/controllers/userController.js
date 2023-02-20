const UserModel = require("../models/Users");
const AppResponse = require("../services/AppResponse")

const createUser = async (req, res) => {
  try {
    const payload = req.body.user;
    const user = await UserModel.create(payload)
    return AppResponse.success(res, user)
  } catch (error) {
    if(error.message.includes('E11000 duplicate key error collection')) {
      return AppResponse.conflict(
        res,
        'User with user name already exists',
        error.message
      )
    } else if (error.name = 'ValidationError') {
      return AppResponse.badRequest(
        res,
        'Invalid Payload',
        error.message
      )
    } else {
      return AppResponse.error(
        res,
        'INTERNAL SERVER ERROR',
        error.message
      )
    }
  }
};

const getUsers = async (req, res) => {
    try {
      const users = await UserModel.find();
      return AppResponse.success(res, {users})
    } catch (error) {
      return AppResponse.error(
        res,
        'INTERNAL SERVER ERROR',
        error.message
      )
    }
};

const login = async (req, res) => {
  try {
    const user = req.body.user;
    if(!user.userName || !user.password) {
      return AppResponse.badRequest(
        res,
        'MISSING_REQUIRED_FIELDS',
        'MISSING_REQUIRED_FIELDS' 
      )
    }
    // check if the user present and compare the password
    const userDetails = await UserModel.findOne({userName: user.userName});
    if(!userDetails) {
      return AppResponse.notFound(
        res,
        'USER NOT FOUND',
        'USER NOT FOUND' 
      )
    } else if (userDetails.password !== user.password) {
      return AppResponse.badRequest(
        res,
        'INVALID_PASSWORD',
        'INVALID_PASSWORD' 
      )
    }
    return AppResponse.success(res, {user: userDetails});
  } catch (error) {
    return AppResponse.error(
      res,
      'INTERNAL SERVER ERROR',
      error.message
    )
  }
}

const deleteUserByAdmin = async (req, res) => {
    try {
      // get user by Id
      const { id } = req.params;
      const userDetails = await UserModel.findOne({_id: id});
      if(!userDetails) {
        return AppResponse.notFound(
          res,
          'USER NOT FOUND',
          'USER NOT FOUND' 
        )
      }
      // delete user
      const user = await UserModel.findByIdAndDelete(id);
      return AppResponse.success(res, {user})
    } catch (error) {
      return AppResponse.error(
        res,
        'INTERNAL SERVER ERROR',
        error.message
      )
    }
};

module.exports = {
  createUser,
  getUsers,
  login,
  deleteUserByAdmin,
};
