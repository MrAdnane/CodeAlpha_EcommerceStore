// One error handler for the whole API, so errors are always JSON.
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Something went wrong';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404; message = 'Resource not found';
  }
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
