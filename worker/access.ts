import { createRemoteJWKSet, jwtVerify } from "jose";

// Cloudflare Access sits in front of /admin and /api/admin/* and handles the
// Google login, but the Worker re-verifies Access's JWT on every admin request
// rather than trusting that Access is actually in front of it (a
// misconfigured/deleted Access app, or any other route to the Worker, would
// otherwise expose admin data). Fails closed: missing config, a missing or
// invalid token, or an email that isn't ADMIN_EMAIL all mean "not admin".

const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";
const ACCESS_JWT_COOKIE = "CF_Authorization";

// Module scope so the signing keys are fetched once per isolate, not per
// request -- jose caches and refreshes them (including on key rotation).
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let jwksTeamDomain: string | undefined;

const getJwks = (teamDomain: string) => {
  if (!jwks || jwksTeamDomain !== teamDomain) {
    jwks = createRemoteJWKSet(
      new URL(`https://${teamDomain}/cdn-cgi/access/certs`)
    );
    jwksTeamDomain = teamDomain;
  }
  return jwks;
};

const getAccessToken = (request: Request): string | null => {
  const header = request.headers.get(ACCESS_JWT_HEADER);
  if (header) return header;

  const cookies = request.headers.get("cookie") ?? "";
  for (const part of cookies.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ACCESS_JWT_COOKIE && rest.length > 0) {
      return rest.join("=");
    }
  }
  return null;
};

// Returns the verified admin's email, or null if the request isn't from the admin.
export async function verifyAdmin(
  request: Request,
  env: Env
): Promise<string | null> {
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  const adminEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!teamDomain || !aud || !adminEmail) {
    return null;
  }

  const token = getAccessToken(request);
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience: aud,
      algorithms: ["RS256"],
    });
    const email =
      typeof payload.email === "string" ? payload.email.toLowerCase() : null;
    return email === adminEmail ? email : null;
  } catch {
    // Expired, wrong audience/issuer, bad signature, malformed -- all just
    // "not admin"; nothing here is worth surfacing to the caller.
    return null;
  }
}
