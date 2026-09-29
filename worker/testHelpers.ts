// Shared fixtures for the Worker tests (worker/*.test.ts, run with
// `npm run test:worker`). Not imported by the Worker itself.
import { exportJWK, generateKeyPair, SignJWT } from "jose";

export const TEAM_DOMAIN = "test-team.cloudflareaccess.com";
export const AUD = "test-aud";
export const ADMIN_EMAIL = "admin@example.com";
const KID = "test-key";

// The key Access would sign with, served from the team's certs URL by
// stubbing fetch. A second key with the same kid stands in for a forgery.
const signing = await generateKeyPair("RS256");
const forger = await generateKeyPair("RS256");
const jwks = { keys: [{ ...(await exportJWK(signing.publicKey)), kid: KID, alg: "RS256", use: "sig" }] };

export const CERTS_URL = `https://${TEAM_DOMAIN}/cdn-cgi/access/certs`;
let certsFetches = 0;
export const certsFetchCount = () => certsFetches;

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = input instanceof Request ? input.url : String(input);
  if (url === CERTS_URL) {
    certsFetches += 1;
    return new Response(JSON.stringify(jwks), { headers: { "content-type": "application/json" } });
  }
  throw new Error(`unexpected fetch in test: ${url}`);
}) as typeof fetch;

interface TokenOptions {
  email?: string | null;
  aud?: string;
  iss?: string;
  expiresIn?: string | number;
  forged?: boolean;
}

export const accessToken = async ({
  email = ADMIN_EMAIL,
  aud = AUD,
  iss = `https://${TEAM_DOMAIN}`,
  expiresIn = "1h",
  forged = false,
}: TokenOptions = {}): Promise<string> => {
  const jwt = new SignJWT(email === null ? {} : { email })
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuedAt()
    .setIssuer(iss)
    .setAudience(aud);
  // A number is an absolute exp in seconds (for already-expired tokens).
  jwt.setExpirationTime(expiresIn);
  return jwt.sign(forged ? forger.privateKey : signing.privateKey);
};

// An unsigned token ("alg": "none") with otherwise-valid claims.
export const unsignedToken = (): string => {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: "none", kid: KID })}.${b64({
    email: ADMIN_EMAIL,
    aud: AUD,
    iss: `https://${TEAM_DOMAIN}`,
    iat: now,
    exp: now + 3600,
  })}.`;
};

export const testEnv = (overrides: Partial<Record<keyof Env, unknown>> = {}): Env =>
  ({
    ACCESS_TEAM_DOMAIN: TEAM_DOMAIN,
    ACCESS_AUD: AUD,
    ADMIN_EMAIL,
    ...overrides,
  }) as unknown as Env;
