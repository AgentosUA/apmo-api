const generateRandomString = (count = 20, prefix = '') =>
  `${prefix}${Math.random().toString(count)}`;

const removeExtraSlashes = (string = '') => {
  return string.replaceAll('/\\/', '/').replaceAll('\\', '/');
};

export { generateRandomString, removeExtraSlashes };
