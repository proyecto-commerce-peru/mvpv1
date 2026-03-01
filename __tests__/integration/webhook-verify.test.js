/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const request = require("supertest");
const { verifyMetaWebhookChallenge } = require("../../lib/server/whatsapp/webhook-verify");

describe("webhook verification integration", () => {
  const old = process.env.META_VERIFY_TOKEN;

  beforeEach(() => {
    process.env.META_VERIFY_TOKEN = "verify-123";
  });

  afterAll(() => {
    process.env.META_VERIFY_TOKEN = old;
  });

  it("returns challenge in HTTP flow", async () => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", "http://localhost");

      try {
        const challenge = verifyMetaWebhookChallenge({
          mode: url.searchParams.get("hub.mode"),
          verifyToken: url.searchParams.get("hub.verify_token"),
          challenge: url.searchParams.get("hub.challenge"),
        });

        res.statusCode = 200;
        res.end(challenge);
      } catch {
        res.statusCode = 403;
        res.end("forbidden");
      }
    });

    await request(server)
      .get("/?hub.mode=subscribe&hub.verify_token=verify-123&hub.challenge=ok")
      .expect(200)
      .expect("ok");

    server.close();
  });
});
