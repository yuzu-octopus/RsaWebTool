export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    }

    // Handle CORS preflight immediately — no fetch needed
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const query = url.searchParams.get("query")
    const id = url.searchParams.get("id")

    if (!query && !id) {
      return new Response("Usage: ?query=<number> or ?id=<id>", {
        status: 400,
        headers: corsHeaders,
      })
    }

    const target = new URL("https://factordb.com/api")
    if (query) target.searchParams.set("query", query)
    if (id) target.searchParams.set("id", id)

    const resp = await fetch(target.toString(), {
      headers: { Accept: "application/json" },
    })

    const body = await resp.text()

    return new Response(body, {
      status: resp.status,
      headers: corsHeaders,
    })
  },
}
