const generateRandomString = (count = 20, prefix = '') =>
  `${prefix}${Math.random().toString(count)}`.replaceAll('.', '');

const removeExtraSlashes = (string = '') => {
  return string.replaceAll('/\\/', '/').replaceAll('\\', '/');
};

const getImagePathsFromHTML = (htmlString: string) => {
  // Define a regular expression pattern to match the value of the image attribute
  const pattern = /src="([^"]+)"/;

  // Use the match function to extract the image path
  const matches = htmlString.match(pattern);

  // If matches are found, return the image path
  console.log(matches);
  if (matches && matches.length > 1) {
    return matches[1];
  } else {
    // If no matches are found, return null or an empty string
    return null; // or return "";
  }
};

export { generateRandomString, removeExtraSlashes, getImagePathsFromHTML };
