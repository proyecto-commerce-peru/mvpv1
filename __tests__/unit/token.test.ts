import { issueAccessToken, verifyAccessToken } from "@/lib/server/auth/token";

describe("auth token", () => {
  it("issues and verifies valid access token", () => {
    const token = issueAccessToken("user-1", "tenant-1", 60);
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe("user-1");
    expect(payload.tenant_id).toBe("tenant-1");
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it("rejects malformed token", () => {
    expect(() => verifyAccessToken("bad-token")).toThrow("Malformed access token");
  });
});