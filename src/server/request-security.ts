import { createHash } from 'node:crypto';

export type OriginValidation =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; code: 'INVALID_ORIGIN' }>;

export function validateRequestOrigin(
  request: Request,
  isProduction: boolean,
): OriginValidation {
  const origin = request.headers.get('origin');
  if (!origin) {
    return isProduction ? { ok: false, code: 'INVALID_ORIGIN' } : { ok: true };
  }

  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProtocol = request.headers.get('x-forwarded-proto');
  const host = forwardedHost ?? request.headers.get('host') ?? url.host;
  const protocol = forwardedProtocol ?? url.protocol.replace(':', '');
  const expectedOrigin = `${protocol}://${host}`;

  return origin === expectedOrigin
    ? { ok: true }
    : { ok: false, code: 'INVALID_ORIGIN' };
}

export async function digestForwardedAddress(address: string): Promise<string> {
  return createHash('sha256').update(address).digest('hex');
}
