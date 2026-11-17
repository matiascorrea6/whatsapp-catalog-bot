import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCatalog, findProducts } from '../src/catalog.js';
import { answer } from '../src/bot.js';
import { readMessages } from '../src/whatsapp.js';

const catalog = parseCatalog(`name,brand,size,price,cash_price,stock
Club de Nuit,Armaf,105 ml,98000,74000,3
Club de Nuit Intense Man,Armaf,100 ml,105000,79000,6
Odyssey Mandarin,Armaf,100 ml,105000,79000,0`);

const business = { name: 'Tienda Demo', shipping: 'ENVIOS', hours: 'HORARIOS', payments: 'PAGOS' };

test('finds a product even with accents and capital letters', () => {
  const found = findProducts(catalog, '¿Tenés el ODYSSEY mandarín?');
  assert.equal(found.length, 1);
  assert.equal(found[0].name, 'Odyssey Mandarin');
});

test('the longest name wins over a shorter one it contains', () => {
  const found = findProducts(catalog, 'cuanto sale el club de nuit intense man');
  assert.deepEqual(found.map((p) => p.name), ['Club de Nuit Intense Man']);
});

test('answers the price with both payment options', () => {
  const { reply, handoff } = answer('precio del club de nuit intense man', catalog, business);
  assert.match(reply, /\$105\.000/);
  assert.match(reply, /\$79\.000 en efectivo/);
  assert.equal(handoff, false);
});

test('says when a product is out of stock', () => {
  const { reply } = answer('hay odyssey mandarin?', catalog, business);
  assert.match(reply, /no tenemos stock/);
});

test('answers shipping, hours and payments from the business data', () => {
  assert.equal(answer('hacen envios?', catalog, business).reply, 'ENVIOS');
  assert.equal(answer('a que hora abren', catalog, business).reply, 'HORARIOS');
  assert.equal(answer('aceptan transferencia', catalog, business).reply, 'PAGOS');
});

test('hands off complaints and anything it does not understand', () => {
  assert.equal(answer('quiero hacer un reclamo', catalog, business).handoff, true);
  assert.equal(answer('tienen gift cards de otra marca para empresas', catalog, business).handoff, true);
});

test('reads text messages from a WhatsApp webhook payload', () => {
  const body = { entry: [{ changes: [{ value: {
    contacts: [{ wa_id: '5491100000000', profile: { name: 'Lucía' } }],
    messages: [{ from: '5491100000000', type: 'text', text: { body: 'Hola' } }],
  } }] }] };
  assert.deepEqual(readMessages(body), [{ from: '5491100000000', name: 'Lucía', text: 'Hola' }]);
});
