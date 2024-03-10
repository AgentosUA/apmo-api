import { readFileSync, existsSync } from 'fs';

const fileToBase64 = (pathToFile: string) => {
  if (!existsSync(pathToFile)) return '';

  const bitmap = readFileSync(pathToFile);

  return Buffer.from(bitmap).toString('base64');
};

export { fileToBase64 };
