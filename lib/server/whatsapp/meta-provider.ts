import { ApiError } from "@/lib/server/errors";

type SendMetaTextInput = {
  phoneNumberId: string;
  recipientPhoneE164: string;
  text: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ApiError(500, "WHATSAPP_CONFIG_ERROR", `${name} is missing`);
  }
  return value;
}

export async function sendMetaTextMessage(input: SendMetaTextInput): Promise<{ provider_message_id?: string }> {
  const token = requiredEnv("META_WHATSAPP_TOKEN");
  const version = process.env.META_GRAPH_VERSION ?? "v22.0";

  const endpoint = `https://graph.facebook.com/${version}/${input.phoneNumberId}/messages`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.recipientPhoneE164,
        type: "text",
        text: {
          preview_url: false,
          body: input.text,
        },
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new ApiError(
        502,
        "WHATSAPP_PROVIDER_ERROR",
        payload.error?.message ?? "Failed to send message via Meta",
      );
    }

    return {
      provider_message_id: payload.messages?.[0]?.id,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "WHATSAPP_PROVIDER_ERROR", "Meta provider request failed");
  } finally {
    clearTimeout(timeout);
  }
}