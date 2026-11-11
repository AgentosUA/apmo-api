import {
  FileValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
} from '@nestjs/common';

import { detectImageType } from './file-signature';

export const FILE_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  required?: boolean;
}

// Checks the file content, not the extension or the MIME type from the client.
class ImageSignatureValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file?: unknown): boolean {
    const upload = file as { buffer?: Buffer } | undefined;

    return Boolean(detectImageType(upload?.buffer));
  }

  buildErrorMessage(): string {
    return 'Only JPEG, PNG, GIF and WebP images are allowed';
  }
}

/** Image upload: size limit plus a JPEG/PNG/GIF/WebP signature check. */
export function FileValidation(
  options: FileValidationOptions = {},
): ParameterDecorator {
  const { maxSize = FILE_MAX_SIZE, required = true } = options;

  return UploadedFile(
    new ParseFilePipe({
      fileIsRequired: required,
      validators: [
        new MaxFileSizeValidator({ maxSize }),
        new ImageSignatureValidator(),
      ],
    }),
  );
}
