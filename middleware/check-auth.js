const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  //we decide to encode in token in the headers so we retrive it also from there

  //before any type of request a OPTIONS requesest is sent by browser to see if it can actually send requests or not so we do this:
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1]; //Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error('Authentication Failed.');
    }
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedToken.userId }; //every req bellow this will be able to use this userData object part of the req
    next();
  } catch (err) {
    const error = new HttpError('Authentication failed', 401);
    return next(error);
  }
};
