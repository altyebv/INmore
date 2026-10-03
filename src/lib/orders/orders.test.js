import { describe, expect, it, vi } from 'vitest';
import { normalizeOrder, placeOrder, toAsciiDigits } from './placeOrder';
import { sendToOps } from './opsTransport';
import { describeDesign } from './describeDesign';

const order = (changes = {}) => ({
  name: ' Amal ',
  mobile: '+974 5555 1234',
  items: [{ sku: 'paper-cup-8oz', quantity: '5,000' }],
  ...changes,
});

const codeOf = (fn) => {
  try {
    fn();
  } catch (error) {
    return error.code;
  }
  return null;
};

describe('normalizeOrder', () => {
  it('trims, parses quantities and leaves optional fields null', () => {
    expect(normalizeOrder(order())).toEqual({
      name: 'Amal',
      mobile: '+974 5555 1234',
      company: null,
      notes: null,
      items: [{ sku: 'paper-cup-8oz', quantity: 5000 }],
    });
  });

  it('reads digits typed on an Arabic keyboard', () => {
    expect(toAsciiDigits('٥٥٥٥١٢٣٤')).toBe('55551234');
    const clean = normalizeOrder(
      order({ mobile: '٥٥٥٥١٢٣٤', items: [{ name: 'Stickers', quantity: '٢٥٠٠' }] })
    );
    expect(clean.mobile).toBe('55551234');
    expect(clean.items[0].quantity).toBe(2500);
  });

  it('defaults an empty quantity to one', () => {
    expect(normalizeOrder(order({ items: [{ name: 'Logo design' }] })).items[0].quantity).toBe(1);
  });

  it('says which part is wrong', () => {
    expect(codeOf(() => normalizeOrder(order({ name: '  ' })))).toBe('name');
    expect(codeOf(() => normalizeOrder(order({ mobile: '12345' })))).toBe('mobile');
    expect(codeOf(() => normalizeOrder(order({ items: [] })))).toBe('items');
    expect(codeOf(() => normalizeOrder(order({ items: [{ quantity: 5 }] })))).toBe('items');
    expect(codeOf(() => normalizeOrder(order({ items: [{ name: 'X', quantity: 'lots' }] })))).toBe(
      'quantity'
    );
    expect(codeOf(() => normalizeOrder(order({ items: [{ name: 'X', quantity: 0 }] })))).toBe(
      'quantity'
    );
  });
});

describe('placeOrder', () => {
  it('sends the cleaned order and returns the request number', async () => {
    const send = vi.fn().mockResolvedValue(1042);
    await expect(placeOrder(order(), send)).resolves.toEqual({ number: 1042 });
    expect(send.mock.calls[0][0].name).toBe('Amal');
  });

  it('sends nothing when the order is invalid', async () => {
    const send = vi.fn();
    await expect(placeOrder(order({ mobile: '' }), send)).rejects.toMatchObject({ code: 'mobile' });
    expect(send).not.toHaveBeenCalled();
  });
});

describe('sendToOps', () => {
  const config = (fetch) => ({ url: 'https://ops.example', key: 'public-key', fetch });

  it('calls the one public function with its parameter names', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => 1042 });
    await expect(sendToOps(normalizeOrder(order()), config(fetch))).resolves.toBe(1042);

    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe('https://ops.example/rest/v1/rpc/create_public_request');
    expect(request.headers.apikey).toBe('public-key');
    expect(JSON.parse(request.body)).toEqual({
      p_customer_name: 'Amal',
      p_phone: '+974 5555 1234',
      p_company: null,
      p_message: null,
      p_items: [{ sku: 'paper-cup-8oz', quantity: 5000 }],
    });
  });

  it('reports a refusal and a dropped connection the same way', async () => {
    const refused = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'A valid phone number is required.' }),
    });
    await expect(sendToOps(normalizeOrder(order()), config(refused))).rejects.toMatchObject({
      code: 'failed',
      detail: 'A valid phone number is required.',
    });

    const offline = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(sendToOps(normalizeOrder(order()), config(offline))).rejects.toMatchObject({
      code: 'failed',
    });
  });

  it('is unavailable until it is configured', async () => {
    await expect(sendToOps(normalizeOrder(order()), { url: '', key: '' })).rejects.toMatchObject({
      code: 'unavailable',
    });
  });
});

describe('describeDesign', () => {
  it('is empty without a design', () => {
    expect(describeDesign(null)).toBe('');
  });

  it('puts a studio payload into words staff can act on', () => {
    const specs = describeDesign({
      sku: 'paper-cup-8oz',
      materials: { body: '#f7f5f1' },
      decorations: [
        {
          type: 'image',
          assetHash: 'logo:final.png:20480:image/png',
          placement: { widthMm: 105.04, xMm: -12, yMm: 4, rotation: 0, repeat: 2 },
        },
        {
          type: 'text',
          assetHash: null,
          text: { content: 'Open\ndaily', fontId: 'rubik', fontSizeMm: 6, color: '#1c1b19' },
          placement: { widthMm: 40, xMm: 0, yMm: 0, rotation: 90, repeat: 1 },
        },
      ],
    });

    expect(specs).toBe(
      [
        'Designed in the website studio.',
        'Stock colour: #f7f5f1',
        'Logo: logo:final.png — 105 mm wide, offset 12 mm left, 4 mm down of centre, repeated ×2',
        'Text: "Open / daily" — rubik, 6 mm type, #1c1b19, 40 mm wide, centred, rotated 90°',
      ].join('\n')
    );
  });

  it('says so when nothing was placed', () => {
    expect(describeDesign({ materials: { body: '#1c1b19' }, decorations: [] })).toContain(
      'No artwork placed.'
    );
  });
});
