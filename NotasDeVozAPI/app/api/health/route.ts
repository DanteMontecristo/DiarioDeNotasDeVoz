export const runtime = "nodejs";

export function GET(): Response {
  return Response.json({ ok: true, servidor_ahora: new Date().toISOString() });
}
