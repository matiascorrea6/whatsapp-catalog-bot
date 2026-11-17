// Decides what to answer to a customer message.
// Returns { reply, handoff }: handoff = true means a person from the team must take the chat.
import { findProducts, normalize } from './catalog.js';

const money = (n) => '$' + Math.round(n).toLocaleString('es-AR');

const HANDOFF_WORDS = ['reclamo', 'queja', 'hablar con alguien', 'una persona', 'humano', 'devolucion', 'cambio'];
const GREETING_WORDS = ['hola', 'buenas', 'buen dia', 'buenas tardes', 'buenas noches'];

export function describeProduct(p) {
  const name = `${p.brand} ${p.name} ${p.size}`;
  if (p.stock <= 0) return `${name}: hoy no tenemos stock.`;
  const cash = p.cashPrice ? ` o ${money(p.cashPrice)} en efectivo o transferencia` : '';
  return `${name}: ${money(p.price)} en hasta 6 cuotas sin interés${cash}.`;
}

export function answer(message, catalog, business) {
  const text = normalize(message);

  if (!text) {
    return { reply: 'Recibí tu mensaje. Si me lo escribís, te respondo al instante.', handoff: false };
  }

  if (HANDOFF_WORDS.some((w) => text.includes(w))) {
    return { reply: 'Te paso con alguien del equipo, que te responde por acá en un rato.', handoff: true };
  }

  const products = findProducts(catalog, text);
  if (products.length) {
    const lines = products.slice(0, 3).map(describeProduct);
    const allOut = products.every((p) => p.stock <= 0);
    const closing = allOut ? '¿Querés que te recomiende algo parecido?' : '¿Te lo separo?';
    return { reply: `${lines.join('\n')}\n${closing}`, handoff: false };
  }

  if (/\b(envio|envios|envian|mandan)\b/.test(text)) {
    return { reply: business.shipping, handoff: false };
  }

  if (/\b(horario|horarios|abren|atienden|direccion|donde)\b/.test(text)) {
    return { reply: business.hours, handoff: false };
  }

  if (/\b(pago|pagos|cuotas|tarjeta|transferencia|efectivo)\b/.test(text)) {
    return { reply: business.payments, handoff: false };
  }

  if (GREETING_WORDS.some((w) => text.startsWith(w))) {
    return { reply: `¡Hola! Soy el asistente de ${business.name}. Preguntame por un producto, precios, envíos o formas de pago.`, handoff: false };
  }

  // Nothing matched: a person answers instead of guessing.
  return { reply: 'Esa te la responde alguien del equipo. Ya le paso tu consulta.', handoff: true };
}
