export const Validators = Object.freeze({
  required(value, field) {
    if (value === null || value === undefined || String(value).trim() === '') {
      throw new Error(`${field} is required`);
    }
    return value;
  },

  money(value, field = 'amount') {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw new Error(`${field} must be a valid non-negative amount`);
    return n;
  },

  positiveMoney(value, field = 'amount') {
    const n = Validators.money(value, field);
    if (n <= 0) throw new Error(`${field} must be greater than zero`);
    return n;
  },

  quantity(value, field = 'quantity') {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) throw new Error(`${field} must be a non-negative integer`);
    return n;
  },

  date(value, field = 'date') {
    if (value === undefined || value === null || value === '') return null;
    const s = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`${field} must use YYYY-MM-DD`);
    return s;
  }
});
