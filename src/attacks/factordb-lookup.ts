import type { Attack } from '../types';
import { queryFactorDB } from '../utils/factordb';

const STATUS_DESCRIPTIONS: Record<string, string> = {
  FF: 'Fully factored — all prime factors known',
  CF: 'Composite, factors known — partially factored, not all factors are prime',
  CC: 'Composite, composite factors — factors known but contain composites',
  CP: 'Composite, partially factored — some factors found',
  C: 'Composite, no factors known — confirmed composite but unfactored',
  P: 'Definitely prime — n is proven prime, not a valid RSA modulus',
  Prp: 'Probably prime — strong probable prime, not a valid RSA modulus',
  U: 'Unknown — status undetermined',
  Unit: 'Unit — the number is 1',
  N: 'Not in database — not yet queried',
  '*': 'Added to database during this request',
};

export const attack: Attack = {
  id: 'factordb-lookup',
  name: 'FactorDB Lookup',
  category: 'Advanced',
  description: 'Looks up factorization of n in the FactorDB database. Shows full status with factors when available. Use as the first step for any unknown RSA modulus.',
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
  ],
  frontendCheck: async (vals: Record<string, string>) => {
    const n = (vals.n || '').trim();
    if (!n) return null;
    try {
      const result = await queryFactorDB(n);
      const statusDesc = STATUS_DESCRIPTIONS[result.status] || result.status;
      const lines: string[] = [
        `FactorDB Lookup`,
        `n = ${n}`,
        ``,
        `Results:`,
        `Status: ${result.status} — ${statusDesc}`,
      ];

      if (result.factors && result.factors.length > 0) {
        if (result.status === 'FF' && result.factors.length === 2) {
          const [f0, e0] = result.factors[0];
          const [f1, e1] = result.factors[1];
          let p = BigInt(f0);
          for (let i = 1; i < e0; i++) p *= BigInt(f0);
          let q = BigInt(f1);
          for (let i = 1; i < e1; i++) q *= BigInt(f1);
          lines.push(`p = ${p}`);
          lines.push(`q = ${q}`);
          lines.push(`Verification: p * q = ${p * q}`);
        } else {
          lines.push(`Factors:`);
          for (const [factor, exp] of result.factors) {
            lines.push(exp > 1 ? `  ${factor}^${exp}` : `  ${factor}`);
          }
        }
      }

      lines.push(``);
      lines.push(result.status === 'FF' ? 'FACTORDB_LOOKUP=SUCCESS' : 'FACTORDB_LOOKUP=RESULT');

      return lines.join('\n');
    } catch (e) {
      return `FactorDB Lookup\n\nERROR: ${e instanceof Error ? e.message : String(e)}\n\nFACTORDB_LOOKUP=FAILED`;
    }
  },
  proof: `\\textbf{Theorem:} FactorDB provides instant factorization for any previously factored modulus via a public API.

\\textbf{Setup:}
\\begin{itemize}
\\item Input: RSA modulus $n$ to factor
\\item FactorDB maintains a database of known factorizations
\\item CORS proxy at \`factordb-proxy\` bridges browser-to-API requests
\\end{itemize}

\\textbf{API Mechanism:}
\\begin{itemize}
\\item Query: \`GET /query?n=<hex>\` to factordb.com API
\\item Response contains status (FF = fully factored, CF = composite factors, etc.)
\\item If FF, factors are returned as a list of prime-power pairs
\\item Verification: $\\prod p_i^{e_i} = n$
\\end{itemize}

\\textbf{Status Codes:}
\\begin{itemize}
\\item \\textbf{FF} — Fully factored (all prime factors known)
\\item \\textbf{CF} — Composite, factors known (not all prime)
\\item \\textbf{C} — Composite, no factors known
\\item \\textbf{P} — Definitely prime
\\item \\textbf{Prp} — Probably prime
\\item \\textbf{U} — Unknown status
\\end{itemize}

\\textbf{Explanation:} FactorDB is the internet's largest database of integer factorizations, containing billions of entries. The attack queries FactorDB via a CORS proxy and returns the full status with factors when available. If the modulus has been factored before (common for CTF challenges), the result is instant. The status indicates whether the number is fully factored (FF), partially factored (CF/CP), or unfactored (C/U).

\\textbf{References:} https://factordb.com`,
  priority: 'low',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  // Generate a random 10-digit number (not necessarily semiprime — FactorDB
  // will return whatever status it has for it: FF, C, P, etc.)
  const min = 10_000_000_000; // 10^10
  const max = 99_999_999_999; // 10^11 - 1
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  return { n: String(n) };
};
