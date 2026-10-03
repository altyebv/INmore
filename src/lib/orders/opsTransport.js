import OrderError from './OrderError';

/**
 * Where an order goes: INMORE's operations system.
 *
 * The operations database exposes exactly one thing to the public — the
 * `create_public_request` function — and this file is the only place on the
 * site that knows its name or its parameters. It is called over plain REST, so
 * the site carries no database client for the sake of one request.
 *
 * Replacing the destination (an edge function with a rate limit in front, a
 * different backend entirely) means replacing this file and nothing else.
 */
const URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const KEY = import.meta.env.VITE_SUPABASE_KEY ?? '';

/** False until both values are set, so the page can say so instead of failing. */
export const isConfigured = Boolean(URL && KEY);

/**
 * @param {import('./placeOrder').CleanOrder} order
 * @param {{ url?: string, key?: string, fetch?: typeof fetch }} [config]
 * @returns {Promise<number>} The request number staff will see.
 */
export async function sendToOps(order, { url = URL, key = KEY, fetch = globalThis.fetch } = {}) {
  if (!url || !key) throw new OrderError('unavailable');

  let response;
  try {
    response = await fetch(`${url}/rest/v1/rpc/create_public_request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify({
        p_customer_name: order.name,
        p_phone: order.mobile,
        p_company: order.company,
        p_message: order.notes,
        p_items: order.items,
      }),
    });
  } catch (error) {
    throw new OrderError('failed', error.message);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new OrderError('failed', body?.message ?? `HTTP ${response.status}`);
  }

  return response.json();
}

export default sendToOps;
