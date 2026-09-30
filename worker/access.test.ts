import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { verifyAdmin } from "./access.ts";
import {
  ADMIN_EMAIL,
  accessToken,
  certsFetchCount,
  testEnv,
  unsignedToken,
} from "./testHelpers.ts";

const withHeader = (token: string) =>
  new Request("https://morlocked.test/api/admin/me", {
    headers: { "cf-access-jwt-assertion": token },
  });
const withCookie = (cookie: string) =>
  new Request("https://morlocked.test/api/admin/me", { headers: { cookie } });

describe("verifyAdmin", () => {
  it("accepts a valid Access token for the admin, from the header", async () => {
    assert.equal(
      await verifyAdmin(withHeader(await accessToken()), testEnv()),
      ADMIN_EMAIL
    );
  });

  it("accepts the token from the CF_Authorization cookie", async () => {
    const token = await accessToken();
    assert.equal(
      await verifyAdmin(
        withCookie(`theme=light; CF_Authorization=${token}; other=1`),
        testEnv()
      ),
      ADMIN_EMAIL
    );
  });

  it("compares emails ignoring case and surrounding space in the secret", async () => {
    const token = await accessToken({ email: "Admin@Example.com" });
    assert.equal(
      await verifyAdmin(
        withHeader(token),
        testEnv({ ADMIN_EMAIL: "  ADMIN@example.com " })
      ),
      ADMIN_EMAIL
    );
  });

  it("fetches the signing keys once and reuses them", async () => {
    const before = certsFetchCount();
    await verifyAdmin(withHeader(await accessToken()), testEnv());
    await verifyAdmin(withHeader(await accessToken()), testEnv());
    assert.equal(certsFetchCount(), before);
  });

  describe("fails closed", () => {
    const rejects = async (request: Request, env = testEnv()) =>
      assert.equal(await verifyAdmin(request, env), null);

    it("with no token", async () => {
      await rejects(new Request("https://morlocked.test/api/admin/me"));
      await rejects(withCookie("CF_Authorization="));
    });

    it("for someone other than the admin", async () => {
      await rejects(
        withHeader(await accessToken({ email: "someone@example.com" }))
      );
    });

    it("for a token with no email claim", async () => {
      await rejects(withHeader(await accessToken({ email: null })));
    });

    it("for the wrong audience or issuer", async () => {
      await rejects(withHeader(await accessToken({ aud: "another-app" })));
      await rejects(
        withHeader(
          await accessToken({ iss: "https://other-team.cloudflareaccess.com" })
        )
      );
    });

    it("for an expired token", async () => {
      await rejects(
        withHeader(
          await accessToken({ expiresIn: Math.floor(Date.now() / 1000) - 60 })
        )
      );
    });

    it("for a token signed with another key", async () => {
      await rejects(withHeader(await accessToken({ forged: true })));
    });

    it("for an unsigned token", async () => {
      await rejects(withHeader(unsignedToken()));
    });

    it("for garbage", async () => {
      await rejects(withHeader("not-a-jwt"));
    });

    it("when any of the Access settings or the admin email is missing", async () => {
      const token = await accessToken();
      await rejects(withHeader(token), testEnv({ ADMIN_EMAIL: undefined }));
      await rejects(withHeader(token), testEnv({ ADMIN_EMAIL: "  " }));
      await rejects(withHeader(token), testEnv({ ACCESS_AUD: "" }));
      await rejects(withHeader(token), testEnv({ ACCESS_TEAM_DOMAIN: "" }));
    });

    it("when a blank admin email meets a token with a blank email", async () => {
      const token = await accessToken({ email: "" });
      await rejects(withHeader(token), testEnv({ ADMIN_EMAIL: "" }));
      await rejects(withHeader(token), testEnv({ ADMIN_EMAIL: "  " }));
    });
  });
});
