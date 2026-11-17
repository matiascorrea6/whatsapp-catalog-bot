// Minimal client for the WhatsApp Cloud API (Meta Graph API).
const GRAPH_URL = 'https://graph.facebook.com/v21.0';

// Extracts the text messages from a webhook payload.
export function readMessages(body) {
  const messages = [];
  for (const entry of body?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      for (const m of value.messages ?? []) {
        messages.push({
          from: m.from,
          name: value.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? '',
          text: m.type === 'text' ? m.text.body : '',
        });
      }
    }
  }
  return messages;
}

export async function sendText({ phoneNumberId, token }, to, body) {
  const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
}
