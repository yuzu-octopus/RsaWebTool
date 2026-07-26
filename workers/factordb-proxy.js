export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store",
    }

    const reportCorsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "text/plain",
    }

    // Handle CORS preflight immediately — no fetch needed
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders })
    }

    // Reject unsupported HTTP methods
    if (!["GET", "POST"].includes(request.method)) {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
      })
    }

    const url = new URL(request.url)

    // POST /report — submit factors to FactorDB
    if (request.method === "POST" && url.pathname === "/report") {
      let body
      try {
        body = await request.json()
      } catch {
        return new Response("Invalid JSON body", { status: 400, headers: reportCorsHeaders })
      }

      if (!body.factors || !Array.isArray(body.factors) || body.factors.length === 0) {
        return new Response("Missing or invalid 'factors' array", { status: 400, headers: reportCorsHeaders })
      }

      if (!body.number && !body.id) {
        return new Response("Missing 'number' or 'id' field", { status: 400, headers: reportCorsHeaders })
      }

      const formData = new URLSearchParams()
      if (body.number) formData.set("number", String(body.number))
      if (body.id) formData.set("id", String(body.id))
      for (const f of body.factors) {
        // Validate factor value before appending — must be numeric
        const isValid = typeof f === "number" || (typeof f === "string" && /^\d+$/.test(f))
        if (!isValid) {
          console.warn(`Skipping invalid factor value: ${f}`)
          continue
        }
        formData.append("factor", String(f))
      }

      try {
        const resp = await fetch("https://factordb.com/reportfactor.php", {
          method: "POST",
          body: formData.toString(),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })

        const text = await resp.text()

        return new Response(text, {
          status: resp.status,
          headers: reportCorsHeaders,
        })
      } catch (err) {
        return new Response(JSON.stringify({ error: "Upstream fetch failed", detail: err.message }), {
          status: 502,
          headers: { ...reportCorsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    const query = url.searchParams.get("query")
    const id = url.searchParams.get("id")

    const queryErrorHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "text/plain",
    }

    if (!query && !id) {
      return new Response("Usage: ?query=<number> or ?id=<id>", {
        status: 400,
        headers: queryErrorHeaders,
      })
    }

    const target = new URL("https://factordb.com/api")
    if (query) target.searchParams.set("query", query)
    if (id) target.searchParams.set("id", id)

    try {
      const resp = await fetch(target.toString(), {
        headers: { Accept: "application/json" },
      })

      const body = await resp.text()

      // Only cache successful responses — error responses get no-cache
      const cacheControl = resp.status === 200 ? "public, max-age=3600" : "no-cache, no-store"

      return new Response(body, {
        status: resp.status,
        headers: { ...corsHeaders, "Cache-Control": cacheControl },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: "Upstream fetch failed", detail: err.message }), {
        status: 502,
        headers: { ...corsHeaders, "Cache-Control": "no-cache, no-store" },
      })
    }
  },
}
