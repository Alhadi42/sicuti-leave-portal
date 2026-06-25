/**
 * simpel-proxy — Server-side proxy ke database SIMPEL
 *
 * Service role SIMPEL hanya ada di server. Frontend memanggil endpoint ini
 * dengan session SiCuti (Bearer JWT) yang sudah divalidasi.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

type AppRole = "admin_pusat" | "admin_pimpinan" | "admin_unit" | "employee";

interface QueryPayload {
  table: string;
  action: "select" | "insert" | "update" | "upsert";
  select?: string;
  filters?: Array<{ op: string; column: string; value: unknown }>;
  or?: string;
  order?: { column: string; ascending?: boolean };
  range?: { from: number; to: number };
  head?: boolean;
  count?: "exact" | "planned" | "estimated";
  single?: boolean;
  maybeSingle?: boolean;
  limit?: number;
  data?: unknown;
  upsertOptions?: { onConflict?: string };
}

const READ_TABLES = new Set(["employees", "profiles", "user_roles"]);
const WRITE_TABLES = new Set(["profiles", "user_roles"]);

function getUserMeta(claims: Record<string, unknown>) {
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  return {
    role: (meta.role as AppRole) || "employee",
    department: (meta.department as string) || null,
    employee_id: (meta.employee_id as string) || null,
    userId: claims.sub as string,
  };
}

function assertTableAccess(table: string, action: string, role: AppRole) {
  if (action === "select" && READ_TABLES.has(table)) return;
  if (WRITE_TABLES.has(table) && action !== "select") {
    if (role === "admin_pusat") return;
    throw new Error("Akses ditolak: hanya Admin Pusat yang dapat mengubah data SIMPEL");
  }
  throw new Error(`Akses ditolak ke tabel ${table}`);
}

function applyAuthFilters(
  table: string,
  role: AppRole,
  department: string | null,
  employeeId: string | null,
  query: ReturnType<ReturnType<typeof createClient>["from"]>,
) {
  if (table !== "employees") return query;

  if (role === "admin_unit" && department) {
    return query.eq("department", department);
  }
  if (role === "employee" && employeeId) {
    return query.eq("id", employeeId);
  }
  return query;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const sicutiUrl = Deno.env.get("SUPABASE_URL")!;
    const sicutiAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const sicutiClient = createClient(sicutiUrl, sicutiAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: claimsData, error: claimsError } =
      await sicutiClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Token tidak valid" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { role, department, employee_id, userId } = getUserMeta(
      claimsData.claims as Record<string, unknown>,
    );

    const payload = (await req.json()) as QueryPayload;
    assertTableAccess(payload.table, payload.action, role);

    const simpelUrl = Deno.env.get("SIMPEL_URL")!;
    const simpelServiceKey = Deno.env.get("SIMPEL_SERVICE_ROLE_KEY")!;
    const simpelAdmin = createClient(simpelUrl, simpelServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (payload.action === "select") {
      let query = simpelAdmin
        .from(payload.table)
        .select(payload.select ?? "*", {
          count: payload.count,
          head: payload.head,
        });

      query = applyAuthFilters(
        payload.table,
        role,
        department,
        employee_id,
        query,
      );

      for (const f of payload.filters ?? []) {
        switch (f.op) {
          case "eq":
            query = query.eq(f.column, f.value);
            break;
          case "in":
            query = query.in(f.column, f.value as unknown[]);
            break;
          case "ilike":
            query = query.ilike(f.column, f.value as string);
            break;
          case "not.is":
            query = query.not(f.column, "is", f.value);
            break;
          case "gte":
            query = query.gte(f.column, f.value);
            break;
          case "lte":
            query = query.lte(f.column, f.value);
            break;
        }
      }

      if (payload.or) query = query.or(payload.or);
      if (payload.order) {
        query = query.order(payload.order.column, {
          ascending: payload.order.ascending ?? true,
        });
      }
      if (payload.range) {
        query = query.range(payload.range.from, payload.range.to);
      }
      if (payload.limit) query = query.limit(payload.limit);

      const result = payload.single
        ? await query.single()
        : payload.maybeSingle
          ? await query.maybeSingle()
          : await query;

      if (result.error) throw result.error;

      return new Response(
        JSON.stringify({
          data: result.data,
          count: result.count ?? null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (payload.action === "insert") {
      const { data, error } = await simpelAdmin
        .from(payload.table)
        .insert(payload.data)
        .select();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.action === "update") {
      let query = simpelAdmin.from(payload.table).update(payload.data);
      for (const f of payload.filters ?? []) {
        if (f.op === "eq") query = query.eq(f.column, f.value);
      }
      const { data, error } = await query.select();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.action === "upsert") {
      const { data, error } = await simpelAdmin
        .from(payload.table)
        .upsert(payload.data, payload.upsertOptions ?? {})
        .select();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action tidak didukung" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    console.error("[simpel-proxy]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
