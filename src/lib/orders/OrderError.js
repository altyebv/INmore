/**
 * Why an order did not go through.
 *
 * `code` is a key into the page's `errors` copy, never a sentence: the visitor
 * reads the message in their own language, and whatever the server said goes
 * in `detail` for the console.
 *
 * Codes: 'name' | 'mobile' | 'items' | 'quantity' | 'unavailable' | 'failed'.
 */
export class OrderError extends Error {
  constructor(code, detail) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'OrderError';
    this.code = code;
    this.detail = detail;
  }
}

export default OrderError;
