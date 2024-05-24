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

export function errorFormatter(formattedError: CustomError, error: Error) {
  const thrownError = unwrapResolverError(error);

  if (thrownError instanceof CustomError) {
    return {
      message: thrownError.message,
      code: thrownError.code,
      additionalInfo: thrownError.additionalInfo,
    };
  } else {
    return {
      message: 'Unknown Error',
      code: 500,
    };
  }
}
