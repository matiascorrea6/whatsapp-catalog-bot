// HTTP server: receives the WhatsApp webhook, answers and notifies the team on handoffs.
import express from 'express';
import { loadCatalog } from './catalog.js';
import { answer } from './bot.js';
import { readMessages, sendText } from './whatsapp.js';

const config = {
  port: process.env.PORT || 3000,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  token: process.env.WHATSAPP_TOKEN,
  teamPhone: process.env.TEAM_PHONE, // where handoff alerts go
};

const business = {
  name: process.env.BUSINESS_NAME || 'la tienda',
  shipping: 'Hacemos envíos a todo el país. El costo depende de la zona: pasame tu código postal y te lo confirmo.',
  hours: 'Atendemos de lunes a viernes de 10 a 19 y sábados de 10 a 14.',
  payments: 'Podés pagar en hasta 6 cuotas sin interés con tarjeta, o con descuento en efectivo o transferencia.',
};

const catalog = loadCatalog(new URL('../data/catalog.csv', import.meta.url));
const app = express();
app.use(express.json());

// Meta calls this once to verify the webhook.
app.get('/webhook', (req, res) => {
  const ok = req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.verifyToken;
  return ok ? res.send(req.query['hub.challenge']) : res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // answer Meta right away; the work continues below
  for (const msg of readMessages(req.body)) {
    try {
      const { reply, handoff } = answer(msg.text, catalog, business);
      await sendText(config, msg.from, reply);
      if (handoff && config.teamPhone) {
        await sendText(config, config.teamPhone, `Consulta para el equipo de ${msg.name || msg.from} (+${msg.from}): «${msg.text}»`);
      }
    } catch (err) {
      console.error('Could not answer', msg.from, err.message);
    }
  }
});

app.get('/health', (_req, res) => res.json({ ok: true, products: catalog.length }));

app.listen(config.port, () => console.log(`Bot listening on port ${config.port}`));
