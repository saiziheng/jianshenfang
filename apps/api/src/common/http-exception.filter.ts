import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = isHttp ? exception.getResponse() : null;
    const body = typeof raw === 'object' && raw !== null ? raw : { message: raw ?? 'Internal error' };
    const message = Array.isArray((body as any).message) ? (body as any).message.join('; ') : (body as any).message;
    const stack = exception instanceof Error ? exception.stack : undefined;

    if (status >= 500) {
      this.logger.error(message ?? 'Internal error', stack);
    } else {
      this.logger.warn(`${request.method} ${request.url} ${status} ${message ?? ''}`.trim());
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      code: (body as any).code ?? 'VALIDATION_ERROR',
      message,
      errors: Array.isArray((body as any).message) ? (body as any).message : undefined
    });
  }
}
