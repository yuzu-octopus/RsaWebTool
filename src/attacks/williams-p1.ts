import type { Attack } from '../types';
import { randomPrime, isPrimeMR, TESTCASE_BITS } from '../utils/testcases/core';

export const attack: Attack = {
  id: 'williams-p1',
  name: "Williams' p+1 Method",
  category: 'Factorization',
  description: "Factors n when p+1 is B1-smooth using Lucas sequences V_k(P,1). Stage 2 extends to handle one larger prime factor beyond B1. Use when Pollard p-1 fails.",
  inputs: [
    { name: 'n', label: 'n (modulus)', placeholder: 'Enter modulus n...', multiline: true, rows: 3 },
    { name: 'B', label: 'B1 (stage 1 bound, optional)', placeholder: '10000', required: false, multiline: false },
    { name: 'B2', label: 'B2 (stage 2 bound, optional)', placeholder: '0 (disabled)', required: false, multiline: false },
  ],
  sageTemplate: (vals: Record<string, string>) => `def _attack():
    try:
        n = Integer(${vals.n})
        #
        # Handle B1 parameter: default to 10000 if not provided or invalid
        try:
            B1 = Integer(${vals.B || '10000'})
            if B1 < 2:
                B1 = 10000
        except:
            B1 = 10000
        #
        # Handle B2 parameter: default to 0 (disabled) if not provided or invalid
        try:
            B2 = Integer(${vals.B2 || '0'})
            if B2 < 0:
                B2 = 0
        except:
            B2 = 0
        #
        out = []
        out.append(f"Williams' p+1 method on n = {n}")
        out.append(f"Initial B1 = {B1}")
        out.append(f"Initial B2 = {B2}")
        out.append("")
        #
        # Check for trivial cases
        if n < 2:
            out.append(f"n = {n} is too small to factor")
            out.append("WILLIAMS_P1=FAILED")
            print("\\n".join(out))
            return
        if n % 2 == 0:
            out.append(f"n is even: {n}")
            out.append(f"p = 2")
            out.append(f"q = {n // 2}")
            out.append(f"Verification: 2 * {n // 2} = {n}")
            out.append("WILLIAMS_P1=SUCCESS")
            print("\\n".join(out))
            return
        if n.is_prime():
            out.append(f"n is prime: {n}")
            out.append("No factorization possible")
            out.append("WILLIAMS_P1=FAILED")
            print("\\n".join(out))
            return
        if n.is_square():
            p = isqrt(n)
            out.append(f"n is a perfect square: {p}^2 = {n}")
            out.append(f"Verification: p * q = {p * p}")
            out.append(f"p = {p}")
            out.append(f"q = {p}")
            out.append("")
            out.append("WILLIAMS_P1=SUCCESS")
            print("\\n".join(out))
            return
        #
        # Williams' p+1 using Lucas sequences with two-stage
        # V_k(P, Q) where Q = 1, V_0 = 2, V_1 = P, V_k = P * V_{k-1} - V_{k-2}
        # Stage 1: compute V_M(P, 1) where M = lcm(1..B1) using binary exponentiation
        # Stage 2: iterate V_{k*M} for k=B1..B2 using recurrence V_{(k+1)*M} = V_{k*M} * V_M - V_{(k-1)*M}
        def lucas_V(k, P, n):
            if k == 0:
                return 2 % n
            if k == 1:
                return P % n
            result = 2 % n   # V_0
            result1 = P % n  # V_1
            bits = k.digits(2)  # LSB-first list of binary digits
            # Binary ladder: maintain (V_j, V_{j+1}) invariant, process MSB first
            for bit in reversed(bits):
                V2j = (result**2 - 2) % n          # V_{2j} = V_j**2 - 2 (Q=1)
                V2j1 = (result * result1 - P) % n   # V_{2j+1} = V_j * V_{j+1} - P (Q=1)
                result, result1 = V2j, V2j1
                if bit == 1:
                    # Advance: (V_{2j}, V_{2j+1}) → (V_{2j+1}, V_{2j+2})
                    # V_{2j+2} = P * V_{2j+1} - V_{2j} via recurrence V_k = P*V_{k-1} - V_{k-2}
                    V2j2 = (P * result1 - result) % n
                    result, result1 = result1, V2j2
            return result
        #
        def williams_p1_stage(n, B1, B2, P, stage1_primes, stage2_primes):
            M = 1
            for p in stage1_primes:
                pp = p
                while pp * p <= B1:
                    pp *= p
                M *= pp
            VM = lucas_V(M, P, n)
            g = gcd(VM - 2, n)
            if 1 < g < n:
                return g
            if B2 > B1:
                V_curr = VM
                V_prev = 2
                # Advance from k=2 to k=B1 (no GCD checks — pure recurrence)
                for k in range(2, B1 + 1):
                    V_next = (V_curr * VM - V_prev) % n
                    V_prev, V_curr = V_curr, V_next
                # Now check primes in Stage 2
                for k in range(B1 + 1, B2 + 1):
                    V_next = (V_curr * VM - V_prev) % n
                    V_prev, V_curr = V_curr, V_next
                    g = gcd(V_curr - 2, n)
                    if 1 < g < n:
                        return Integer(g)
            return None
        #
        # Build bound configurations: original + auto-escalation
        B1_orig = B1
        B2_orig = B2
        if B1_orig == 10000 and B2_orig == 0:
            configs = [
                (100, 1000),
                (1000, 10000),
                (10000, 50000)     # capped at 50k to avoid SageMathCell timeout
            ]
        else:
            configs = [(B1_orig, B2_orig)]
            if B2_orig > 0:
                configs.append((B1_orig * 10, B2_orig * 10))
            else:
                configs.append((B1_orig * 10, 0))
                configs.append((B1_orig * 10, B1_orig * 100))
        #
        try:
            found = False
            for attempt, (B1_cur, B2_cur) in enumerate(configs):
                if attempt > 0:
                    retry_msg = f"Retry #{attempt}: B1 = {B1_cur}"
                    if B2_cur > 0:
                        retry_msg += f", B2 = {B2_cur}"
                    out.append(retry_msg)
                # Cache prime lists per config (avoid recomputation per P value)
                stage1_primes = prime_range(B1_cur + 1)
                stage2_primes = prime_range(max(3, B1_cur+1), B2_cur + 1) if B2_cur > B1_cur else []
                for P in range(3, 8):
                    g = williams_p1_stage(n, B1_cur, B2_cur, P, stage1_primes, stage2_primes)
                    if g is not None:
                        p = Integer(g)
                        q = n // g
                        out.append(f"Factor found with P = {P}!")
                        out.append(f"Verification: p * q = {p * q}")
                        out.append(f"p = {p}")
                        out.append(f"q = {q}")
                        found = True
                        break
                if found:
                    break
            if not found:
                out.append("Williams' p+1 failed. p+1 may not be B1-smooth for tested P values.")
                out.append("Try increasing B1, enabling stage 2 with B2 > B1, or using a different method.")
                out.append("")
                out.append("WILLIAMS_P1=FAILED")
            else:
                out.append("")
                out.append("WILLIAMS_P1=SUCCESS")
            print("\\n".join(out))
        except Exception as ex:
            out.append(f"Williams' p+1 error: {ex}")
            out.append("WILLIAMS_P1=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        out.append(f"ERROR: {ex}")
        out.append("WILLIAMS_P1=FAILED")
        print("\\n".join(out))
_attack()`,
  proof: `\\textbf{Theorem:} If $p+1$ is $B1$-smooth, then $p$ can be found via Lucas sequences $V_k(P,1)$. Stage 2 extends the smoothness bound to $B2$.

\\textbf{Setup:}
\\begin{itemize}
\\item Lucas sequences $V_k(P,1) = \\alpha^k + \\alpha^{-k}$ where $\\alpha + \\alpha^{-1} = P$
\\item $(D/p) = -1$ where $D = P^2 - 4$, implying $\\alpha^{p+1} \\equiv 1 \\pmod{p}$
\\item $M = \\operatorname{lcm}(1, 2, \\ldots, B1)$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Choose } P: \\; D &= P^2 - 4, \\quad (D/p) = -1 \\\\
p+1 &\\mid M \\implies \\alpha^M \\equiv 1 \\pmod{p} \\\\
V_M &= \\alpha^M + \\alpha^{-M} \\equiv 2 \\pmod{p} \\\\
\\gcd(V_M - 2, n) &= p \\\\
\\text{Stage 2: } p+1 &= q \\cdot s,\\; s \\mid M,\\; q \\in (B1, B2] \\\\
\\text{Check } \\gcd(V_{qM} - 2, n) &\\text{ via recurrence } V_{(k+1)M} = V_{kM}V_M - V_{(k-1)M}
\\end{align*}

\\textbf{Explanation:} Like Pollard's p-1 but for factors where $p+1$ is smooth. The Lucas sequence $V_k$ lives in the quadratic extension $\\mathbb{F}_{p^2}$, where the multiplicative order divides $p+1$. When $(D/p) = -1$, the element $\\alpha$ has norm 1 and satisfies $\\alpha^{p+1} = 1$, so if $p+1 \\mid M$ then $V_M \\equiv 2 \\pmod{p}$. Stage 2 catches the case where $p+1$ has one large prime factor beyond $B1$ by checking multiples of $M$.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Binary ladder Lucas evaluation:} Computes $V_k(P, 1)$ using the $(V_j, V_{j+1})$ invariant with MSB-first bit processing. Updates use $V_{2j} = V_j^2 - 2$ and $V_{2j+1} = V_j \\cdot V_{j+1} - P$, avoiding generic Lucas sequence overhead.
\\item \\textbf{Auto-escalating bounds:} Tries three increasing bound configurations $(B_1, B_2) \\in \\{(100, 1000), (1000, 10000), (10000, 50000)\\}$, with cached prime lists and P values, automatically escalating on failure.
\\end{itemize}

\\textbf{References:} H. C. Williams, "A p+1 Method of Factoring", Mathematics of Computation, 1982`,
  priority: 'medium',
  applicableCheck: (p: Record<string, string>) => !!p.n,
};

export const generateTestcase = (): Record<string, string> => {
  let p: bigint;
  while (true) {
    let pPlus1 = 2n;
    const primes = [];
    for(let i=2; i<=2000; i++) if(isPrimeMR(BigInt(i))) primes.push(BigInt(i));
    // Fisher-Yates shuffle for unbiased random ordering
    for (let i = primes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [primes[i], primes[j]] = [primes[j], primes[i]];
    }
    let currentBits = 0;
    let idx = 0;
    while (currentBits < 128 && idx < primes.length) {
      pPlus1 *= primes[idx];
      currentBits += primes[idx].toString(2).length;
      idx++;
    }

    // Check if Stage 1 or 2
    if (Math.random() < 0.7) {
      p = pPlus1 - 1n;
    } else {
      let largePrime = BigInt(Math.floor(Math.random() * 900000) + 10000);
      while (!isPrimeMR(largePrime)) {
        largePrime++;
      }
      p = pPlus1 * largePrime - 1n;
    }
    if (isPrimeMR(p)) break;
  }

  const q = randomPrime(TESTCASE_BITS.q);
  const n = p * q;
  return { n: n.toString(), B: '10000', B2: '0' };
};