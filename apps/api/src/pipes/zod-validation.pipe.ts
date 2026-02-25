import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

/**
 * Pipe that validates @Body() payloads against a Zod schema.
 * Usage: @Body(new ZodValidationPipe(MySchema))
 *
 * Returns the *parsed* (coerced / defaulted) value on success.
 * Throws 400 with structured errors on failure — never leaks internals.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType<unknown>) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      );
    }

    return result.data;
  }
}
