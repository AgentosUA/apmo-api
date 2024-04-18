import { readFileSync, existsSync } from 'fs';

const fileToBase64 = (pathToFile: string, type = 'image') => {
  if (!existsSync(pathToFile)) return '';

  const bitmap = readFileSync(pathToFile);

  const imageFormat =
    pathToFile.endsWith('jpg') || pathToFile.endsWith('jpeg') ? 'jpeg' : 'png';

  const mimetype = type === 'image' ? `data:image/${imageFormat};base64` : '';

  return `${mimetype}, ${Buffer.from(bitmap).toString('base64')}`;
};

export { fileToBase64 };
