const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue[Object.keys(err.keyValue)[0]];
  const message = `Duplicate field value: ${value}, Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(' ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again', 401);

const handleTokenExpired = () =>
  new AppError('Expired token. Please login again', 401);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //Rendered website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong.',
    msg: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  //A) API ERROR (POSTMAN)
  if (req.originalUrl.startsWith('/api')) {
    //Operational error from appError
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //Programming or other unknown error. Doesn't go to client
    }
    return res.status(500).json({
      status: 'error',
      message: 'Something is not quite right.',
    });
  }
  //B) RENDERED ON WEBSITE
  //Operational error from appError
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      status: err.status,
      msg: err.message,
    });
  }
  //Programming or other unknown error. Doesn't go to client
  return res.status(500).render('error', {
    status: 'error',
    msg: 'Please Try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleTokenExpired();
    sendErrorProd(err, req, res);
  }
};
