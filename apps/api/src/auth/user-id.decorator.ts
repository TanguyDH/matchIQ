import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user's UUID from the request.
 * The value is placed there by AuthGuard — always use @UseGuards(AuthGuard)
 * on any controller that uses this decorator.
 */
export const UserId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ userId: string }>();
  return request.userId;
});
