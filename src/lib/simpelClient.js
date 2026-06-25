/**
 * simpelClient.js
 *
 * Proxy client ke database SIMPEL via Edge Function `simpel-proxy`.
 * Menggantikan supabaseSimpelAdmin langsung — service_role tidak lagi di browser.
 */
import { supabase } from "./supabaseClient";

async function invokeProxy(payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("Sesi tidak aktif. Silakan login ulang melalui SIPANDAI.");
  }

  const { data, error } = await supabase.functions.invoke("simpel-proxy", {
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

class SimpelQueryBuilder {
  constructor(table) {
    this._table = table;
    this._action = "select";
    this._select = "*";
    this._filters = [];
    this._or = null;
    this._order = null;
    this._range = null;
    this._head = false;
    this._count = null;
    this._single = false;
    this._maybeSingle = false;
    this._limit = null;
    this._data = null;
    this._upsertOptions = null;
  }

  select(columns, options = {}) {
    this._action = "select";
    this._select = columns;
    if (options.head) this._head = true;
    if (options.count) this._count = options.count;
    return this;
  }

  insert(data) {
    this._action = "insert";
    this._data = data;
    return this;
  }

  update(data) {
    this._action = "update";
    this._data = data;
    return this;
  }

  upsert(data, options = {}) {
    this._action = "upsert";
    this._data = data;
    this._upsertOptions = options;
    return this;
  }

  eq(column, value) {
    this._filters.push({ op: "eq", column, value });
    return this;
  }

  in(column, value) {
    this._filters.push({ op: "in", column, value });
    return this;
  }

  ilike(column, value) {
    this._filters.push({ op: "ilike", column, value });
    return this;
  }

  not(column, operator, value) {
    if (operator === "is") {
      this._filters.push({ op: "not.is", column, value });
    }
    return this;
  }

  gte(column, value) {
    this._filters.push({ op: "gte", column, value });
    return this;
  }

  lte(column, value) {
    this._filters.push({ op: "lte", column, value });
    return this;
  }

  or(expression) {
    this._or = expression;
    return this;
  }

  order(column, options = {}) {
    this._order = { column, ascending: options.ascending ?? true };
    return this;
  }

  range(from, to) {
    this._range = { from, to };
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  _buildPayload() {
    return {
      table: this._table,
      action: this._action,
      select: this._select,
      filters: this._filters,
      or: this._or,
      order: this._order,
      range: this._range,
      head: this._head,
      count: this._count,
      single: this._single,
      maybeSingle: this._maybeSingle,
      limit: this._limit,
      data: this._data,
      upsertOptions: this._upsertOptions,
    };
  }

  async execute() {
    try {
      const result = await invokeProxy(this._buildPayload());
      return { data: result.data, error: null, count: result.count };
    } catch (err) {
      return { data: null, error: err, count: null };
    }
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

/**
 * Drop-in replacement untuk supabaseSimpelAdmin.
 * API kompatibel: .from('employees').select(...).eq(...)
 */
export const supabaseSimpelAdmin = {
  from(table) {
    return new SimpelQueryBuilder(table);
  },
};

export default supabaseSimpelAdmin;
