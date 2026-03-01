import { verifyMetaWebhookChallenge } from "@/lib/server/whatsapp/webhook-verify";

describe("meta webhook verify", () => {
  const old = process.env.META_VERIFY_TOKEN;

  beforeEach(() => {
    process.env.META_VERIFY_TOKEN = "verify-123";
  });

  afterAll(() => {
    process.env.META_VERIFY_TOKEN = old;
  });

  it("returns challenge for valid params", () => {
    const challenge = verifyMetaWebhookChallenge({
      mode: "subscribe",
      verifyToken: "verify-123",
      challenge: "abc",
    });

    expect(challenge).toBe("abc");
  });

  it("throws for invalid token", () => {
    expect(() =>
      verifyMetaWebhookChallenge({
        mode: "subscribe",
        verifyToken: "bad",
        challenge: "abc",
      }),
    ).toThrow("Invalid verify token");
  });
});