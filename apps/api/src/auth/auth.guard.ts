import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

// ─── JWKS public-key cache ───────────────────────────────────────────────────
// Fetched once from Supabase on first use, then kept in memory for the lifetime
// of the process.  ES256 keys rotate infrequently; a restart picks up the new key.

let cachedEC: string | null = null;

async function getECPublicKey(): Promise<string> {
  if (cachedEC) return cachedEC;

  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
  // JWKS is an external payload — typed loosely on purpose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jwks = (await res.json()) as any;
  const ecKey = jwks.keys.find((k: any) => k.kty === 'EC');

  if (!ecKey) throw new Error('No EC key found in Supabase JWKS');

  cachedEC = crypto
    .createPublicKey({ key: ecKey, format: 'jwk' })
    .export({ type: 'spki', format: 'pem' }) as string;

  return cachedEC;
}

// ─── Guard ────────────────────────────────────────────────────────────────────

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; userId?: string }>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7); // strip "Bearer "

    // Peek at the header (no verification) to pick the right key/algorithm pair.
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Malformed token');
    }

    let secret: string | Buffer;
    let algorithms: jwt.Algorithm[];

    if (decoded.header.alg === 'ES256') {
      secret = await getECPublicKey();
      algorithms = ['ES256'];
    } else {
      // HS256 — shared secret (anon / service-role keys)
      secret = process.env.SUPABASE_JWT_SECRET!;
      algorithms = ['HS256'];
    }

    try {
      const payload = jwt.verify(token, secret, { algorithms }) as { sub?: string };

      if (typeof payload.sub !== 'string') {
        throw new UnauthorizedException('Token is missing the sub claim');
      }

      request.userId = payload.sub;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
