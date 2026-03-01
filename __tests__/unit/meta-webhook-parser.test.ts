import { parseMetaIncomingMessages } from "@/lib/server/whatsapp/webhook-parser";

describe("meta webhook parser", () => {
  it("extracts inbound messages", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "pnid-1" },
                messages: [
                  { id: "wamid.1", from: "+51999999999", text: { body: "hola" } },
                ],
              },
            },
          ],
        },
      ],
    };

    const out = parseMetaIncomingMessages(payload);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual(
      expect.objectContaining({
        external_id: "wamid.1",
        phone_number_id: "pnid-1",
        from: "+51999999999",
        text: "hola",
      }),
    );
  });

  it("returns empty for malformed payload", () => {
    expect(parseMetaIncomingMessages({})).toEqual([]);
  });
});