import OrderError from './OrderError';
import { sendToOps } from './opsTransport';

/**
 * Placing an order.
 *
 * The one function pages call. It knows what a valid order is and nothing
 * about where orders go — that is the transport's business — so the form, the
 * studio and anything added later all place orders the same way.
 *
 * There are no accounts: the mobile number is the customer's identity, as it
 * is everywhere else in the business.
 *
 * @typedef {Object} OrderItem
 * @property {string} [sku]     A product id from the catalogue.
 * @property {string} [name]    What it is, when there is no sku or to be specific.
 * @property {string|number} [quantity]
 * @property {string} [specs]   Anything staff need to make it — see describeDesign.
 *
 * @typedef {Object} Order
 * @property {string} name
 * @property {string} mobile
 * @property {string} [company]
 * @property {string} [notes]
 * @property {OrderItem[]} items
 *
 * @typedef {Order & { items: (OrderItem & { quantity: number })[] }} CleanOrder
 */

const MAX_ITEMS = 20;

/** Arabic-Indic and Persian digits as typed on an Arabic keyboard, to 0-9. */
export function toAsciiDigits(value) {
  return String(value ?? '').replace(/[٠-٩۰-۹]/g, (d) =>
    String(d.charCodeAt(0) & 0xf)
  );
}

const text = (value, max) => String(value ?? '').trim().slice(0, max);

function cleanQuantity(value) {
  const typed = toAsciiDigits(value).replace(/[\s,٬]/g, '');
  if (typed === '') return 1;
  const quantity = Number(typed);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 999999999) {
    throw new OrderError('quantity');
  }
  return Math.round(quantity * 100) / 100;
}

/**
 * Check an order and put it in the shape the transport sends.
 *
 * The server checks all of this again; doing it here means the visitor is told
 * what is wrong in their own language, before anything is sent.
 *
 * @param {Order} order
 * @returns {CleanOrder}
 */
export function normalizeOrder(order) {
  const name = text(order?.name, 120);
  if (!name) throw new OrderError('name');

  const mobile = toAsciiDigits(text(order?.mobile, 30));
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) throw new OrderError('mobile');

  const items = (order?.items ?? []).map((item) => {
    const sku = text(item.sku, 60);
    const itemName = text(item.name, 120);
    if (!sku && !itemName) throw new OrderError('items');
    return {
      ...(sku && { sku }),
      ...(itemName && { name: itemName }),
      quantity: cleanQuantity(item.quantity),
      ...(text(item.specs, 2000) && { specs: text(item.specs, 2000) }),
    };
  });
  if (items.length === 0 || items.length > MAX_ITEMS) throw new OrderError('items');

  return {
    name,
    mobile,
    company: text(order.company, 120) || null,
    notes: text(order.notes, 2000) || null,
    items,
  };
}

/**
 * @param {Order} order
 * @param {(order: CleanOrder) => Promise<number>} [send]
 * @returns {Promise<{ number: number }>}
 */
export async function placeOrder(order, send = sendToOps) {
  const number = await send(normalizeOrder(order));
  return { number };
}

export default placeOrder;
