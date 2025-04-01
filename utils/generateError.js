export default (message, statusCode, statusText) => {
  const error = new Error();
  error.message = message;
  error.statusCode = statusCode;
  error.statusText = statusText;
  return error;
};
