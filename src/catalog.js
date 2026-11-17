// Loads the product catalog from a CSV file and finds products by name.
// CSV columns: name,brand,size,price,cash_price,stock
import { readFileSync } from 'node:fs';

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseCatalog(csv) {
  const [header, ...rows] = csv.trim().split(/\r?\n/);
  const columns = header.split(',').map((c) => c.trim());
  return rows
    .filter((row) => row.trim())
    .map((row) => {
      const values = row.split(',').map((v) => v.trim());
      const item = Object.fromEntries(columns.map((c, i) => [c, values[i] ?? '']));
      return {
        name: item.name,
        brand: item.brand,
        size: item.size,
        price: Number(item.price),
        cashPrice: Number(item.cash_price) || null,
        stock: Number(item.stock),
        key: normalize(item.name),
      };
    });
}

export function loadCatalog(path) {
  return parseCatalog(readFileSync(path, 'utf8'));
}

// Returns the products whose full name appears in the message.
// Longer names win, so "club de nuit intense" beats "club de nuit".
export function findProducts(catalog, message) {
  const text = ` ${normalize(message)} `;
  const found = catalog
    .filter((p) => text.includes(` ${p.key} `))
    .sort((a, b) => b.key.length - a.key.length);
  return found.filter((p) => !found.some((q) => q !== p && q.key.includes(p.key)));
}
