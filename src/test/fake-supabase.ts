// 테스트용 가짜 Supabase 클라이언트.
// supabase-js의 체이닝 쿼리(from().select().eq()…)를 흉내 내고, 호출 기록을 남긴다.
// 응답은 "테이블.동작" 키로 미리 정해둔다: { "bookings.insert": { data, error } }

type Result = { data?: unknown; error?: { message: string; code?: string } | null };
export type Call = { table: string; op: string; args: unknown[]; filters: [string, unknown[]][] };

export function fakeSupabase(opts: {
  user?: { id: string; user_metadata?: Record<string, unknown> } | null;
  responses?: Record<string, Result>;
  rpc?: Record<string, Result>;
  exchangeError?: { message: string } | null;
}) {
  const calls: Call[] = [];
  const rpcCalls: { fn: string; args: unknown }[] = [];
  const respond = (key: string): Result => ({ data: null, error: null, ...(opts.responses?.[key] ?? {}) });

  function builder(table: string) {
    let op = "select";
    const call: Call = { table, op, args: [], filters: [] };
    calls.push(call);
    const b = {
      select: (...a: unknown[]) => {
        if (call.op === "select") call.args = a; // insert().select() 는 동작을 insert로 유지
        return b;
      },
      insert: (...a: unknown[]) => ((op = call.op = "insert"), (call.args = a), b),
      update: (...a: unknown[]) => ((op = call.op = "update"), (call.args = a), b),
      upsert: (...a: unknown[]) => ((op = call.op = "upsert"), (call.args = a), b),
      delete: () => ((op = call.op = "delete"), b),
      eq: (...a: unknown[]) => (call.filters.push(["eq", a]), b),
      gte: (...a: unknown[]) => (call.filters.push(["gte", a]), b),
      order: (...a: unknown[]) => (call.filters.push(["order", a]), b),
      limit: () => b,
      maybeSingle: () => Promise.resolve(respond(`${table}.${op}`)),
      single: () => Promise.resolve(respond(`${table}.${op}`)),
      then: (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(respond(`${table}.${op}`)).then(resolve, reject),
    };
    return b;
  }

  const client = {
    from: (table: string) => builder(table),
    rpc: (fn: string, args: unknown) => {
      rpcCalls.push({ fn, args });
      return Promise.resolve({ data: null, error: null, ...(opts.rpc?.[fn] ?? {}) });
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: opts.user ?? null } }),
      exchangeCodeForSession: () => Promise.resolve({ error: opts.exchangeError ?? null }),
    },
  };
  return { client, calls, rpcCalls };
}

export function jsonRequest(url: string, body: unknown, init: RequestInit = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    body: JSON.stringify(body),
  });
}
