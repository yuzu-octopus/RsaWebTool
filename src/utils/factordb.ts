export interface FactorDBResult {
  id: string
  status: "FF" | "CF" | "PRP" | "Composite" | "Unknown" | string
  factors: [string, number][] | null
}

export class FactorDBError extends Error {
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

export async function queryFactorDB(
  n: string | bigint,
  corsProxy = proxyUrl,
): Promise<FactorDBResult> {
  const nStr = typeof n === "bigint" ? n.toString() : n
  const baseUrl = corsProxy
    ? `${corsProxy}?query=${encodeURIComponent(nStr)}`
    : `https://factordb.com/api?query=${encodeURIComponent(nStr)}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(baseUrl, { signal: controller.signal })
    if (!res.ok) throw new FactorDBError(`HTTP ${res.status}`, res.status)
    return res.json()
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
      const p = BigInt(result.factors[0][0]) ** BigInt(result.factors[0][1])
      const q = BigInt(result.factors[1][0]) ** BigInt(result.factors[1][1])
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
