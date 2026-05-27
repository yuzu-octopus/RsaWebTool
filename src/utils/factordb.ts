export interface FactorDBResult {
  id: string
  // Known values: "FF" | "CF" | "PRP" | "Composite" | "Unknown"
  status: string
  factors: [string, number][] | null
}

class FactorDBError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "FactorDBError"
    this.status = status
  }
}

let proxyUrl = ""

export function setFactorDBProxy(url: string) {
  proxyUrl = url
}

function powWithBound(base: string | bigint, exp: number, maxExp = 100): bigint {
  if (exp > maxExp) throw new Error(`Exponent ${exp} exceeds maximum ${maxExp}`)
  let result = 1n
  const b = typeof base === 'bigint' ? base : BigInt(base)
  for (let i = 0; i < exp; i++) result *= b
  return result
}

export async function queryFactorDB(
  n: string | bigint,
  corsProxy = proxyUrl,
): Promise<FactorDBResult> {
  const nStr = typeof n === "bigint" ? n.toString() : n
  if (!nStr) throw new FactorDBError("queryFactorDB: n is empty")
  const baseUrl = corsProxy
    ? `${corsProxy}?query=${encodeURIComponent(nStr)}`
    : `https://factordb.com/api?query=${encodeURIComponent(nStr)}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch(baseUrl, { signal: controller.signal })
    if (!res.ok) throw new FactorDBError(`HTTP ${res.status}`, res.status)
    const data: unknown = await res.json()
    if (typeof data !== 'object' || data === null || typeof (data as Record<string, unknown>).id !== 'string') {
      throw new FactorDBError('Invalid FactorDB response format')
    }
    return data as FactorDBResult
  } finally {
    clearTimeout(timeout)
  }
}

export function formatFactorDBResult(result: FactorDBResult): string {
  const lines: string[] = []
  lines.push(`FactorDB Status: ${result.status}`)

  if (result.status === "FF" && result.factors) {
    lines.push("Fully factored!")
    for (const [factor, exp] of result.factors) {
      lines.push(`  ${factor}^${exp}`)
    }
    if (result.factors.length === 2) {
      const p = powWithBound(result.factors[0][0], result.factors[0][1])
      const q = powWithBound(result.factors[1][0], result.factors[1][1])
      lines.push(`p = ${p}`)
      lines.push(`q = ${q}`)
    }
  } else if (result.status === "CF" && result.factors) {
    lines.push("Partially factored:")
    for (const [factor, exp] of result.factors) {
      lines.push(`  ${factor}^${exp}`)
    }
  } else {
    lines.push("No factors found")
  }

  return lines.join("\n")
}

/**
 * Report factors to FactorDB for a given number.
 * If corsProxy is set, POSTs JSON { number, factors } to ${corsProxy}/report.
 * Otherwise POSTs form-encoded data directly to factordb.com/reportfactor.php.
 */
export async function reportFactor(
  number: string,
  factors: string[],
  corsProxy = proxyUrl,
): Promise<string> {
  if (!number) throw new FactorDBError("reportFactor: number is empty")
  if (!Array.isArray(factors) || factors.length === 0) throw new FactorDBError("reportFactor: factors array is empty")
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
 
  try {
    if (corsProxy) {
      const url = `${corsProxy}/report`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, factors }),
        signal: controller.signal,
      })
      if (!res.ok) throw new FactorDBError(`HTTP ${res.status}`, res.status)
      return res.text()
    }

    const params = new URLSearchParams()
    params.set("number", number)
    for (const factor of factors) {
      params.append("factor", factor)
    }
    const res = await fetch("https://factordb.com/reportfactor.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: controller.signal,
    })
    if (!res.ok) throw new FactorDBError(`HTTP ${res.status}`, res.status)
    return res.text()
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Extract p and q from a SageMath stdout string that contains
 * `p = <digits>` and `q = <digits>` on their own lines.
 * Returns null if either p or q is missing.
 */
export function extractPQ(output: string): { p: string; q: string } | null {
  const pMatch = output.match(/^p\s*=\s*(\d+)\s*$/m)
  const qMatch = output.match(/^q\s*=\s*(\d+)\s*$/m)
  if (!pMatch || !qMatch) return null
  return { p: pMatch[1], q: qMatch[1] }
}
