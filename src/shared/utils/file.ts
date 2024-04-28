import { readFileSync, existsSync } from 'fs';

const fileToBase64 = (pathToFile: string, type = 'image') => {
  if (!existsSync(pathToFile)) return '';

  const base64 = readFileSync(pathToFile, 'base64');

  const imageFormat =
    pathToFile.endsWith('jpg') || pathToFile.endsWith('jpeg') ? 'jpeg' : 'png';

  const mimetype = type === 'image' ? `data:image/${imageFormat};base64` : '';

  return `${mimetype},${base64}`;
};

export { fileToBase64 };
