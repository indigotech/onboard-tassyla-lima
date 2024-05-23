import { unwrapResolverError } from '@apollo/server/errors';

export class CustomError extends Error {
  code: number;
  additionalInfo?: string;

  constructor(code: number, message: string, additionalInfo?: string) {
    super(message);
    this.code = code;
    this.additionalInfo = additionalInfo;
  }
}

export function errorFormatter(formattedError: Error, error: unknown) {
  const thrownError = unwrapResolverError(error);

  if (thrownError instanceof CustomError) {
    return {
      message: thrownError.message,
      code: thrownError.code,
      additionalInfo: thrownError.additionalInfo,
    };
  } else {
    return formattedError;
  }
}
