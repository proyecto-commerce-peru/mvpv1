import { sendMetaTextMessage } from "@/lib/server/whatsapp/meta-provider";

describe("meta provider env validation", () => {
  const old = process.env.META_WHATSAPP_TOKEN;

  afterEach(() => {
    process.env.META_WHATSAPP_TOKEN = old;
  });

  it("throws when token missing", async () => {
    delete process.env.META_WHATSAPP_TOKEN;
    await expect(
      sendMetaTextMessage({
        phoneNumberId: "123",
        recipientPhoneE164: "+51999999999",
        text: "hola",
      }),
    ).rejects.toThrow("META_WHATSAPP_TOKEN is missing");
  });
});
