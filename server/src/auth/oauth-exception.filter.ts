import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException)
export class OAuthExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Extract the exact error message string
    const exceptionResponse = exception.getResponse() as any;
    const message =
      typeof exceptionResponse === 'object' && exceptionResponse.message
        ? exceptionResponse.message
        : exception.message || 'Authentication failed';

    response.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(message)}`,
    );
  }
}
