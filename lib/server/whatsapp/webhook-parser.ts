export type ParsedIncomingMessage = {
  external_id: string;
  phone_number_id: string;
  from: string;
  text?: string;
  raw: unknown;
};

export function parseMetaIncomingMessages(payload: unknown): ParsedIncomingMessage[] {
  const root = payload as { entry?: Array<{ changes?: Array<{ value?: unknown }> }> };
  if (!root?.entry || !Array.isArray(root.entry)) {
    return [];
  }

  const parsed: ParsedIncomingMessage[] = [];

  for (const entry of root.entry) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const value = change?.value as {
        metadata?: { phone_number_id?: string };
        messages?: Array<{ id?: string; from?: string; text?: { body?: string } }>;
      };

      if (!value?.messages || !Array.isArray(value.messages)) {
        continue;
      }

      for (const msg of value.messages) {
        if (!msg?.id || !msg.from || !value.metadata?.phone_number_id) {
          continue;
        }

        parsed.push({
          external_id: msg.id,
          phone_number_id: value.metadata.phone_number_id,
          from: msg.from,
          text: msg.text?.body,
          raw: msg,
        });
      }
    }
  }

  return parsed;
}