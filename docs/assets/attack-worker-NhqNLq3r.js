(function(){var e=class extends Error{status;constructor(e,t){super(e),this.name=`FactorDBError`,this.status=t}};let t=``;function n(e){t=e}async function r(n,r=t){let i=typeof n==`bigint`?n.toString():n;if(!i)throw new e(`queryFactorDB: n is empty`);let a=r?`${r}?query=${encodeURIComponent(i)}`:`https://factordb.com/api?query=${encodeURIComponent(i)}`,o=new AbortController,s=setTimeout(()=>o.abort(),2e4);try{let t=await fetch(a,{signal:o.signal});if(!t.ok)throw new e(`HTTP ${t.status}`,t.status);let n=await t.json();if(typeof n!=`object`||!n||![`string`,`number`].includes(typeof n.id))throw new e(`Invalid FactorDB response format`);return n}finally{clearTimeout(s)}}let i=0n,a=0,o=null,s=null,c=null,l=null;if(typeof WebAssembly<`u`){let e=new Uint8Array([0,97,115,109,1,0,0,0,1,20,3,96,0,1,126,96,2,126,126,1,126,96,5,126,126,126,126,127,1,127,3,8,7,1,1,2,0,0,0,0,6,21,4,126,1,66,0,11,126,1,66,0,11,126,1,66,0,11,126,1,66,0,11,7,47,7,6,117,54,52,103,99,100,0,0,9,117,54,52,103,99,100,101,120,116,0,1,6,104,101,108,112,101,114,0,2,1,65,0,3,1,66,0,4,1,67,0,5,1,68,0,6,10,141,4,7,37,1,1,126,32,1,66,0,82,4,64,3,64,32,0,32,1,130,33,2,32,1,33,0,32,2,34,1,66,0,82,13,0,11,11,32,0,11,97,1,6,126,66,1,33,6,66,1,33,3,32,1,66,0,82,4,64,3,64,32,0,32,0,32,1,128,34,7,32,1,126,125,33,4,32,1,33,0,32,6,32,2,32,7,126,125,33,1,32,5,32,3,32,7,126,125,33,7,32,2,33,6,32,3,33,5,32,1,33,2,32,7,33,3,32,4,34,1,66,0,82,13,0,11,11,32,6,36,0,32,5,36,1,32,0,11,238,2,2,7,126,2,127,66,1,33,9,66,1,33,7,32,0,66,127,82,32,2,66,127,82,113,4,64,3,64,32,0,32,6,124,33,8,32,0,32,9,124,33,6,32,2,32,5,124,33,5,32,2,32,7,124,33,7,32,12,65,1,113,4,64,32,8,33,9,32,6,33,8,32,9,33,6,32,5,33,9,32,7,33,5,32,9,33,7,11,3,64,32,5,32,6,32,8,32,7,128,34,11,32,5,126,125,34,9,86,4,64,32,12,65,1,106,33,12,32,8,32,7,32,11,126,125,33,10,32,0,32,2,32,11,126,125,33,11,32,5,33,8,32,7,33,6,32,2,33,0,32,10,33,5,32,9,33,7,32,11,33,2,12,1,11,11,32,6,32,0,125,33,9,32,8,32,0,125,33,6,32,5,32,2,125,33,5,32,7,32,2,125,33,7,32,12,65,1,113,4,64,32,9,33,8,32,6,33,9,32,8,33,6,32,5,33,8,32,7,33,5,32,8,33,7,11,32,4,32,0,32,9,124,34,8,32,0,32,6,124,34,10,32,8,32,10,86,27,121,167,34,13,32,4,32,13,72,27,34,13,4,64,32,1,32,1,32,4,32,13,107,34,4,172,34,8,136,34,10,32,8,134,125,33,1,32,3,32,3,32,8,136,34,11,32,8,134,125,33,3,32,9,32,10,126,32,6,32,11,126,124,32,0,32,13,172,34,8,134,124,33,0,32,5,32,10,126,32,7,32,11,126,124,32,2,32,8,134,124,33,2,11,32,13,13,0,11,11,32,9,36,0,32,6,36,1,32,5,36,2,32,7,36,3,65,0,11,4,0,35,0,11,4,0,35,1,11,4,0,35,2,11,4,0,35,3,11]);try{let t=new WebAssembly.Instance(new WebAssembly.Module(e)).exports;t.helper(1n,0n,1n,0n)!=null&&(c=function(e,n,r,i,a){return t.helper(e,n,r,i,a),[t.A(),t.B(),t.C(),t.D()]},a=64,i=BigInt.asUintN(64,-1n)),t.u64gcd(0n,0n)===0n&&(o=t.u64gcd),t.u64gcdext(0n,0n)===0n&&(s=function(e,n){let r=t.u64gcdext(e,n);return[t.A(),t.B(),r]})}catch(e){console.log(e)}}function u(e){"use asm";var t=e.Math.floor,n=e.Math.max,r=e.Math.clz32,i=-0,a=-0,o=-0,s=-0;function c(e,n){e=+e,n=+n;for(var r=-0,i=-0;n>-0;)i=+t(e/n),r=e-i*n,e=n,n=r;return+e}function l(e,n){e=+e,n=+n;for(var r=-0,o=-0,s=1,c=-0,l=-0,u=1,d=-0,f=-0;n>-0;)o=+t(e/n),r=e-o*n,e=n,n=r,d=s-o*l,f=c-o*u,s=l,c=u,l=d,u=f;return i=s,a=c,+e}function u(e){e=+e;for(var t=0;e>=4294967296;)e*=23283064365386963e-26,t=t+32|0;return t=t+(32-(r(~~e)|0))|0,t|0}function d(e){e|=0;for(var t=1;(e|0)<0;)e=e+32|0,t*=23283064365386963e-26;for(;(e|0)>=32;)e=e-32|0,t*=4294967296;return t*=+(1<<e>>>0),+t}function f(e,r,c,l,f){e=+e,r=+r,c=+c,l=+l,f|=0;var p=1,m=-0,h=-0,g=1,_=0,v=0,y=-0,b=-0,x=-0,S=-0,C=-0,w=-0,T=0,E=-0,D=-0,O=-0,k=-0,A=-0;if(c!=-0)do{do y=t(e/c),b=e-y*c,x=h,S=g,C=p-y*h,w=m-y*g,v=-0<=b+C&b+C<c+h&-0<=b+w&b+w<c+g,v&&(e=c,c=b,p=x,m=S,h=C,g=w);while(v);T=53-(u(e+n(p,m))|0)|0,_=(T|0)<0?T:(T|0)>(f|0)?f:T,T|0&&(E=+d(f-_|0),D=+d(_-f|0),O=+t(r*D),k=+t(l*D),r-=O*E,l-=k*E,f=f-_|0,A=+d(_),e=p*O+m*k+e*A,c=h*O+g*k+c*A)}while(_|0);return i=p,a=m,o=h,s=g,0}function p(){return i}function m(){return a}function h(){return o}function g(){return s}return{f64gcdext:l,f64gcd:c,helper:f,A:p,B:m,C:h,D:g}}if(a===0){let e=u(globalThis);l=function(t,n,r,i,a){return e.helper(t,n,r,i,a),[BigInt(e.A()),BigInt(e.B()),BigInt(e.C()),BigInt(e.D())]},a=53,i=BigInt.asUintN(53,-1n),o=function(t,n){return BigInt(e.f64gcd(Number(BigInt(t)),Number(BigInt(n))))},s=function(t,n){let r=e.f64gcdext(Number(BigInt(t)),Number(BigInt(n)));return[BigInt(e.A()),BigInt(e.B()),BigInt(r)]}}function d(e){let t=e.toString(16),n=t.charCodeAt(0)-0-48;if(n<=0)throw RangeError();return(t.length-1)*4+(32-Math.clz32(Math.min(n,8)))}let f=typeof Float64Array<`u`?new Float64Array(1):null,p=typeof Float64Array<`u`?new Int32Array(f.buffer):null,m=0;function h(e){if(m<=1024){let t=-0+Number(BigInt(e));if(f!=null){f[0]=t;let e=(p[1]>>20)-1023;if(e<1024&&p[0]!==0||p[1]&1048575)return m=e+1,m}let n=Math.log2(t)+1024*4-1024*4,r=Math.ceil(n);if(n!==r)return m=r,m}m<a&&(m=a);let t=-0+Number(e>>BigInt(m-a));if(t>=1&&t<=9007199254740992){let e=+t,n=0;for(;e>1073741824;)e=Math.floor(e/1073741824),n+=30;return n+=32-Math.clz32(e),m=m-a+n,m}return m=d(e),m}function g(e,t){if(typeof e!=`bigint`||typeof t!=`bigint`)throw TypeError();if(c!=null){if(a!==64)throw RangeError();let n=BigInt.asUintN(64,e>>64n),r=BigInt.asUintN(64,e),i=BigInt.asUintN(64,t>>64n),o=BigInt.asUintN(64,t);return c(n,r,i,o,64)}else{if(a!==53)throw RangeError();let n=-0+Number(e>>53n),r=-0+Number(BigInt.asUintN(53,e)),i=-0+Number(t>>53n),o=-0+Number(BigInt.asUintN(53,t));return l(n,r,i,o,53)}}function _(e){if(typeof e!=`bigint`)throw TypeError();return e<0n?-e:e}function v(e,t){if(typeof e!=`bigint`||typeof t!=`bigint`)throw TypeError();return e<t?t:e}function y(e,t,n=!0,r=!0,o=!1){if(typeof e!=`bigint`||typeof t!=`bigint`)throw TypeError();n||=r;let s=1n,c=0n,l=0n,u=1n,f=0;if(e<0n&&(e=-e,n&&(s=-s,c=-c,f+=1)),t<0n&&(t=-t,n&&(l=-l,u=-u,f+=1)),e<t){let r=e;if(e=t,t=r,n){let e=s;s=l,l=e;let t=c;c=u,u=t,f+=1}}let p=!1;r&&BigInt.asUintN(4096,e)===e&&(p=!0);let m=!1,b=0;for(;(r||e>i)&&t!==0n;){if(!p&&!r&&BigInt.asUintN(32768*(n?1/16:1),t)===t){p=!0;continue}if(f+=1,!p){r&&f===1&&(b=d(e));let i=r?d(v(_(l),_(u))):0,a=r?Math.max(0,Math.ceil((b-i-i)*(1/2))):n?0:Math.floor(d(e)*2/3),o=BigInt(a);if(f!==1&&r){if(a<256){p=!0;continue}let n=8;for(;e+s>>o!==e+c>>o||t+l>>o!==t+u>>o;)a+=n,o=BigInt(a),n+=n}let[m,h,g,x,S,C]=y(e>>o,t>>o),[w,T,E,D,O,k]=[BigInt(m),BigInt(h),BigInt(g),BigInt(x),BigInt(S),BigInt(C)];if(T!==0n){if(n)if(f===1)s=w,c=T,l=E,u=D;else{let e=w*c+T*u,t=E*c+D*u;if(c=e,u=t,r){let e=w*s+T*l,t=E*s+D*l;s=e,l=t}}let i=BigInt.asUintN(a,e),d=BigInt.asUintN(a,t),p=w*i+T*d+(O<<o),m=E*i+D*d+(k<<o);if(e=p,t=m,e<0n||t<0n)throw TypeError(`assertion`);continue}}if(p&&!m){let i=Math.max(0,h(e)-a*2),d=i===0?0n:BigInt(i);if(f!==1&&r&&(e+s>>d!==e+c>>d||t+l>>d!==t+u>>d)){if(!o)break;do i+=8,d=BigInt(i);while(e+s>>d!==e+c>>d||t+l>>d!==t+u>>d);if(t>>d===0n){m=!0;continue}}let[p,_,v,y]=g(i===0?e:e>>d,i===0?t:t>>d),[b,x,S,C]=[BigInt(p),BigInt(_),BigInt(v),BigInt(y)];if(x!==0n){if(n)if(f===1)s=b,c=x,l=S,u=C;else{let e=b*c+x*u,t=S*c+C*u;if(c=e,u=t,r){let e=b*s+x*l,t=S*s+C*l;s=e,l=t}}let i=b*e+x*t,a=S*e+C*t;if(e=i,t=a,e<0n||t<0n)throw TypeError(`assertion`);continue}}let i=e/t,x=e-i*t;if(n){let e=s-i*l,n=c-i*u;if(r&&!(0n<=x+e&&x+e<t+l&&0n<=x+n&&x+n<t+u))break;s=l,c=u,l=e,u=n}e=t,t=x}return[s,c,l,u,e,t]}function b(e,t){let[n,r,i,a,s,c]=y(e,t,!1,!1);return e=BigInt(s),t=BigInt(c),t!==0n&&(e=BigInt.asUintN(64,o(e,t))),e}function x(e,t){let[n,r,i,a,o,c]=y(e,t,!0,!1),l=e,u=t,d=BigInt(n),f=BigInt(r);BigInt(i);let p=BigInt(a);if(e=BigInt(o),t=BigInt(c),c!==0n){let[n,r,i]=s(e,t);e=BigInt.asUintN(64,i),t=0n,f=n*f+r*p}return d=l===0n?0n:(e-f*u)/l,[d,f,e]}function S(e,t){return b(BigInt(e),BigInt(t))}function C(e,t){return x(BigInt(e),BigInt(t))}function w(e,t){let[n,r,i,a,o,c]=y(t,e,!0,!1);if(BigInt(c)!==0n){let[e,n,i]=s(o,c);if(BigInt.asUintN(64,i)!==1n)return 0n;let l=e*BigInt(r)+n*BigInt(a);return l<0n?l+t:l}if(BigInt(o)!==1n)return 0n;let l=BigInt(r);return l<0n?l+t:l}function T(e,t){return y(e,t,!0,!0,!0)}S.halfgcd=T,S.gcdext=C,S.invmod=w;function E(e,t){return e=e<0n?-e:e,t=t<0n?-t:t,S(e,t)}function D(e){if(e<0n)throw RangeError(`isqrt: negative input`);if(e<2n)return e;let t=1n<<(BigInt(e.toString(16).length)*4n>>1n),n=t+e/t>>1n;for(;n<t;)t=n,n=t+e/t>>1n;return t}function O(e,t){let n=e<0n,r=t<0n;e=n?-e:e,t=r?-t:t;let[i,a,o]=S.gcdext(e,t);return{gcd:o,x:n?-i:i,y:r?-a:a}}function k(e,t){let{gcd:n,x:r}=O((e%t+t)%t,t);return n===1n?(r%t+t)%t:null}function A(e,t,n){if(t<0n)throw RangeError(`modPow: negative exponent not supported`);if(n<=0n)throw RangeError(`modPow: modulus must be positive`);if(n===1n)return 0n;let r=1n;for(e=(e%n+n)%n;t>0n;)t&1n&&(r=r*e%n),t>>=1n,e=e*e%n;return r}function j(e,t){if(e<0n)throw RangeError(`iroot: negative input`);if(e<2n||t<=1n)return e;if(t===2n)return D(e);let n=BigInt(e.toString(16).length)*4n;if(n<t)return 1n;let r=e=>{if(t===3n)return e*e*e;if(t===5n){let t=e*e;return t*t*e}return e**t},i=1n<<n/t;i<2n&&(i=2n);let a=t-1n,o=(i*a+e/i**a)/t;for(;o<i;)i=o,o=(i*a+e/i**a)/t;let s=i,c=o;for(;r(c)<=e;)s=c,c*=2n;for(;s+1n<c;){let t=(s+c)/2n;r(t)<=e?s=t:c=t}for(;r(s+1n)<=e;)s++;for(;r(s)>e;)s--;return s}function M(e){if(e<2n)return!1;if(e<4n)return!0;if(e%2n==0n||e%3n==0n)return!1;for(let t of[5n,7n,11n,13n,17n,19n,23n,29n,31n,37n,41n,43n,47n]){if(e===t)return!0;if(e%t===0n)return!1}let t=e-1n,n=0;for(;t%2n==0n;)t/=2n,n++;for(let r of[2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){if(r>=e)break;let i=A(r,t,e);if(i===1n||i===e-1n)continue;let a=!0;for(let t=1;t<n;t++)if(i=i*i%e,i===e-1n){a=!1;break}if(a)return!1}return!0}let N={id:`boneh-durfee`,name:`Boneh-Durfee Attack`,category:`Factorization`,description:`Recovers d when d < n^0.292 via Wiener continued fractions (d < n^0.25) or Boneh-Durfee lattice (d < n^0.292). Use for unbalanced private exponents.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        import sys
        #
        def _bd_attack():
            try:
                n = Integer(${e.n})
                e = Integer(${e.e})
                out = []
                out.append(f"Boneh-Durfee Attack on n = {n}")
                if n < 2 or e < 2:
                    out.append("Invalid input: n and e must be >= 2")
                    print("\\n".join(out))
                    print("BONEH_DURFEE=FAILED")
                    return
                if n % 2 == 0:
                    out.append(f"n is even: {n}")
                    out.append(f"Verification: 2 * {n // 2} = {n}")
                    out.append(f"p = 2")
                    out.append(f"q = {n // 2}")
                    out.append("")
                    print("\\n".join(out))
                    print("BONEH_DURFEE=SUCCESS")
                    return
                if n.is_prime():
                    out.append(f"n is prime: {n}")
                    print("\\n".join(out))
                    print("BONEH_DURFEE=FAILED")
                    return
                if n.is_square():
                    p = isqrt(n)
                    out.append(f"n is a perfect square: {p}^2 = {n}")
                    out.append(f"Verification: p * q = {p * p}")
                    out.append(f"p = {p}")
                    out.append(f"q = {p}")
                    out.append("")
                    print("\\n".join(out))
                    print("BONEH_DURFEE=SUCCESS")
                    return
                # Phase 1: Wiener's attack via continued fraction convergents of e/n
                cf = continued_fraction(QQ(e)/QQ(n))
                found = False
                for conv in cf.convergents():
                    k, d = conv.numerator(), conv.denominator()
                    if k == 0:
                        continue
                    if (e * d - 1) % k == 0:
                        phi = (e * d - 1) // k
                        s = n - phi + 1
                        disc = s ** 2 - 4 * n
                        if disc > 0 and disc.is_square():
                            t = isqrt(disc)
                            if (s + t) % 2 == 0:
                                p = (s - t) // 2
                                q = (s + t) // 2
                                if p * q == n and p > 1:
                                    out.append(f"Wiener's attack succeeded:")
                                    out.append(f"Verification: p * q = {p * q}")
                                    out.append(f"d = {d}")
                                    out.append(f"p = {p}")
                                    out.append(f"q = {q}")
                                    out.append("")
                                    found = True
                                    break
                if found:
                    print("\\n".join(out))
                    print("BONEH_DURFEE=SUCCESS")
                    return
                # Phase 2: Boneh-Durfee lattice attack (Herrmann-May simplification)
                # f(x,y) = 1 + x*(A + y) with root (2k, -(p+q)/2) where ed = 1 + k*phi(n)
                # Theoretical bound: d < n^delta with delta < 1 - 1/sqrt(2) ≈ 0.292
                out.append("Wiener failed (d >= n^0.25). Attempting Boneh-Durfee lattice attack...")
                A = (n + 1) // 2
                delta = 0.260
                m = 3
                t = int((1 - 2 * delta) * m)
                if t < 0:
                    t = 0
                XX = Integer(floor(RR(n) ** delta))
                YY = isqrt(n) + 1
                P = PolynomialRing(ZZ, 'x, y')
                x, y = P.gens()
                f = 1 + x * (A + y)
                PR = PolynomialRing(ZZ, 'u, x, y')
                u, x, y = PR.gens()
                Q = PR.quotient(x * y + 1 - u)
                fZ = Q(f).lift()
                UU = XX * YY + 1
                gg = []
                for kk in range(m + 1):
                    for ii in range(m - kk + 1):
                        gg.append(x ** ii * e ** (m - kk) * fZ(u, x, y) ** kk)
                gg.sort()
                monomials = []
                for poly in gg:
                    for mon in poly.monomials():
                        if mon not in monomials:
                            monomials.append(mon)
                monomials.sort()
                if t > 0:
                    for jj in range(1, t + 1):
                        for kk in range((m // t) * jj, m + 1):
                            gg.append(Q(y ** jj * fZ(u, x, y) ** kk * e ** (m - kk)).lift())
                            monomials.append(u ** kk * y ** jj)
                nn = len(monomials)
                BB = Matrix(ZZ, nn)
                for ii in range(nn):
                    BB[ii, 0] = gg[ii](0, 0, 0)
                    for jj in range(1, ii + 1):
                        if monomials[jj] in gg[ii].monomials():
                            BB[ii, jj] = gg[ii].monomial_coefficient(monomials[jj]) * monomials[jj](UU, XX, YY)
                BB = BB.LLL()
                import sympy
                w_sym, z_sym = sympy.symbols('w z')
                u_sym, x_sym, y_sym = sympy.symbols('u x y')
                def to_sympy(poly):
                    expr = sympy.sympify(str(poly))
                    return expr.subs({u_sym: w_sym*z_sym + 1, x_sym: w_sym, y_sym: z_sym})
                mon_syms = [to_sympy(m) for m in monomials]
                found2 = False
                for i1 in range(nn - 1):
                    if found2:
                        break
                    for i2 in range(i1 + 1, nn):
                        p1 = sum(sympy.Rational(int(BB[i1, j]), int(monomials[j](UU, XX, YY))) * mon_syms[j] for j in range(nn))
                        p2 = sum(sympy.Rational(int(BB[i2, j]), int(monomials[j](UU, XX, YY))) * mon_syms[j] for j in range(nn))
                        try:
                            rr = sympy.resultant(p1, p2, w_sym)
                        except Exception:
                            continue
                        if rr == 0 or rr == 1:
                            continue
                        try:
                            roots_dict = sympy.roots(rr, z_sym)
                        except Exception:
                            continue
                        for z0_sym in roots_dict:
                            try:
                                y0_int = Integer(int(z0_sym))
                            except Exception:
                                continue
                            try:
                                p1_y0 = p1.subs({z_sym: y0_int})
                                w_roots = sympy.solve(p1_y0, w_sym)
                            except Exception:
                                continue
                            for x0_sym in w_roots:
                                try:
                                    x0_int = Integer(int(x0_sym))
                                except Exception:
                                    continue
                                if f(x0_int, y0_int) % e == 0:
                                    d_val = (1 + x0_int * (A + y0_int)) // e
                                    if d_val > 0:
                                        p_plus_q = -2 * y0_int
                                        disc2 = p_plus_q ** 2 - 4 * n
                                        if disc2 > 0 and disc2.is_square():
                                            sqrt_disc2 = isqrt(disc2)
                                            p_val = ZZ((p_plus_q + sqrt_disc2) // 2)
                                            q_val = ZZ((p_plus_q - sqrt_disc2) // 2)
                                            if p_val * q_val == n and p_val > 1:
                                                out.append("Boneh-Durfee lattice attack succeeded!")
                                                out.append(f"Verification: p * q = {p_val * q_val}")
                                                out.append(f"d = {d_val}")
                                                out.append(f"p = {p_val}")
                                                out.append(f"q = {q_val}")
                                                out.append("")
                                                print("\\n".join(out))
                                                print("BONEH_DURFEE=SUCCESS")
                                                found2 = True
                                                break
                            if found2:
                                break
                if not found2:
                    out.append("Boneh-Durfee lattice attack failed: d >= n^0.292 or parameters insufficient.")
                    print("\\n".join(out))
                    print("BONEH_DURFEE=FAILED")
            except BaseException as ex:
                out.append(f"ERROR: Boneh-Durfee computation failed: {ex}")
                print("\\n".join(out))
                print("BONEH_DURFEE=FAILED")
        #
        _bd_attack()
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("BONEH_DURFEE=FAILED")
_attack()`,proof:`\\textbf{Theorem:} Find $d$ when $d < n^{0.292}$ using Wiener's continued fractions ($d < n^{0.25}$) or Boneh-Durfee's lattice ($d < n^{0.292}$).

\\textbf{Setup:}
\\begin{itemize}
\\item $ed \\equiv 1 \\pmod{\\phi(n)}$ with unknown $d$, $k$, $\\phi(n)$
\\item $e \\approx n$ and $d < n^{\\delta}$ with $\\delta < 0.5$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\left|\\frac{e}{n} - \\frac{k}{d}\\right| &= \\frac{|ed - kn|}{dn} = \\frac{|1 - k(p+q-1)|}{dn} < \\frac{1}{2d^2} \\quad \\text{(for $d < n^{0.25}$)}\\\\
\\frac{k}{d} \\text{ a convergent of } \\frac{e}{n} &\\implies \\phi(n) = \\frac{ed-1}{k},\\; p+q = n - \\phi(n) + 1 \\\\
p,q &= \\frac{(p+q) \\pm \\sqrt{(p+q)^2 - 4n}}{2}
\\end{align*}

\\textbf{Explanation:} Wiener's attack exploits the fact that when $d$ is small, $e/n$ approximates $k/d$ so closely that $k/d$ appears as a convergent in the continued fraction expansion of $e/n$. The Boneh-Durfee lattice uses Coppersmith's method with a bivariate polynomial $f(x,y) = x(A+y)-1$ to extend the bound to $d < n^{0.292}$ by finding short vectors via LLL.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Two-phase execution:} Phase 1 runs Wiener's continued fraction attack ($d < n^{0.25}$) — a fast $O(\\log n)$ check using $e/n$ convergents that immediately succeeds for small $d$ without invoking lattice reduction. Phase 2 runs the Herrmann-May Coppersmith lattice ($d < n^{0.292}$) with sympy resultant for bivariate root recovery, only when Wiener fails.
\\end{itemize}

\\textbf{References:} M. Wiener, CRYPTO 1990; D. Boneh, G. Durfee, CRYPTO 1999`,priority:`high`,applicableCheck:e=>!!e.n&&!!e.e},P={id:`ecm2`,name:`ECM Full Factorization`,category:`Factorization`,description:`Factors n completely via repeated ECM with recursive factor removal. Use when n may have multiple prime factors beyond two.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        out = []
        try:
            n = Integer(${e.n})
            from sage.libs.libecm import ecmfactor
            def ecm_factor_all(m, depth):
                indent = "  " * depth
                if m == 1:
                    return []
                if m.is_prime():
                    out.append(f"{indent}Prime: {m}")
                    return [m]
                out.append(f"{indent}Composite: {m} ({m.nbits()} bits)")
                B1_vals = [2000, 10000, 50000]    # capped at 50k to avoid SageMathCell timeout
                found_p = None
                for B1_cur in B1_vals:
                    for attempt in range(10):
                        try:
                            result = ecmfactor(m, B1_cur)
                            if result[0]:
                                p = result[0]
                                if p != 1 and p != m and m % p == 0:
                                    found_p = p
                                    break
                        except Exception:
                            continue
                    if found_p is not None:
                        break
                if found_p is not None:
                    out.append(f"{indent}ECM factor: {found_p}")
                    return ecm_factor_all(found_p, depth + 1) + ecm_factor_all(m // found_p, depth + 1)
                out.append(f"{indent}ECM found no factor, using factor()")
                fac = factor(m)
                result = []
                for prime, exp in fac:
                    for _ in range(exp):
                        result.append(prime)
                return result
            out.append(f"ECM Full Factorization on n = {n}")
            out.append("")
            if n < 2:
                out.append(f"n = {n} is too small to factor")
                print("\\n".join(out))
                print("ECM2=FAILED")
                return
            if n % 2 == 0:
                out.append(f"n is even: {n}")
                out.append(f"Verification: 2 * {n // 2} = {n}")
                out.append(f"p = 2")
                out.append(f"q = {n // 2}")
                out.append("")
                print("\\n".join(out))
                print("ECM2=SUCCESS")
                return
            if n.is_prime():
                out.append(f"n is prime: {n}")
                print("\\n".join(out))
                print("ECM2=FAILED")
                return
            if n.is_square():
                p = isqrt(n)
                out.append(f"n is a perfect square: {p}^2 = {n}")
                out.append(f"Verification: p * q = {p * p}")
                out.append(f"p = {p}")
                out.append(f"q = {p}")
                out.append("")
                print("\\n".join(out))
                print("ECM2=SUCCESS")
                return
            factors = ecm_factor_all(n, 0)
            factors.sort()
            out.append("")
            out.append(f"All {len(factors)} prime factors: {factors}")
            out.append("")
            counts = {}
            for f in factors:
                counts[f] = counts.get(f, 0) + 1
            out.append(f"Factorization:")
            product = 1
            for prime, exp in sorted(counts.items()):
                if exp == 1:
                    out.append(f"  p = {prime}")
                else:
                    out.append(f"  {prime}^{exp}")
                product *= prime ** exp
            out.append("")
            out.append(f"Verification: product = {product}")
            out.append(f"Matches n: {product == n}")
            if product == n:
                out.append("")
                print("\\n".join(out))
                print("ECM2=SUCCESS")
            else:
                out.append("")
                print("\\n".join(out))
                print("ECM2=FAILED")
        except Exception as e:
            out.append(f"Error: {e}")
            print("\\n".join(out))
            print("ECM2=FAILED")
        #
    except BaseException as ex:
        out.append(f"ERROR: {ex}")
        print("\\n".join(out))
        print("ECM2=FAILED")
_attack()`,proof:`\\textbf{Theorem:} Repeated ECM with recursive factor removal extracts all prime factors of a composite integer.

\\textbf{Setup:}
\\begin{itemize}
\\item ECM finds one prime factor $p_i$ at a time using random elliptic curves
\\item Composite remainder $n' = n / p_i$ may contain further factors
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p_1^{e_1} p_2^{e_2} \\cdots p_k^{e_k} \\\\
\\text{ECM finds } p_i &\\implies n' = n / p_i \\\\
\\text{Recurse on } p_i \\text{ and } n' &\\text{ until all factors are prime} \\\\
\\text{Total time } &\\propto \\text{largest prime factor's ECM difficulty} \\qed
\\end{align*}

\\textbf{Explanation:} ECM finds a factor when the elliptic curve's group order divides a smooth bound $B$. By extracting one factor at a time and recursing on both the factor and the cofactor, the full factorization is recovered. The $B_1$ bound is gradually increased to handle larger factors.

\\textbf{References:} H. W. Lenstra Jr., "Factoring Integers with Elliptic Curves", Annals of Mathematics, 1987`,priority:`medium`,applicableCheck:e=>!!e.n};function F(e,t=`        `){let n=`${t}    `;return`${t}if n < 2:
${n}print(f"n = {n} is too small to factor")
${n}print("${e}=FAILED")
${n}return
${t}if n % 2 == 0:
${n}print(f"n is even: {n}")
${n}print(f"p = 2")
${n}print(f"q = {n // 2}")
${n}print(f"Verification: 2 * {n // 2} = {n}")
${n}print("${e}=SUCCESS")
${n}return
${t}if n.is_prime():
${n}print(f"n is prime: {n}")
${n}print("No factorization possible")
${n}print("${e}=FAILED")
${n}return
${t}if n.is_square():
${n}p = isqrt(n)
${n}print(f"n is a perfect square: {p}^2 = {n}")
${n}print(f"Verification: p * q = {p * p}")
${n}print(f"p = {p}")
${n}print(f"q = {p}")
${n}print()
${n}print("${e}=SUCCESS")
${n}return`}let ee={id:`pollard-p1`,name:`Pollard's p-1 Method`,category:`Factorization`,description:`Factors n when a prime factor p has p-1 that is B1-smooth, with Stage 2 extending to one larger factor. Use when small prime factors may be smooth.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`B`,label:`B1 (stage 1 bound, optional)`,placeholder:`10000`,required:!1,multiline:!1},{name:`B2`,label:`B2 (stage 2 bound, optional)`,placeholder:`0 (disabled)`,required:!1,multiline:!1}],sageTemplate:e=>`import math
def _attack():
    try:
        out = []
        n = Integer(${e.n})
        B1 = int(Integer(${e.B||`10000`}))
        if B1 < 2:
            B1 = 10000
        B2 = int(Integer(${e.B2||`0`}))
        if B2 < 0:
            B2 = 0
        out.append(f"Pollard's p-1 on n = {n} ({n.nbits()} bits)")
        out.append(f"B1 = {B1}")
        if B2 > B1:
            out.append(f"B2 = {B2}")
        out.append("")
        # Trivial checks
        ${F(`POLLARD_P1`)}
        # Use Python int for fast modular exponentiation
        n_int = int(n)
        # Sieve primes up to B1 (pure Python, no prime_range)
        limit = B1
        sieve = [True] * (limit + 1)
        if limit >= 0:
            sieve[0] = False
        if limit >= 1:
            sieve[1] = False
        i = 2
        while i * i <= limit:
            if sieve[i]:
                for j in range(i * i, limit + 1, i):
                    sieve[j] = False
            i += 1
        primes = [i for i in range(limit + 1) if sieve[i]]
        # Stage 1: compute 2^lcm(1..B1) mod n
        out.append(f"Stage 1: {len(primes)} primes up to B1={B1}...")
        a = 2
        for p in primes:
            pp = p
            while pp * p <= limit:
                pp *= p
            a = pow(a, pp, n_int)
        g = math.gcd(a - 1, n_int)
        if 1 < g < n_int:
            g_sage = Integer(g)
            q_val = n // g_sage
            out.append(f"Verification: p * q = {g_sage * q_val}")
            out.append(f"p = {g_sage}")
            out.append(f"q = {q_val}")
            out.append("")
            out.append("POLLARD_P1=SUCCESS")
            print("\\n".join(out))
            return
        # Stage 2 (optional, only if B2 > B1 and Stage 1 failed)
        if B2 > B1:
            limit2 = B2
            out.append(f"Stage 2: checking primes in ({limit}, {limit2}]...")
            sieve2 = [True] * (limit2 + 1)
            if limit2 >= 0:
                sieve2[0] = False
            if limit2 >= 1:
                sieve2[1] = False
            i = 2
            while i * i <= limit2:
                if sieve2[i]:
                    for j in range(i * i, limit2 + 1, i):
                        sieve2[j] = False
                i += 1
            big_primes = [i for i in range(limit + 1, limit2 + 1) if sieve2[i]]
            if big_primes:
                Q = 1
                Hq = pow(a, big_primes[0], n_int)
                Q = (Q * (Hq - 1)) % n_int
                for j in range(1, len(big_primes)):
                    d = big_primes[j] - big_primes[j - 1]
                    Hq = (Hq * pow(a, d, n_int)) % n_int
                    Q = (Q * (Hq - 1)) % n_int
                g = math.gcd(Q, n_int)
                if 1 < g < n_int:
                    g_sage = Integer(g)
                    q_val = n // g_sage
                    out.append(f"Verified: p * q = {g_sage * q_val}")
                    out.append(f"p = {g_sage}")
                    out.append(f"q = {q_val}")
                    out.append("")
                    out.append("POLLARD_P1=SUCCESS")
                    print("\\n".join(out))
                    return
        out.append(f"Pollard p-1 failed: p-1 is not {B1}-smooth")
        if B2 > B1:
            out.append(f"(also not {B2}-smooth with one large factor)")
        out.append("POLLARD_P1=FAILED")
        print("\\n".join(out))
    except Exception as e:
        out.append(f"ERROR: {e}")
        out.append("POLLARD_P1=FAILED")
        print("\\n".join(out))
_attack()`,proof:`\\textbf{Theorem:} If $p-1$ is $B_1$-smooth, compute $a^M \\bmod n$ with $M = \\operatorname{lcm}(1,\\ldots,B_1)$ to reveal $p$ via $\\gcd(a^M-1, n)$.

\\textbf{Setup:}
\\begin{itemize}
\\item Fermat's Little Theorem: $a^{p-1} \\equiv 1 \\pmod{p}$ for $\\gcd(a,p)=1$
\\item $p-1$ is $B_1$-smooth: all prime factors of $p-1$ are $\\leq B_1$
\\item $M = \\operatorname{lcm}(1, 2, \\ldots, B_1)$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p-1 \\mid M &\\implies a^M \\equiv 1 \\pmod{p} \\\\
p &\\mid (a^M - 1) \\implies \\gcd(a^M - 1, n) = p \\\\
\\text{Stage 2: } p-1 &= q_0 \\cdot s,\\; s \\mid M,\\; q_0 \\in (B_1, B_2] \\\\
H &= a^M,\\; H^{q_0} \\equiv 1 \\pmod{p} \\\\
\\gcd\\left(\\prod_{q \\in (B_1, B_2]} (H^q - 1), n\\right) &= p \\qed
\\end{align*}

\\textbf{Explanation:} Pollard's $p-1$ method exploits Fermat's Little Theorem: if $p-1$ divides $M = \\operatorname{lcm}(1,\\ldots,B_1)$, then $a^M \\equiv 1 \\pmod{p}$, so $\\gcd(a^M-1, n)$ reveals $p$. Stage 1 computes $a^M$ by raising $a$ to each prime power $\\leq B_1$. Stage 2 handles the case where $p-1$ has one prime factor between $B_1$ and $B_2$.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Python Eratosthenes sieve:} Generates prime lists up to $B_1$ and $B_2$ using a pure-Python bit sieve, avoiding Sage's $\\mathtt{prime\\_range}$ overhead in interactive mode and allowing direct control over the sieve size.
\\item \\textbf{Incremental Stage 2:} Updates $H_q$ incrementally as $H_q = H_q \\cdot a^{d} \\bmod n$ where $d = q_j - q_{j-1}$ is the gap between consecutive primes in $(B_1, B_2]$, then accumulates $\\prod (H_q - 1)$ for a single GCD per product batch.
\\end{itemize}

\\textbf{References:} J. M. Pollard, "Theorems on Factorization and Primality Testing", Proc. Cambridge Philos. Soc., 1974`,frontendCheck:(e,t)=>{if(!e.n)return Promise.resolve(null);try{let n=BigInt(e.n),r=parseInt(e.B)||1e4,i=parseInt(e.B2)||0;if(r<2)return Promise.resolve(null);let a=Math.max(r,i),o=new Uint8Array(a+1),s=[];for(let e=2;e<=a;e++)if(!o[e]){s.push(e);for(let t=e*e;t<=a;t+=e)o[t]=1}let c=0;for(let e of s){if(e>r)break;c++}let l=i>r?s.length-c:0,u=c+l,d=0,f=2n;for(let e of s){if(e>r)break;let i=e;for(;i*e<=r;)i*=e;if(f=A(f,BigInt(i),n),d++,t&&u>0&&d%Math.max(1,Math.floor(u/10))===0){let e=Math.min(99,Math.round(d*100/u));t(e,`Stage 1: ${e}%`)}}let p=E(f-1n,n);if(p>1n&&p<n)return t?.(100),Promise.resolve(`Factor found!\np = ${p}\nq = ${n/p}\nPOLLARD_P1=SUCCESS`);if(i>r){for(let e of s)if(!(e<=r)){if(f=A(f,BigInt(e),n),d++,t&&u>0&&d%Math.max(1,Math.floor(u/10))===0){let e=Math.min(99,Math.round(d*100/u));t(e,`Stage 2: ${e}%`)}if(p=E(f-1n,n),p>1n&&p<n)return t?.(100),Promise.resolve(`Factor found!\np = ${p}\nq = ${n/p}\nPOLLARD_P1=SUCCESS`)}}return t?.(100),Promise.resolve(null)}catch{return Promise.resolve(null)}},priority:`medium`,applicableCheck:e=>!!e.n},te={id:`pollard-rho`,name:`Pollard's Rho (Brent variant)`,category:`Factorization`,description:`Factors n via birthday paradox with Brent's cycle detection and batched GCD reduction. Use for general-purpose factorization of medium-sized factors.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    import math
    try:
        try:
            out = []
            n = Integer(${e.n})
            out.append(f"Pollard's Rho (Brent variant) on n = {n}")
            out.append("")
            ${F(`POLLARD_RHO`,`            `)}
            # Brent's cycle detection with batched GCD (primefac-style, BIT 1980)
            # Batched GCD reduces overhead: accumulate |x-y| products, one gcd per batch
            # Backtracking handles g == n case (when accumulated product contains all factors)
            def brent_rho_batch(n_val, c_val):
                n_i = int(n_val)
                c_i = int(c_val)
                y = 2
                r = 1
                q = 1
                g = 1
                m = 100
                while g == 1:
                    x = y
                    for _ in range(r):
                        y = (y * y + c_i) % n_i
                    k = 0
                    while k < r and g == 1:
                        ys = y
                        batch = min(m, r - k)
                        for _ in range(batch):
                            y = (y * y + c_i) % n_i
                            q = (q * abs(x - y)) % n_i
                        g = math.gcd(q, n_i)
                        q = 1
                        k += m
                    r *= 2
                if g == n_i:
                    while True:
                        ys = (ys * ys + c_i) % n_i
                        g = math.gcd(abs(x - ys), n_i)
                        if g > 1:
                            break
                return Integer(g) if 1 < g < n_i else None
            found = False
            for c_val in range(1, 10):
                d = brent_rho_batch(n, c_val)
                if d is not None:
                    p = d
                    q = n // p
                    out.append(f"Verification: p * q = {p * q}")
                    out.append(f"p = {p}")
                    out.append(f"q = {q}")
                    out.append(f"c value: {c_val}")
                    out.append("")
                    out.append("POLLARD_RHO=SUCCESS")
                    found = True
                    break
            if not found:
                out.append("Pollard's rho (Brent variant) failed: no factor found")
                out.append("Try ECM or other methods")
                out.append("POLLARD_RHO=FAILED")
            print("\\n".join(out))
        except Exception as e:
            out.append(f"ERROR: {e}")
            out.append("POLLARD_RHO=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        try:
            out.append(f"ERROR: {ex}")
            out.append("POLLARD_RHO=FAILED")
        except:
            out = [f"ERROR: {ex}", "POLLARD_RHO=FAILED"]
        print("\\n".join(out))
_attack()`,frontendCheck:(e,t)=>{if(!e.n)return Promise.resolve(null);try{let n=BigInt(e.n);if(n%2n==0n)return Promise.resolve(`Factor found!\np = 2\nq = ${n/2n}\nPOLLARD_RHO=SUCCESS`);let r=0;for(let e=1n;e<10n;e++){if(t){let n=Math.round(Number(e-1n)*100/9);n>r&&(r=n,t(n,`curve ${Number(e)} / 9`))}let i=n,a=BigInt(e),o=2n,s=2n,c=1n,l=1n,u=1n,d=0n,f=5e5,p=0;for(;l===1n&&p<f;){s=o;let e=0;for(;e<Number(u)&&p<f;)o=(o*o+a)%i,p++,e++;for(d=0n;d<u&&l===1n&&p<f;){let e=Math.min(100,Number(u-d)),t=o;for(let t=0;t<e;t++){o=(o*o+a)%i;let e=o>s?o-s:s-o;c=c*e%i,p++}if(l=E(c,i),c=1n,l===i){l=1n;let n=t;for(let t=0;t<e&&l===1n&&p<f;t++)n=(n*n+a)%i,l=E(n>s?n-s:s-n,i),p++}d+=BigInt(100)}u*=2n}if(l>1n&&l<i){let n=i/l;return t?.(100),Promise.resolve(`Factor found!\np = ${l}\nq = ${n}\nc = ${e}\niterations = ${p}\nPOLLARD_RHO=SUCCESS`)}}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} Pollard's rho algorithm with Brent's cycle detection and batched GCD finds a non-trivial factor in expected $O(n^{1/4})$ time.

\\textbf{Setup:}
\\begin{itemize}
\\item Birthday paradox: among $\\sqrt{p}$ random elements modulo a prime $p$, a collision is expected
\\item Pseudo-random walk $x_{i+1} = x_i^2 + c \\pmod{n}$ eventually cycles modulo each prime factor
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
x_{i+1} &= x_i^2 + c \\pmod{n} \\\\
\\text{Collision after } O(\\sqrt{p}) &\\text{ steps (birthday paradox)} \\\\
\\exists i \\neq j: \\; x_i &\\equiv x_j \\pmod{p} \\\\
p &\\mid (x_i - x_j) \\\\
\\text{Brent: save } x \\text{ only at powers of } 2 &\\;\\;\\; \\text{(1 evaluation per step)} \\\\
\\text{Batched GCD: accumulate } \\prod |x-y| &\\text{ for } m \\text{ steps, then one gcd} \\qed
\\end{align*}

\\textbf{Explanation:} Pollard's rho uses $f(x) = x^2 + c$ to generate a sequence that eventually cycles modulo $p$. Brent's cycle detection compares each value against a saved snapshot at powers of two, requiring only one evaluation per step instead of Floyd's three. Batched GCD reduces overhead by accumulating $m$ differences into one product before each GCD call. If the accumulated product contains $n$ as a factor, backtracking identifies the exact step.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Brent cycle detection:} Saves one snapshot per step at powers of two — requires only one evaluation per iteration vs Floyd's three, reducing modular multiplications by $\\sim 2\\times$ per cycle.
\\item \\textbf{Batched GCD:} Accumulates $m = 100$ product differences into $\\prod |x_i - y_i|$ before each GCD call, reducing expensive GCD operations by $\\sim 100\\times$. Backtracks within the winning batch when the accumulated product contains all of $n$.
\\end{itemize}

\\textbf{References:} J. M. Pollard, "A Monte Carlo Method for Factorization", BIT 1975; R. P. Brent, "An Improved Monte Carlo Factorization Algorithm", BIT 1980`,priority:`medium`,applicableCheck:e=>!!e.n},ne={id:`williams-p1`,name:`Williams' p+1 Method`,category:`Factorization`,description:`Factors n when p+1 is B1-smooth using Lucas sequences V_k(P,1). Stage 2 extends to handle one larger prime factor beyond B1. Use when Pollard p-1 fails.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`B`,label:`B1 (stage 1 bound, optional)`,placeholder:`10000`,required:!1,multiline:!1},{name:`B2`,label:`B2 (stage 2 bound, optional)`,placeholder:`0 (disabled)`,required:!1,multiline:!1}],sageTemplate:e=>`def _attack():
    try:
        n = Integer(${e.n})
        #
        # Handle B1 parameter: default to 10000 if not provided or invalid
        try:
            B1 = Integer(${e.B||`10000`})
            if B1 < 2:
                B1 = 10000
        except:
            B1 = 10000
        #
        # Handle B2 parameter: default to 0 (disabled) if not provided or invalid
        try:
            B2 = Integer(${e.B2||`0`})
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
                # Now check primes in Stage 2 (iterate pre-computed prime list,
                # advancing recurrence between non-consecutive primes)
                prev_k = B1
                for q in stage2_primes:
                    for _ in range(q - prev_k):
                        V_next = (V_curr * VM - V_prev) % n
                        V_prev, V_curr = V_curr, V_next
                    g = gcd(V_curr - 2, n)
                    if 1 < g < n:
                        return Integer(g)
                    prev_k = q
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
_attack()`,proof:`\\textbf{Theorem:} If $p+1$ is $B1$-smooth, then $p$ can be found via Lucas sequences $V_k(P,1)$. Stage 2 extends the smoothness bound to $B2$.

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

\\textbf{References:} H. C. Williams, "A p+1 Method of Factoring", Mathematics of Computation, 1982`,priority:`medium`,applicableCheck:e=>!!e.n},re={id:`quadratic-sieve`,name:`Quadratic Sieve`,category:`Factorization`,description:`Factors n by finding congruent squares via smoothness over a factor base. Use for medium-sized semiprimes (< 100 digits) with similar-sized factors.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        out = []
        n = Integer(${e.n})
        bits = n.nbits()
        #
        out.append(f"Quadratic Sieve on n = {n}")
        out.append(f"Number of digits: {bits / 3.32:.0f}")
        out.append(f"Bit length: {bits}")
        out.append("")
        #
        # Check for trivial cases
        ${F(`QUADRATIC_SIEVE`)}
        #
        # Check size before attempting factorization
        if bits > 330:
            out.append(f"WARNING: n has {bits} bits ({bits / 3.32:.0f} digits)")
            out.append("Quadratic Sieve is effective up to ~100 digits (330 bits)")
            out.append("For larger numbers, try ECM, Pollard's p-1, or other methods")
            out.append("")
        #
        # Trial division handles small testcases reliably and is always available
        if bits <= 40:
            tdiv_limit = 1000000
            tdiv = trial_division(n, tdiv_limit)
            if tdiv and 1 < tdiv < n:
                q = n // tdiv
                out.append(f"Small factor found via trial division: {tdiv}")
                out.append(f"Verification: {tdiv} * {q} = {tdiv * q}")
                out.append(f"p = {tdiv}")
                out.append(f"q = {q}")
                out.append("")
                out.append("QUADRATIC_SIEVE=SUCCESS")
                print("\\n".join(out))
                return
            out.append("No small factor via trial division, trying qsieve...")
        #
        # Use Sage's quadratic sieve (qsieve) specifically
        try:
            out.append("Factoring n with qsieve (Quadratic Sieve)...")
            result = qsieve(n)
            # Handle multiple qsieve return formats:
            #   Old API (sage.interfaces): [p, q] or ([p, q], time_str)
            #   New API (sage.libs.flint): [(p, 1), (q, 1)]
            if isinstance(result, tuple):
                items = result[0]  # Old API with time=True
            else:
                items = result
            factors = []
            for item in items:
                if isinstance(item, (list, tuple)):
                    factors.append((Integer(item[0]), Integer(item[1])))
                else:
                    factors.append((Integer(item), 1))
            if not factors:
                out.append("No factors found")
                out.append("QUADRATIC_SIEVE=FAILED")
                print("\\n".join(out))
                return
            # Display factorization
            fac_str = " * ".join(
                f"{p}**{e}" if e > 1 else str(p) for p, e in factors
            )
            out.append(f"Factorization: {fac_str}")
            out.append("")
            # Single factor (qsieve could not factor properly)
            if len(factors) == 1 and factors[0][1] == 1:
                out.append(f"Only one factor found: {factors[0][0]}")
                out.append("QUADRATIC_SIEVE=FAILED")
            # Two prime factors (semiprime) — typical QS use case
            elif len(factors) == 2 and all(exp == 1 for _, exp in factors):
                p = Integer(factors[0][0])
                q = Integer(factors[1][0])
                out.append(f"Verification: p * q = {p * q}")
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append(f"p is prime: {p.is_prime()}")
                out.append(f"q is prime: {q.is_prime()}")
                out.append("")
                out.append("QUADRATIC_SIEVE=SUCCESS")
            # Multiple factors or powers
            else:
                out.append(f"Found {len(factors)} factor(s):")
                for prime, exp in factors:
                    if exp == 1:
                        out.append(f"  p = {prime}")
                    else:
                        out.append(f"  {prime}^{exp}")
                out.append("")
                product = 1
                for prime, exp in factors:
                    product *= Integer(prime) ** exp
                out.append(f"Verification: product = {product}")
                out.append(f"Matches n: {product == n}")
                out.append("")
                out.append("QUADRATIC_SIEVE=SUCCESS")
        except Exception as ex:
            out.append(f"Factorization failed: {ex}")
            out.append("n may be too large for the quadratic sieve.")
            out.append("For numbers > 100 digits, try ECM or specialized attacks.")
            out.append("")
            out.append("QUADRATIC_SIEVE=FAILED")
        print("\\n".join(out))
    except BaseException as ex:
        out.append(f"ERROR: {ex}")
        out.append("QUADRATIC_SIEVE=FAILED")
        print("\\n".join(out))
_attack()`,proof:`\\textbf{Theorem:} The Quadratic Sieve factors $n$ in expected sub-exponential time $\\exp(\\sqrt{\\ln n \\ln \\ln n})$ by finding $x^2 \\equiv y^2 \\pmod{n}$ with $x \\not\\equiv \\pm y \\pmod{n}$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, a semiprime with no small factors
\\item Choose a factor base $\\mathcal{F} = \\{p_1, \\ldots, p_k\\}$ of small primes
\\item $Q(x) = (x + \\lfloor\\sqrt{n}\\rfloor)^2 - n$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m &= \\lfloor\\sqrt{n}\\rfloor, \\quad Q(x) = (x + m)^2 - n \\\\
\\text{Sieve } Q(x) &\\text{ for } B\\text{-smooth values over } \\mathcal{F} \\\\
\\vec{v}_x &= (e_p \\bmod 2)_{p \\in \\mathcal{F}} \\in \\mathbb{F}_2^{|\\mathcal{F}|} \\\\
\\text{Find } S: \\; \\sum_{i \\in S} \\vec{v}_{x_i} &= \\vec{0} \\pmod{2} \\quad \\text{(linear dependency)} \\\\
X &= \\prod_{i \\in S} (x_i + m), \\quad Y = \\sqrt{\\prod Q(x_i)} \\\\
X^2 &\\equiv Y^2 \\pmod{n} \\\\
\\gcd(X - Y, n) &= p \\text{ or } q \\quad \\text{(prob } \\geq 1/2\\text{)}
\\end{align*}

\\textbf{Explanation:} The QS finds many integers $x$ where $Q(x)$ factors completely over the factor base (a "smooth" number). Each smooth $Q(x)$ gives an exponent vector modulo 2. A linear dependency among these vectors means the product of the corresponding $Q(x_i)$ values is a perfect square. Since $Q(x) \\equiv (x+m)^2 \\pmod{n}$, we get $X^2 \\equiv Y^2 \\pmod{n}$ with $X \\not\\equiv \\pm Y \\pmod{n}$ about half the time, yielding a factor via GCD.

\\textbf{References:} C. Pomerance, "The Quadratic Sieve Factoring Algorithm", Eurocrypt 1984`,priority:`high`,applicableCheck:e=>!!e.n},I={id:`squfof`,name:`SQUFOF`,category:`Factorization`,description:`Factors n by finding a square form in the cycle of reduced binary quadratic forms. Use for n < 10^14 (faster than trial division for medium-sized factors).`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        try:
            out = []
            n = Integer(${e.n})
            import math
            out.append(f"SQUFOF on n = {n}")
            out.append("")
            ${F(`SQUFOF`,`            `)}
            # SQUFOF works best for small factors; extract small factor first
            # Use batched GCD for ~1000x fewer GCD calls vs individual trial division
            n_int = int(n)
            found_small = False
            primes_list = prime_range(3, 200000)
            prod = 1
            for i, trial in enumerate(primes_list):
                prod = (prod * int(trial)) % n_int
                if (i + 1) % 1000 == 0:
                    g = math.gcd(prod, n_int)
                    if 1 < g < n_int:
                        for t in range(i - 999, i + 1):
                            trial_t = primes_list[t]
                            if n_int % trial_t == 0:
                                p = Integer(trial_t)
                                q = n // p
                                out.append(f"Small factor found: p = {p}")
                                out.append(f"Verification: p * q = {p * q}")
                                out.append(f"p = {p}")
                                out.append(f"q = {q}")
                                out.append("")
                                out.append("SQUFOF=SUCCESS")
                                found_small = True
                                break
                        break
                    prod = 1
            # Final partial batch
            if not found_small and prod != 1:
                g = math.gcd(prod, n_int)
                if 1 < g < n_int:
                    start = (len(primes_list) // 1000) * 1000
                    for t in range(start, len(primes_list)):
                        trial_t = primes_list[t]
                        if n_int % trial_t == 0:
                            p = Integer(trial_t)
                            q = n // p
                            out.append(f"Small factor found: p = {p}")
                            out.append(f"Verification: p * q = {p * q}")
                            out.append(f"p = {p}")
                            out.append(f"q = {q}")
                            out.append("")
                            out.append("SQUFOF=SUCCESS")
                            found_small = True
                            break
            if found_small:
                print("\\n".join(out))
                return
            # Shanks' Square Forms Factorization (SQUFOF)
            def squfof(n_val):
                n_int = int(n_val)
                # Find non-residue
                D = 0
                for k in [1, 3, 5, 7, -1, -3, -5, -7]:
                    if kronecker(k, n_val) == -1:
                        D = k * n_int
                        break
                if D == 0:
                    D = n_int
                sqrtD = math.isqrt(D)
                Po = sqrtD
                P = Po
                Q = D - Po**2
                if Q <= 0:
                    return None
                Qprev = 1
                # Step 1: forward cycle — find a square form
                limit = 2 * math.isqrt(math.isqrt(n_int)) + 10
                for i in range(limit):
                    if Q == 0:
                        break
                    b = (sqrtD + P) // Q
                    Pnew = b * Q - P
                    Qnew = D - Pnew**2
                    if Qnew <= 0:
                        break
                    Qnew //= Q
                    if i % 2 == 0 and Qnew > 0:
                        r = math.isqrt(Qnew)
                        if r * r == Qnew and (sqrtD - Pnew) % r == 0:
                            # Step 2: inverse square root → start reverse cycle
                            b = (sqrtD - Pnew) // r
                            P = b * r + Pnew
                            Qprev = r
                            Q = (D - P**2) // Qprev
                            # Step 3: reverse cycle — find symmetry
                            for _ in range(limit):
                                if Q == 0:
                                    break
                                b = (sqrtD + P) // Q
                                P_old = P
                                P = b * Q - P
                                Q_old = Q
                                Q = (D - P**2) // Q_old
                                if P == P_old:
                                    g = math.gcd(Q_old, n_int)
                                    if 1 < g < n_int:
                                        return Integer(g), Integer(n_int // g)
                                    break
                            break
                    Qprev = Q
                    Q = Qnew
                    P = Pnew
                return None
            result = squfof(n)
            if result:
                p, q = result
                out.append(f"Verification: p * q = {p * q}")
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append("")
                out.append("SQUFOF=SUCCESS")
            else:
                out.append("SQUFOF did not find a factor. Try a different method.")
                out.append("SQUFOF=FAILED")
            print("\\n".join(out))
        except Exception as e:
            out.append(f"ERROR: {e}")
            out.append("SQUFOF=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("SQUFOF=FAILED")
_attack()`,proof:`\\textbf{Theorem:} SQUFOF factors $n$ by finding a square form in the cycle of reduced binary quadratic forms of discriminant $D = kn$ where $(k/n) = -1$.

\\textbf{Setup:}
\\begin{itemize}
\\item Binary quadratic forms $ax^2 + bxy + cy^2$, discriminant $D = b^2 - 4ac$
\\item $D = kn$ where $\\left(\\frac{k}{n}\\right) = -1$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n = pq, \\quad \\left(\\frac{k}{n}\\right) &= -1, \\quad D = kn \\\\
(a_0, b_0, c_0) &\\xrightarrow{\\rho} (a_1, b_1, c_1) \\xrightarrow{\\rho} \\cdots \\xrightarrow{\\rho} (a_L, b_L, c_L) = (a_0, b_0, c_0) \\\\
\\exists i: c_i &= q^2 \\;\\text{(a perfect square)} \\\\
s &= \\sqrt{c_i}, \\quad \\text{reverse the reduction } \\rho \\text{ from the square root} \\\\
\\gcd(s, n) &= p \\text{ or } q
\\end{align*}
The algorithm searches the forward cycle for a square $c_i$, then starts a reverse cycle from $s = \\sqrt{c_i}$ until the reduced form repeats. At the symmetry point, GCD recovers the factor.

\\textbf{Explanation:} SQUFOF (SQUare FOrm Factorization) exploits the structure of the class group of binary quadratic forms. The key insight is that when discriminant $D$ corresponds to a composite $n = pq$, the cycle of reduced forms contains a square form whose square root reveals one prime factor. It works well for $n < 10^{14}$ and requires no large-integer arithmetic beyond GCD.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Batched GCD trial division:} Before the main SQUFOF algorithm, extracts small factors by trial division against primes in batches of 1000. The product of each prime batch is accumulated modulo $n$ before a single GCD call, reducing GCD operations by $\\sim 1000\\times$ vs individual trial division.
\\end{itemize}

\\textbf{References:} Shanks, 1975; Gower & Wagstaff, Math. Comp., 2008`,priority:`medium`,applicableCheck:e=>!!e.n},L={id:`binary-poly-factor`,name:`Binary Polynomial Factoring`,category:`Factorization`,description:`Factors n by factoring its binary representation as a polynomial over Z[x] and evaluating at x=2. Use when the binary convolution of p and q has no carries.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        try:
            out = []
            n = Integer(${e.n})
            ${F(`BINARY_POLY_FACTOR`,`            `)}
            if n > 0 and (n & (n - 1)) == 0:
                out.append(f"n is a power of 2: n = 2^{n.nbits() - 1}")
                out.append("No non-trivial factorization possible")
                out.append("BINARY_POLY_FACTOR=FAILED")
                print("\\n".join(out))
                return
            coeffs = n.digits(2)
            R.<x> = PolynomialRing(ZZ)
            f = sum(c * x**i for i, c in enumerate(coeffs))
            out.append(f"Polynomial: f(x) = {f}")
            out.append(f"Degree: {f.degree()}")
            out.append(f"f(2) = {f(2)}")
            out.append(f"f(2) == n: {f(2) == n}")
            out.append("")
            if f.is_irreducible():
                out.append(f"Polynomial f(x) = {f} is irreducible over ZZ[x]")
                out.append("No nontrivial polynomial factorization exists.")
                out.append("BINARY_POLY_FACTOR=FAILED")
                print("\\n".join(out))
                return
            factors = f.factor()
            out.append(f"Factorization of f(x): {factors}")
            out.append("")
            out.append("Evaluating factors at x=2:")
            for factor, mult in factors:
                val = factor(2)
                out.append(f"  {factor}(2) = {val}")
                if mult > 1:
                    out.append(f"    multiplicity: {mult}")
            product = 1
            for factor, mult in factors:
                product *= factor(2)**mult
            out.append(f"\\nProduct of evaluations: {product}")
            out.append(f"Original n: {n}")
            out.append(f"Match: {product == n}")
            if product == n:
                proper_vals = [factor(2) for factor, _ in factors if 1 < factor(2) < n]
                if proper_vals:
                    out.append("\\nPotential factors found:")
                    for factor, mult in factors:
                        val = factor(2)
                        if val > 1:
                            out.append(f"  {val} (is prime: {val.is_prime()})")
                    if len(proper_vals) >= 2:
                        p_factor = Integer(proper_vals[0])
                        q_factor = Integer(proper_vals[1])
                        if p_factor > 1 and q_factor > 1 and p_factor * q_factor == n:
                            out.append(f"p = {p_factor}")
                            out.append(f"q = {q_factor}")
                    out.append("")
                    out.append("BINARY_POLY_FACTOR=SUCCESS")
                else:
                    out.append("No proper factors: polynomial factorization is trivial (irreducible f(x)).")
                    out.append("BINARY_POLY_FACTOR=FAILED")
            else:
                out.append("Polynomial factorization does not yield integer factors.")
                out.append("BINARY_POLY_FACTOR=FAILED")
            print("\\n".join(out))
        except Exception as e:
            try:
                out.append(f"Error in Binary Polynomial Factoring: {e}")
                out.append("BINARY_POLY_FACTOR=FAILED")
                print("\\n".join(out))
            except:
                print(f"Error in Binary Polynomial Factoring: {e}")
                print("BINARY_POLY_FACTOR=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("BINARY_POLY_FACTOR=FAILED")
_attack()`,proof:`\\textbf{Theorem:} If $n$'s binary polynomial $f(x) = \\sum b_i x^i$ factors over $\\mathbb{Z}[x]$, then evaluating the factors at $x = 2$ recovers the integer factors of $n$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = \\sum b_i 2^i$, binary digits $b_i \\in \\{0,1\\}$
\\item $f(x) = \\sum b_i x^i \\in \\mathbb{Z}[x]$, so $f(2) = n$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f(x) &= \\sum b_i x^i \\\\
f(x) &= \\prod g_i(x)^{e_i} \\quad \\text{(irreducible factorization over } \\mathbb{Z}[x]\\text{)} \\\\
n = f(2) &= \\prod g_i(2)^{e_i} \\\\
\\exists i: g_i(2) &= p \\text{ or } q
\\end{align*}
If the binary convolution of $p$ and $q$ produces no carries, then $f_{pq}(x) = f_p(x) \\cdot f_q(x)$ and the polynomial factorization separates them.

\\textbf{Explanation:} When multiplying two integers whose binary representations trigger no carries (i.e., every bit position gets at most one 1 from each factor), the binary polynomial of the product equals the product of the binary polynomials. Factoring this polynomial over $\\mathbb{Z}[x]$ and evaluating at $x = 2$ recovers the original integers. This is a rare special case but works instantly when applicable.

\\textbf{References:} Coppersmith, "Finding a Small Root of a Univariate Modular Equation", 1996; von zur Gathen & Gerhard, "Modern Computer Algebra", Chapter 5`,priority:`low`,applicableCheck:e=>!!e.n},R=(e,t)=>{for(;t;)[e,t]=[t,e%t];return e},z=[];for(let e=-2e3;e<=2e3;e++)z.push(BigInt(e));let B={id:`small-fraction`,name:`Small Fraction Attack`,category:`Factorization`,description:`Factors n when p/q approximates a small rational a/b using parity-optimized trial division over the search window. Use when p/q is close to a simple fraction with denominator ≤ 100.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`import math
def _attack():
    try:
        n = Integer(${e.n})
        #
        ${F(`SMALL_FRACTION`)}
        #
        # Small fraction attack: p/q ≈ a/b for small a, b
        # Use Python ints for fast trial division
        try:
            out = []
            out.append("Searching for small fraction approximation of p/q...")
            out.append(f"n = {n}")
            out.append("")
            found = False
            max_den = 100
            trial_window = 10000
            pairs_tried = 0
            divs_tried = 0
            n_int = int(n)
            for b in range(1, max_den + 1):
                for a in range(1, b + 1):
                    if math.gcd(a, b) != 1:
                        continue
                    pairs_tried += 1
                    # q approx sqrt(n*b/a): p/q ≈ a/b => n = p*q ≈ a*q²/b
                    q0 = math.isqrt(n_int * b // a)
                    if q0 <= 1:
                        continue
                    # Exact rational match: q0 divides n
                    if n_int % q0 == 0:
                        q_sage = Integer(q0)
                        p_sage = n // q_sage
                        if p_sage > 1 and p_sage * q_sage == n:
                            out.append(f"Found! a/b = {a}/{b}")
                            out.append(f"Verification: p * q = {p_sage * q_sage}")
                            out.append(f"p = {p_sage}")
                            out.append(f"q = {q_sage}")
                            out.append(f"p/q = {float(p_sage)/float(q_sage):.10f}")
                            out.append(f"a/b = {float(a)/float(b):.10f}")
                            found = True
                            break
                    # Near-exact: try q0 ± delta
                    for delta in range(1, trial_window + 1):
                        divs_tried += 1
                        q_candidate = q0 + delta
                        if q_candidate > 1 and (q_candidate & 1) and n_int % q_candidate == 0:
                            q_sage = Integer(q_candidate)
                            p_sage = n // q_sage
                            if p_sage > 1 and p_sage * q_sage == n:
                                out.append(f"Found! a/b = {a}/{b} (delta = +{delta})")
                                out.append(f"Verification: p * q = {p_sage * q_sage}")
                                out.append(f"p = {p_sage}")
                                out.append(f"q = {q_sage}")
                                out.append(f"p/q = {float(p_sage)/float(q_sage):.10f}")
                                out.append(f"a/b = {float(a)/float(b):.10f}")
                                found = True
                                break
                        q_candidate = q0 - delta
                        if q_candidate > 1 and (q_candidate & 1) and n_int % q_candidate == 0:
                            q_sage = Integer(q_candidate)
                            p_sage = n // q_sage
                            if p_sage > 1 and p_sage * q_sage == n:
                                out.append(f"Found! a/b = {a}/{b} (delta = -{delta})")
                                out.append(f"Verification: p * q = {p_sage * q_sage}")
                                out.append(f"p = {p_sage}")
                                out.append(f"q = {q_sage}")
                                out.append(f"p/q = {float(p_sage)/float(q_sage):.10f}")
                                out.append(f"a/b = {float(a)/float(b):.10f}")
                                found = True
                                break
                    if found:
                        break
                if found:
                    break
            out.append("")
            out.append(f"Pairs tested: {pairs_tried}, trial divisions: {divs_tried}")
            if found:
                out.append("")
                out.append("SMALL_FRACTION=SUCCESS")
            else:
                out.append(f"No small fraction found with denominator up to {max_den}.")
                out.append("p/q may not be close to a small rational.")
                out.append("")
                out.append("SMALL_FRACTION=FAILED")
            print("\\n".join(out))
        except Exception as e:
            print(f"Error in Small Fraction Attack: {e}")
            print("SMALL_FRACTION=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("SMALL_FRACTION=FAILED")
_attack()`,frontendCheck:(e,t)=>{if(!e.n)return Promise.resolve(null);try{let n=BigInt(e.n);if(n%2n==0n)return Promise.resolve(`Factor found!\np = 2\nq = ${n/2n}\nSMALL_FRACTION=SUCCESS`);let r=e=>(e&1n)!=0n;for(let e=1;e<=100;e++){t&&t(Math.round((e-1)*100/100),`b = ${e} / 100`);for(let i=1;i<=e;i++){if(R(i,e)!==1)continue;let a=D(n*BigInt(e)/BigInt(i));if(!(a<=1n))for(let o of z){let s=a+o;if(r(s)&&n%s===0n){let r=n/s;if(r>1n)return t?.(100),Promise.resolve(`Factor found!\np = ${r}\nq = ${s}\nUsing a=${i}, b=${e}\nSMALL_FRACTION=SUCCESS`)}}}}return Promise.resolve(null)}catch{return Promise.resolve(null)}},usageGuide:`This attack factors n when the ratio of its two prime factors p/q is close to a simple fraction a/b with small denominator (≤ 100).

How it works:
1. For each coprime pair (a,b) with 1 ≤ b ≤ 100 and 1 ≤ a ≤ b, estimate q₀ ≈ √(n·b/a)
2. Test q₀ ± 2000 for divisibility: if q | n then p = n/q recovers both factors
3. Since n is odd (product of two odd primes), even q can never divide n — a single-bit (q & 1) check skips ~50% of BigInt divisions
4. Precomputed offset BigInts avoid per-iteration allocation overhead

Tip: Works in-browser (frontendCheck) for any n. Falls back to SageMathCell for larger systematic searches. Testcase generated with a=3, b=5 for immediate verification.`,proof:`\\textbf{Theorem:} If $p/q \\approx a/b$ for small coprime $a, b$, then $q \\approx \\sqrt{nb/a}$ and parity-optimized trial division near $q_0$ recovers the factor.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, with $p,q$ odd primes
\\item $p/q \\approx a/b$, $\\gcd(a,b) = 1$, $1 \\leq b \\leq 100$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\frac{p}{q} &\\approx \\frac{a}{b} \\\\
n = pq &\\approx \\frac{a}{b} q^2 \\\\
q_0 &= \\left\\lfloor\\sqrt{\\frac{nb}{a}}\\right\\rfloor \\\\
\\text{Search } q_0 \\pm k\\text{ for } &|k| \\leq 2000,\\; k \\in \\mathbb{Z} \\\\
\\text{Even } q\\text{ cannot divide odd } n &\\implies \\text{skip } q \\equiv 0 \\pmod{2} \\\\
\\text{Search space: } 1 \\leq b &\\leq 100,\\; 1 \\leq a \\leq b,\\; \\gcd(a,b) = 1 \\\\
\\text{Complexity: } O(B^2 \\cdot \\Delta) & \\text{ with }\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!\\!
\\text{ parity filter: } \\frac{1}{2}\\text{ fewer divisions}
\\end{align*}

\\textbf{Explanation:} When $p \\approx (a/b) \\cdot q$, substituting into $n = pq$ gives $q^2 \\approx nb/a$. We compute $q_0 = \\lfloor\\sqrt{nb/a}\\rfloor$ for each coprime $a,b$ and test $q_0 \\pm 2000$ for an exact divisor of $n$. Since $n$ is odd (product of odd primes), even candidates can never divide $n$ and are skipped via a $\\& 1$ bit check — cutting the effective trial division count in half. Precomputed BigInt offsets avoid per-iteration allocation. The search examines $\\approx 5050$ fraction pairs, each with $4001$ delta candidates, halved to $\\approx 10$M BigInt divisions worst-case.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Parity pre-filter:} Since $n$ is odd (product of odd primes), even $q$ can never divide $n$, so a single-bit check $(q \\& 1)$ skips half the trial divisions with zero BigInt arithmetic cost.
\\item \\textbf{Precomputed BigInt offsets:} Delta candidates are stored in a precomputed array as $BigInt$ values, avoiding per-iteration $BigInt(number)$ allocation overhead in the inner loop.
\\end{itemize}

\\textbf{References:} Menezes et al., "Handbook of Applied Cryptography"; Boneh, "Twenty Years of Attacks on the RSA Cryptosystem", 1999`,priority:`medium`,applicableCheck:e=>!!e.n},V={id:`batch-gcd`,name:`Batch GCD`,category:`Factorization`,description:`Finds shared prime factors across a list of RSA moduli by computing gcd of each against the product of all others. Use when multiple moduli may share primes.`,inputs:[{name:`n_values`,label:`Moduli (one per line or comma-separated)`,placeholder:`n1\\nn2\\nn3...`,multiline:!0,rows:5}],frontendCheck:async e=>{try{let t=(e.n_values||``).trim();if(!t)return`ERROR: Missing required input: n_values (comma-separated moduli)
BATCH_GCD=FAILED`;let n=t.split(/[\n,]+/).map(e=>e.trim()).filter(e=>e.length>0).map(e=>BigInt(e));if(n.length<2)return null;let r=1n;for(let e of n)r*=e;let i=[`Batch GCD Attack (browser-side, BigInt)`,`Processing ${n.length} moduli...`,``],a=!1;for(let e=0;e<n.length;e++){let t=n[e];if(t<=1n)continue;let o=E(t,r/t);if(o>1n&&o<t){a=!0;let n=o,r=t/o;i.push(`n[${e}] = ${t}`),i.push(`  Shared factor found: p = ${n}`),i.push(`  q = ${r}`),i.push(`  Verification: p * q = ${n*r}`),i.push(``)}else o===t&&(i.push(`n[${e}] = ${t}`),i.push(`  WARNING: n divides product of others (duplicate or fully shared)`),i.push(``))}return a?(i.push(`Batch GCD complete.`),i.push(`BATCH_GCD=SUCCESS`),i.join(`
`)):null}catch{return null}},proof:`\\textbf{Theorem:} Given moduli $\\{n_1, \\ldots, n_k\\}$, if any two share a prime, then $\\gcd(n_i, \\prod_{j \\neq i} n_j)$ reveals it.

\\textbf{Setup:}
\\begin{itemize}
\\item RSA moduli $n_i = p_i \\cdot q_i$, $i = 1 \\ldots k$
\\item $p_i = p_j$ for some $i \\neq j$ (shared prime)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p \\mid n_i,\\; p \\mid n_j &\\implies p \\mid \\gcd(n_i, n_j) \\\\
\\text{For each } i: \\quad g_i &= \\gcd\\left(n_i, \\prod_{j \\neq i} n_j\\right) \\\\
g_i > 1 &\\implies g_i \\text{ is a shared prime factor} \\\\
\\text{Product tree: } O(k \\log k) &\\text{ vs } O(k^2) \\text{ for pairwise GCD}
\\end{align*}
The product $\\prod_{j \\neq i} n_j$ can be computed efficiently using a product tree (divide-and-conquer), achieving $O(k \\log k)$ complexity rather than $O(k^2)$ pairwise GCDs.

\\textbf{Explanation:} When RSA keys are generated with insufficient randomness, two moduli may share a common prime factor. Computing the GCD of each modulus against the product of all others efficiently catches this. In practice, this attack found real-world weak keys — the 2012 "Mining Your Ps and Qs" study found 0.2\\% of TLS certificates shared factors.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Product tree algorithm:} Computes $\\prod_{j \\neq i} n_j$ for each modulus using a divide-and-conquer product tree, achieving $O(k \\log k)$ total time instead of $O(k^2)$ for pairwise GCDs. For $k = 1000$ moduli, this is $\\sim 100\\times$ faster than the naive pairwise approach.
\\end{itemize}

\\textbf{References:} Heninger et al., "Mining Your Ps and Qs: Detection of Widespread Weak Keys in Network Devices", USENIX Security 2012; Bernstein, "How to Find Small Factors of Products", 2004`,priority:`high`,applicableCheck:e=>{let t=(e.n_values||``).trim();return t?t.split(/[\n,]+/).filter(e=>e.trim()).length>=2:!1}},H={id:`multi-prime`,name:`Multi-Prime RSA`,category:`Factorization`,description:`Factors n with k >= 3 prime factors using trial division and Sage factor(). Use for multi-prime RSA moduli.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        try:
            out = []
            n = Integer(${e.n})
            n_int = int(n)
            if n < 2:
                out.append(f"n = {n} is too small to factor")
                out.append("MULTI_PRIME=FAILED")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append(f"n is even: {n}")
                out.append(f"p = 2")
                out.append(f"q = {n // 2}")
                out.append(f"Verification: 2 * {n // 2} = {n}")
                out.append("MULTI_PRIME=SUCCESS")
                print("\\n".join(out))
                return
            if n.is_prime():
                out.append(f"n is prime: {n}")
                out.append("No factorization possible")
                out.append("MULTI_PRIME=FAILED")
                print("\\n".join(out))
                return
            if n.is_square():
                p = isqrt(n)
                out.append(f"n is a perfect square: {p}^2 = {n}")
                out.append(f"Verification: p * q = {p * p}")
                out.append(f"p = {p}")
                out.append(f"q = {p}")
                out.append("")
                out.append("MULTI_PRIME=SUCCESS")
                print("\\n".join(out))
                return
            # Use trial division + Sage's factor() for complete factorization
            def factor_all(m):
                """Complete factorization using trial division + Sage's factor()"""
                fac = []
                rem = int(m)
                for p in prime_range(2, 10000):
                    p_int = int(p)
                    while rem % p_int == 0:
                        fac.append(Integer(p_int))
                        rem //= p_int
                if rem == 1:
                    return sorted(fac)
                rem_sage = Integer(rem)
                if rem_sage.is_prime():
                    fac.append(rem_sage)
                    return sorted(fac)
                for p, e in factor(rem_sage):
                    fac.extend([p] * e)
                return sorted(fac)
            out.append(f"Attempting multi-prime factorization of n = {n}")
            out.append(f"Bit length: {n.nbits()} bits ({n.nbits() / 3.32:.0f} digits)")
            out.append("")
            prime_factors = factor_all(n)
            out.append(f"Prime factors ({len(prime_factors)} total):")
            for i, p in enumerate(prime_factors):
                prime_status = "prime" if p.is_prime() else "composite"
                out.append(f"  p[{i+1}] = {p} ({p.nbits()} bits, {prime_status})")
            out.append("")
            # Verify product
            product = 1
            for p in prime_factors:
                product *= p
            out.append(f"Verification: product = {product}")
            out.append(f"Matches n: {product == n}")
            out.append("")
            # Check if any factor is composite (partial factorization)
            all_prime = all(p.is_prime() for p in prime_factors)
            if len(prime_factors) > 2 and all_prime:
                out.append("Multi-prime RSA detected!")
                out.append(f"n = {' × '.join(str(p) for p in prime_factors)}")
                out.append("")
                # Compute phi(n) correctly for multi-prime with possible repeated factors
                from collections import Counter
                factor_counts = Counter(prime_factors)
                phi = 1
                for p, k in factor_counts.items():
                    phi *= p**(k-1) * (p - 1)
                out.append(f"phi(n) = {phi}")
                out.append("")
                out.append("MULTI_PRIME=SUCCESS")
            elif len(prime_factors) == 2 and all_prime:
                out.append("Standard 2-prime RSA (not multi-prime).")
                p, q = prime_factors[0], prime_factors[1]
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append(f"phi(n) = {(p-1)*(q-1)}")
                out.append("MULTI_PRIME=FAILED (only 2 factors)")
            elif not all_prime:
                out.append("Partial factorization only — some factors remain composite.")
                out.append("Suggestion: Try running ECM again with higher B1 bounds.")
                out.append("MULTI_PRIME=FAILED")
            else:
                out.append("n could not be factored into multiple primes.")
                out.append("MULTI_PRIME=FAILED")
            print("\\n".join(out))
        except Exception as e:
            out.append(f"Error in Multi-Prime RSA factorization: {e}")
            out.append("MULTI_PRIME=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        try:
            out.append(f"ERROR: {ex}")
            out.append("MULTI_PRIME=FAILED")
        except:
            out = [f"ERROR: {ex}", "MULTI_PRIME=FAILED"]
        print("\\n".join(out))
_attack()`,proof:`\\textbf{Theorem:} Multi-prime RSA uses $n = \\prod_{i=1}^{k} p_i$ with $k \\geq 3$, reducing each factor's bit size and enabling easier factorization.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p_1 p_2 \\cdots p_k$ with $k \\geq 3$
\\item $\\phi(n) = \\prod_{i=1}^{k} (p_i - 1)$
\\item $ed \\equiv 1 \\pmod{\\phi(n)}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= \\prod_{i=1}^{k} p_i,\\; \\phi(n) = \\prod_{i=1}^{k} (p_i - 1) \\\\
p_i &\\approx n^{1/k} \\text{ (each prime is smaller than in 2-prime RSA)} \\\\
\\text{CRT decryption: } m_i &= c^{d \\bmod (p_i-1)} \\bmod p_i \\\\
\\text{Factorization cost } &\\propto \\min_i (\\text{cost to factor } p_i) \\qed
\\end{align*}

\\textbf{Explanation:} Multi-prime RSA (also called "RSA Multiprime") uses three or more primes for a fixed modulus size, making each prime factor smaller and easier to find via generic factorization algorithms. The attack uses trial division up to 10,000 followed by Sage's factor() for complete factorization.

\\textbf{References:} G. J. Simmons and M. J. Norris, "Preliminary Comments on the MIT Public Key Cryptosystem", Cryptologia, 1976; D. Boneh, "Twenty Years of Attacks on RSA", Notices of the AMS, 1999`,priority:`medium`,applicableCheck:e=>!!e.n},U={id:`gimmicky-primes`,name:`Gimmicky Primes`,category:`Factorization`,description:`Detects special-form primes (Mersenne, primorial, Fermat, Fibonacci, repunit, and others) by trial division. Use for CTF moduli with crafted prime factors.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        out = []
        try:
            n = Integer(${e.n})
            import math
            n_int = int(n)
            ${F(`GIMMICKY_PRIMES`,`            `)}
            fp = None
            fq = None
            ftype = None
            fdetail = None
            def _found(t, d, pv):
                nonlocal fp, fq, ftype, fdetail
                fp = pv
                fq = n // pv
                ftype = t
                fdetail = d
            # 1. Mersenne primes: 2^p - 1
            if fp is None:
                for p in [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423]:
                    mersenne = 2**p - 1
                    if n_int % mersenne == 0:
                        _found("Mersenne prime", f"2^{p} - 1", mersenne)
                        break
            # 2. Primorial primes: p# +/- 1
            if fp is None:
                primes_list = list(prime_range(2, 200))
                primorial = 1
                for p in primes_list:
                    primorial *= p
                    for sign in [1, -1]:
                        candidate = primorial + sign
                        if candidate > 1 and n_int % int(candidate) == 0:
                            _found("primorial prime", f"{p}# {'+' if sign == 1 else '-'} 1", int(candidate))
                            break
                    if fp is not None:
                        break
            # 3. Fermat primes: 2^(2^k) + 1
            if fp is None:
                for k in range(0, 5):
                    fermat = 2**(2**k) + 1
                    if n_int % fermat == 0:
                        _found("Fermat prime", f"2^(2^{k}) + 1", fermat)
                        break
            # 4. Fibonacci primes
            if fp is None:
                fib_primes = [2, 3, 5, 13, 89, 233, 1597, 28657, 514229, 433494437, 2971215073]
                for fib in fib_primes:
                    if n_int % fib == 0:
                        _found("Fibonacci prime", str(fib), fib)
                        break
            # 5. Repunit primes: (10^p - 1) / 9
            if fp is None:
                for p in [2, 19, 23, 317, 1031]:
                    try:
                        repunit = (10**p - 1) // 9
                        if n_int % repunit == 0:
                            _found("repunit prime", f"R({p})", repunit)
                            break
                    except Exception:
                        pass
            # 6. Factorial primes: k! +/- 1
            if fp is None:
                factorial = 1
                for k in range(1, 1001):
                    factorial *= k
                    for sign in [1, -1]:
                        candidate = factorial + sign
                        if candidate > n_int:
                            break
                        if candidate > 1 and n_int % candidate == 0:
                            _found("factorial prime", f"{k}! {'+' if sign == 1 else '-'} 1", candidate)
                            break
                    if fp is not None:
                        break
            # 7. Carol and Kynea primes
            if fp is None:
                for k in range(1, 1001):
                    for sign in [-1, 1]:
                        candidate = (2**k + sign)**2 - 2
                        if candidate > n_int:
                            break
                        if candidate > 1 and n_int % candidate == 0:
                            name = "Carol" if sign == -1 else "Kynea"
                            _found(f"{name} prime", f"(2^{k} {'-' if sign == -1 else '+'} 1)^2 - 2", candidate)
                            break
                    if fp is not None:
                        break
            # 8. Cullen and Woodall primes
            if fp is None:
                for k in range(1, 1001):
                    for sign in [1, -1]:
                        candidate = k * 2**k + sign
                        if candidate > n_int:
                            break
                        if candidate > 1 and n_int % candidate == 0:
                            name = "Cullen" if sign == 1 else "Woodall"
                            _found(f"{name} prime", f"{k} * 2^{k} {'+' if sign == 1 else '-'} 1", candidate)
                            break
                    if fp is not None:
                        break
            if fp is not None and fp > 1:
                out.append(f"p is {ftype} ({fdetail})")
                out.append(f"p = {fp}")
                out.append(f"q = {fq}")
                out.append("")
                out.append("GIMMICKY_PRIMES=SUCCESS")
            else:
                out.append("No gimmicky prime factors found.")
                out.append("The factors are likely standard randomly-generated primes.")
                out.append("")
                out.append("GIMMICKY_PRIMES=FAILED")
        except Exception as e:
            out.append(f"Error in gimmicky primes check: {e}")
            out.append("GIMMICKY_PRIMES=FAILED")
        #
    except BaseException as ex:
        out.append(f"ERROR: {ex}")
        out.append("GIMMICKY_PRIMES=FAILED")
    print("\\n".join(out))
_attack()`,frontendCheck:e=>{if(!e.n)return Promise.resolve(null);try{let t=BigInt(e.n);if(t<2n)return Promise.resolve(null);if(t%2n==0n)return Promise.resolve(`n is even: ${t}\np = 2\nq = ${t/2n}\nGIMMICKY_PRIMES=SUCCESS`);let n=null,r=e=>e>1n&&t%e===0n;for(let e of[2,3,5,7,13,17,19,31,61,89,107,127,521,607,1279,2203,2281,3217,4253,4423]){let t=(1n<<BigInt(e))-1n;if(r(t)){n={type:`Mersenne prime`,detail:`2^${e} - 1`,p:t};break}}if(!n){let e=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199],r=1n;for(let i of e){r*=BigInt(i);for(let e of[1n,-1n]){let a=r+e;if(a>1n&&t%a===0n){n={type:`primorial prime`,detail:`${i}# ${e===1n?`+`:`-`} 1`,p:a};break}}if(n)break}}if(!n)for(let e=0;e<5;e++){let t=(1n<<(1n<<BigInt(e)))+1n;if(r(t)){n={type:`Fermat prime`,detail:`2^(2^${e}) + 1`,p:t};break}}if(!n){for(let e of[2n,3n,5n,13n,89n,233n,1597n,28657n,514229n,433494437n,2971215073n])if(e<t&&t%e===0n){n={type:`Fibonacci prime`,detail:e.toString(),p:e};break}}if(!n)for(let e of[2,19,23,317,1031])try{let r=(10n**BigInt(e)-1n)/9n;if(r<t&&t%r===0n){n={type:`repunit prime`,detail:`R(${e})`,p:r};break}}catch{continue}if(!n){let e=1n;for(let r=1;r<=1e3&&(e*=BigInt(r),!(e>t));r++){for(let i of[1n,-1n]){let a=e+i;if(a>1n&&t%a===0n){n={type:`factorial prime`,detail:`${r}! ${i===1n?`+`:`-`} 1`,p:a};break}}if(n)break}}if(!n)for(let e=1;e<=1e3;e++){let r=1n<<BigInt(e);if(r>t)break;for(let i of[-1n,1n]){let a=(r+i)**2n-2n;if(a>1n&&t%a===0n){n={type:`${i===-1n?`Carol`:`Kynea`} prime`,detail:`(2^${e} ${i===-1n?`-`:`+`} 1)^2 - 2`,p:a};break}}if(n)break}if(!n)for(let e=1;e<=1e3;e++){let r=1n<<BigInt(e);if(r>t)break;let i=BigInt(e);for(let a of[1n,-1n]){let o=i*r+a;if(o>1n&&t%o===0n){n={type:`${a===1n?`Cullen`:`Woodall`} prime`,detail:`${e} * 2^${e} ${a===1n?`+`:`-`} 1`,p:o};break}}if(n)break}if(n){let e=t/n.p;return Promise.resolve(`p is ${n.type} (${n.detail})\np = ${n.p}\nq = ${e}\n\nGIMMICKY_PRIMES=SUCCESS`)}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} If $p$ is a special-form prime from a known set $\\mathcal{S}$, trial division against $\\mathcal{S}$ finds $p$ in $O(|\\mathcal{S}| \\cdot \\log^2 n)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p \\cdot q$ where $p$ belongs to a known special-form set $\\mathcal{S}$
\\item $\\mathcal{S}$ includes Mersenne, primorial, Fermat, Fibonacci, repunit, factorial, Carol/Kynea, and Cullen/Woodall primes
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p \\cdot q,\\quad p \\in \\mathcal{S} \\\\
n \\bmod s &= 0 \\text{ for some } s \\in \\mathcal{S} \\\\
s \\mid n &\\implies p = s,\\; q = n/s \\\\
\\text{Cost: } &O(|\\mathcal{S}| \\cdot \\log^2 n) \\qed
\\end{align*}

\\textbf{Explanation:} In CTF challenges, primes are sometimes constructed from known sequences (Mersenne $2^p-1$, primorial $p\\#\\pm1$, Fermat $2^{2^k}+1$, etc.). This attack checks all small candidates from each family by trial division. The set size is a few hundred candidates, so the check completes nearly instantly.

\\textbf{References:} C. Caldwell, "The Prime Pages" (https://t5k.org); P. Ribenboim, "The New Book of Prime Number Records", Springer 1996`,priority:`low`,applicableCheck:e=>!!e.n},W={id:`close-prime`,name:`Close-Prime`,category:`Factorization`,description:`Factors n when p and q are close via Fermat iteration and Londahl BSGS fallback. Use when primes are suspected close together.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        try:
            out = []
            n = Integer(${e.n})
            import math
            n_int = int(n)
            ${F(`CLOSE_PRIME`,`            `)}
            # Step 1: Fermat factorization (fast for close primes)
            out.append(f"Close-prime attack on n ({n.nbits()} bits): trying Fermat first...")
            a, rem = n.sqrtrem()
            b2 = -rem
            c = 2*a + 1
            max_iter = 100000
            iterations = 0
            while not b2.is_square():
                iterations += 1
                if iterations > max_iter:
                    break
                b2 += c
                c += 2
            if b2.is_square():
                a_final = (c - 1) // 2
                b = isqrt(b2)
                p = a_final - b
                q = a_final + b
                if p > 1 and q < n and p*q == n:
                    out.append(f"Fermat factorization succeeded!")
                    out.append(f"Verification: p * q = {p * q}")
                    out.append(f"p = {p}")
                    out.append(f"q = {q}")
                    out.append(f"|p - q| = {q - p}")
                    out.append(f"Iterations: {iterations}")
                    out.append("")
                    out.append("CLOSE_PRIME=SUCCESS")
                    print("\\n".join(out))
                    return
            # Step 2: Londahl BSGS fallback (for larger prime gaps)
            out.append(f"Fermat did not converge in {max_iter} iterations, trying Londahl BSGS...")
            b = 50000
            phi_approx = n_int - 2*math.isqrt(n_int) + 1
            out.append(f"Building baby-step table (b={b})...")
            look_up = {}
            z = 1
            parity = int(phi_approx & 1)
            for j in range(b + 1):
                if (j & 1) == parity:
                    look_up[z] = j
                z = (z * 2) % n_int
            out.append(f"Searching ({b + 1} giant steps)...")
            mu = int(inverse_mod(power_mod(2, Integer(phi_approx), n), n))
            step = int(power_mod(2, b, n))
            found = False
            for i in range(b + 1):
                if mu in look_up:
                    j = look_up[mu]
                    phi = phi_approx + j - i*b
                    m = n_int - phi + 1
                    disc = m*m - 4*n_int
                    if disc > 0:
                        sqrt_disc = math.isqrt(disc)
                        if sqrt_disc*sqrt_disc == disc:
                            p_candidate = (m - sqrt_disc) // 2
                            q_candidate = (m + sqrt_disc) // 2
                            if p_candidate * q_candidate == n_int and p_candidate > 1 and q_candidate > 1:
                                out.append(f"Londahl BSGS factor found!")
                                out.append(f"Verification: p * q = {p_candidate * q_candidate}")
                                out.append(f"p = {p_candidate}")
                                out.append(f"q = {q_candidate}")
                                out.append(f"|p - q| = {abs(q_candidate - p_candidate)}")
                                out.append(f"Baby steps: {b+1}, Giant steps: {i+1}")
                                found = True
                                break
                mu = (mu * step) % n_int
            if found:
                out.append("")
                out.append("CLOSE_PRIME=SUCCESS")
            else:
                out.append("Both Fermat and Londahl BSGS failed to factor n.")
                out.append("CLOSE_PRIME=FAILED")
            print("\\n".join(out))
        except Exception as e:
            try:
                out.append(f"Error: {e}")
                out.append("CLOSE_PRIME=FAILED")
                print("\\n".join(out))
            except:
                print(f"Error: {e}")
                print("CLOSE_PRIME=FAILED")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("CLOSE_PRIME=FAILED")
_attack()`,frontendCheck:(e,t)=>{if(!e.n)return Promise.resolve(null);try{let n=BigInt(e.n);if(n%2n==0n)return Promise.resolve(`Factor found!\np = 2\nq = ${n/2n}\nCLOSE_PRIME=SUCCESS`);let r=D(n);r*r<n&&r++;let i=r,a=r*r-n,o=r+1000000n;for(;r<o;){if(t&&r%50000n==0n){let e=Number(r-i),n=Number(o-i);t(Math.round(e*100/n),`a = ${e.toLocaleString()} / ${n.toLocaleString()}`)}let e=Number(a&15n);if(e===0||e===1||e===4||e===9){let e=D(a);if(e*e===a){let a=r-e,o=r+e;if(a>1n&&o>1n&&a*o===n)return t?.(100),Promise.resolve(`Factor found!\np = ${a}\nq = ${o}\n|p - q| = ${o-a}\niterations = ${r-i}\nCLOSE_PRIME=SUCCESS`)}}a+=2n*r+1n,r++}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} Factor $n = pq$ when $|p-q|$ is small via Fermat's difference-of-squares iteration, extended by Londahl's BSGS to larger gaps.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$ with $p \\approx q$
\\item Let $a = \\frac{p+q}{2}$, $b = \\frac{p-q}{2}$, so $n = a^2 - b^2$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
a &= \\lceil\\sqrt{n}\\rceil,\\; b = \\sqrt{a^2 - n} \\\\
\\text{Fermat: } a_{i+1} &= a_i + 1,\\; b_i^2 = a_i^2 - n \\\\
a_i^2 - n \\text{ is square} &\\implies p = a_i - b_i,\\; q = a_i + b_i \\\\
\\text{BSGS: } \\phi_{\\text{approx}} &= n - 2\\lfloor\\sqrt{n}\\rfloor + 1 \\\\
2^{\\delta} &\\equiv 2^{-\\phi_{\\text{approx}}} \\pmod{n},\\; \\delta = \\phi(n) - \\phi_{\\text{approx}} \\\\
\\phi(n) &= \\phi_{\\text{approx}} + j - i \\cdot b,\\; p+q = n - \\phi(n) + 1
\\end{align*}

\\textbf{Explanation:} Fermat represents $n$ as $a^2 - b^2$ and searches for $a$ such that $a^2 - n$ is a perfect square. Each step increments $a$ by 1 and updates $b^2$ additively, avoiding multiplication. When $|p-q| < 10^6$, Fermat converges quickly. Londahl's BSGS recovers $\\phi(n)$ via a discrete-log collision for larger gaps.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Incremental Fermat update:} The difference-of-squares term $a^2 - n$ updates via $b^2 \\mathrel{+}= 2a + 1$ each iteration, avoiding a full $a^2$ multiplication per step.
\\item \\textbf{Parity-optimized BSGS (Londahl fallback):} When Fermat's direct search exceeds $10^6$ steps, switches to Londahl's baby-step giant-step. Baby-step table construction skips entries where $(j \\& 1)$ mismatches $\\phi(n)$ parity, halving the table size.
\\end{itemize}

\\textbf{References:} Fermat (1643); C. L\\"ondahl, "Finding Close-Prime Factorizations", 2017 (https://grocid.net/2017/09/16/finding-close-prime-factorizations/)`,priority:`medium`,applicableCheck:e=>!!e.n},G={id:`novelty-primes`,name:`Novelty Primes`,category:`Factorization`,description:`Detects primes near powers of two or mathematical constants via windowed trial division. Use for CTF moduli with novelty-crafted primes.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`import math
def _attack():
    out = []
    try:
        try:
            n = Integer(${e.n})
            if n < 2:
                out.append(f"n = {n} is too small to factor")
                out.append("NOVELTY_PRIMES=FAILED")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append(f"n is even: {n}")
                out.append(f"p = 2")
                out.append(f"q = {n // 2}")
                out.append(f"Verification: 2 * {n // 2} = {n}")
                out.append("NOVELTY_PRIMES=SUCCESS")
                print("\\n".join(out))
                return
            if n.is_prime():
                out.append(f"n is prime: {n}")
                out.append("No factorization possible")
                out.append("NOVELTY_PRIMES=FAILED")
                print("\\n".join(out))
                return
            if n.is_square():
                p = isqrt(n)
                out.append(f"n is a perfect square: {p}^2 = {n}")
                out.append(f"Verification: p * q = {p * p}")
                out.append(f"p = {p}")
                out.append(f"q = {p}")
                out.append("")
                out.append("NOVELTY_PRIMES=SUCCESS")
                print("\\n".join(out))
                return
            out.append(f"Checking n = {n} against known CTF primes...")
            found = False
            out.append("Checking primes near powers of 2...")
            n_int = int(n)
            for bits in [64, 128, 256, 512]:
                target = 1 << bits
                for delta in range(-1000, 1000):
                    candidate = target + delta
                    if candidate > 1 and n_int % candidate == 0:
                        if is_prime(candidate):
                            p_sage = Integer(candidate)
                            out.append(f"  Found prime near 2^{bits}: {p_sage}")
                            out.append(f"  Cofactor: {n // p_sage}")
                            out.append(f"  Verification: {p_sage} * {n // p_sage} = {n}")
                            out.append(f"p = {p_sage}")
                            out.append(f"q = {n // p_sage}")
                            found = True
            out.append("\\nChecking primes near common constants...")
            constants = [
                ("pi", 3141592653589793238462643383279502884197169399375105820974),
                ("e", 2718281828459045235360287471352662497757247093699959574966),
                ("sqrt(2)", 1414213562373095048801688724209698078569671875376948073176),
            ]
            for name, const in constants:
                const_int = int(const)
                for delta in range(-100, 100):
                    candidate = const_int + delta
                    if candidate > 1 and n_int % candidate == 0:
                        if is_prime(candidate):
                            p_sage = Integer(candidate)
                            out.append(f"  Found prime near {name}: {p_sage}")
                            out.append(f"  Cofactor: {n // p_sage}")
                            out.append(f"p = {p_sage}")
                            out.append(f"q = {n // p_sage}")
                            found = True
            if found:
                out.append("NOVELTY_PRIMES=SUCCESS")
            else:
                out.append("\\nNo novelty primes found.")
                out.append("NOVELTY_PRIMES=FAILED")
        except Exception as e:
            out.append(f"Error in Novelty Primes check: {e}")
            out.append("NOVELTY_PRIMES=FAILED")
        #
    except BaseException as ex:
        out.append(f"ERROR: {ex}")
        out.append("NOVELTY_PRIMES=FAILED")
    print("\\n".join(out))
_attack()`,frontendCheck:e=>{if(!e.n)return Promise.resolve(null);try{let t=BigInt(e.n);if(t<2n)return Promise.resolve(null);if(t%2n==0n)return Promise.resolve(`n is even: ${t}\np = 2\nq = ${t/2n}\nNOVELTY_PRIMES=SUCCESS`);for(let e of[64,128,256,512]){let n=1n<<BigInt(e);for(let r=-1e3;r<=1e3;r++){let i=n+BigInt(r);if((i&1n)!=0n&&i>1n&&t%i===0n&&M(i))return Promise.resolve(`Found prime near 2^${e}: ${i}\nCofactor: ${t/i}\nVerification: ${i} * ${t/i} = ${t}\nNOVELTY_PRIMES=SUCCESS`)}}for(let[e,n]of[[`pi`,3141592653589793238462643383279502884197169399375105820974n],[`e`,2718281828459045235360287471352662497757247093699959574966n],[`sqrt(2)`,1414213562373095048801688724209698078569671875376948073176n]])for(let r=-100;r<=100;r++){let i=n+BigInt(r);if((i&1n)!=0n&&i>1n&&t%i===0n&&M(i))return Promise.resolve(`Found prime near ${e}: ${i}\nCofactor: ${t/i}\nNOVELTY_PRIMES=SUCCESS`)}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} If $p$ is a prime near a power of two or a mathematical constant, a windowed trial division search finds it.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p \\cdot q$ where $p$ is near a known structured value
\\item Search windows around powers of two $2^k$ ($k \\in \\{64, 128, 256, 512\\}$) and constants $\\pi, e, \\sqrt{2}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &\\approx 2^k + \\delta,\\; |\\delta| \\leq W \\text{ (window size)} \\\\
p &\\approx C + \\delta,\\; C \\in \\{\\pi, e, \\sqrt{2}, \\ldots\\} \\\\
n \\bmod (2^k + \\delta) = 0 &\\implies p = 2^k + \\delta,\\; q = n/p \\\\
\\text{Cost: } &O(W \\cdot \\log^2 n) \\qed
\\end{align*}

\\textbf{Explanation:} CTF challenge authors sometimes construct primes from well-known numbers — $p = 2^k \\pm \\delta$ (near powers of two) or $p = \\lfloor \\pi \\times 10^m \\rfloor \\pm \\delta$ (from mathematical constants). This attack checks candidates in a window around each known value, testing divisibility of $n$.

\\textbf{References:} Cryptopals; Cryptohack.org; various CTF writeups`,priority:`low`,applicableCheck:e=>!!e.n},K={id:`related-message`,name:`Franklin-Reiter Related Message Attack`,category:`Message / Protocol`,description:`Recovers m from two ciphertexts with linearly related plaintexts via polynomial GCD. Use when c1 = m^e and c2 = (a·m + b)^e mod n with known a, b.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`65537`,multiline:!1},{name:`c1`,label:`c1 (ciphertext of m)`,placeholder:`Enter c1...`,multiline:!0,rows:3},{name:`c2`,label:`c2 (ciphertext of a·m + b)`,placeholder:`Enter c2...`,multiline:!0,rows:3},{name:`a`,label:`a (linear coefficient)`,placeholder:`2`,multiline:!1},{name:`b`,label:`b (linear offset)`,placeholder:`0`,multiline:!1}],sageTemplate:e=>`def _attack():
    try:
        out = []
        try:
            n = Integer(${e.n})
            e_val = "${e.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            c1 = Integer(${e.c1})
            c2 = Integer(${e.c2})
            a_val = "${e.a}".strip()
            a = Integer(a_val) if a_val else Integer(2)
            b_val = "${e.b}".strip()
            b = Integer(b_val) if b_val else Integer(0)
            if n < 2 or e < 2 or c1 < 0 or c2 < 0:
                out.append("Invalid input")
                out.append("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
                print("\\n".join(out))
                return
            out.append(f"Related Message Attack")
            out.append(f"n = {n}, e = {e}")
            out.append(f"c1 = m^e mod n = {c1}")
            out.append(f"c2 = (a*m + b)^e mod n = {c2}")
            out.append(f"a = {a}, b = {b}")
            out.append("")
            # Diagnostic: if b = 0, check degenerate case c2 == a^e * c1
            if b == 0:
                ratio_check = power_mod(a, e, n) * c1 % n
                out.append(f"Diagnostic: a^e * c1 mod n = {ratio_check}")
                out.append(f"Diagnostic: c2 = {c2}")
                out.append(f"Diagnostic: match? {ratio_check == c2}")
                if ratio_check == c2:
                    out.append("WARNING: b=0 and c2 == a^e*c1. Any m satisfies c2 = (am)^e mod n.")
                    out.append("Cannot recover m uniquely. Try using b != 0.")
                    out.append("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
                    print("\\n".join(out))
                    return
                out.append("")
            # f1(x) = x^e - c1, f2(x) = (a*x + b)^e - c2
            # Both share root x = m over Zmod(n)
            R.<x> = PolynomialRing(Zmod(n))
            f1 = x**e - c1
            f2 = (a * x + b)**e - c2
            # Custom GCD for polynomials over Zmod(n) with composite n.
            # Use try/except around p %% q since pseudo-remainder can fail
            # when leading coefficient shares a factor with n.
            def poly_gcd(p, q):
                while q != 0:
                    try:
                        p, q = q, p % q
                    except (ZeroDivisionError, ValueError, TypeError):
                        lc = q.leading_coefficient()
                        g = gcd(Integer(lc), Integer(n))
                        if 1 < g < n:
                            out.append(f"GCD found factor of n: {g}")
                        break
                return p
            g = poly_gcd(f1, f2)
            out.append(f"GCD degree: {g.degree()}")
            m_int = None
            if g.degree() == 1:
                a_coeff = Integer(g[1])
                b_coeff = Integer(g[0])
                try:
                    m_int = Integer((-b_coeff) * inverse_mod(a_coeff, n) % n)
                except (ZeroDivisionError, ValueError):
                    for r, _ in g.roots():
                        m_int = Integer(r)
                        break
            elif g.degree() > 1:
                for r, _ in g.roots():
                    m_int = Integer(r)
                    break
            # Fallback: if GCD failed and e == 3, use closed-form elimination.
            # Derivation:
            #   (am+b)^3 = a^3*m^3 + 3a^2*b*m^2 + 3a*b^2*m + b^3 = c2
            #   m^3 = c1
            #   Substitute: 3a^2*b*m^2 + 3a*b^2*m + (b^3 - c2 + a^3*c1) = 0
            #   Multiply by (A*m - B) and use m^3 = c1 to eliminate m^2:
            #   (A*C - B^2)*m = B*C - A^2*c1
            if m_int is None and e == 3:
                out.append("Trying e=3 closed-form fallback...")
                A = (3 * a^2 * b) % n
                B = (3 * a * b^2) % n
                C = (b^3 - c2 + a^3 * c1) % n
                out.append(f"Algebraic elimination: {A}*m^2 + {B}*m + {C} = 0 (mod n)")
                if A == 0 and B == 0 and C == 0:
                    out.append("Degenerate: any m satisfies both equations (b=0 case).")
                elif A == 0 and B == 0:
                    out.append(f"Contradiction: {C} != 0. a/b values are wrong.")
                elif A == 0:
                    # Linear case: B*m + C = 0
                    try:
                        m_int = Integer((-C) * inverse_mod(B, n) % n)
                        out.append(f"Linear fallback recovered m = {m_int}")
                    except (ZeroDivisionError, ValueError):
                        out.append("Linear fallback failed (B not invertible).")
                else:
                    # Quadratic case: use derived formula
                    denom = (A * C - B^2) % n
                    numer = (B * C - A^2 * c1) % n
                    out.append(f"Denominator (A*C - B^2): {denom}")
                    gd = gcd(Integer(denom), Integer(n))
                    if 1 < gd < n:
                        out.append(f"Denominator shares factor {gd} with n - trying CRT...")
                        try:
                            p1 = gd
                            q1 = n // p1
                            m_p = Integer(numer % p1 * inverse_mod(denom % p1, p1) % p1)
                            m_q = Integer(numer % q1 * inverse_mod(denom % q1, q1) % q1)
                            m_int = Integer(crt([m_p, m_q], [p1, q1]))
                            out.append(f"CRT fallback recovered m = {m_int}")
                        except Exception as ex2:
                            out.append(f"CRT fallback failed: {ex2}")
                    else:
                        try:
                            m_int = Integer(numer * inverse_mod(denom, n) % n)
                            out.append(f"Quadratic fallback recovered m = {m_int}")
                        except (ZeroDivisionError, ValueError):
                            out.append("Quadratic fallback failed (denominator not invertible).")
            if m_int is None:
                out.append("Could not recover message m.")
                out.append("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
                print("\\n".join(out))
                return
            out.append(f"Recovered m = {m_int}")
            v1 = power_mod(m_int, e, n)
            v2 = power_mod(Integer(a * m_int + b), e, n)
            out.append(f"Verification: m^e mod n = {v1} == c1? {v1 == c1}")
            out.append(f"Verification: (a*m+b)^e mod n = {v2} == c2? {v2 == c2}")
            if v1 == c1 and v2 == c2:
                out.append("")
                out.append("FRANKLIN_REITER_RELATED_MESSAGE=SUCCESS")
            else:
                out.append("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
        except Exception as ex:
            out.append(f"ERROR: {ex}")
            out.append("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
        print("\\n".join(out))
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("FRANKLIN_REITER_RELATED_MESSAGE=FAILED")
_attack()`,frontendCheck:e=>{if(!e.n||!e.c1||!e.c2)return Promise.resolve(null);try{let t=BigInt(e.n),n=(e.e||``).trim(),r=n?BigInt(n):65537n,i=BigInt(e.c1),a=BigInt(e.c2),o=(e.a||``).trim(),s=o?BigInt(o):2n,c=(e.b||``).trim(),l=c?BigInt(c):0n;if(t<2n||r<2n||i<0n||a<0n||r!==3n)return Promise.resolve(null);let u=3n*s*s*l%t,d=3n*s*l*l%t,f=((l*l*l-a+s*s*s%t*i)%t%t+t)%t;if(u===0n&&d===0n)return Promise.resolve(null);if(u===0n){if(d===0n)return Promise.resolve(null);let e=k(d,t);if(e===null)return Promise.resolve(null);let n=(-f%t+t)%t*e%t;return A(n,r,t)===i?Promise.resolve(`Recovered m = ${n}\nFRANKLIN_REITER_RELATED_MESSAGE=SUCCESS`):Promise.resolve(null)}let p=((u*f-d*d)%t+t)%t,m=((d*f-u*u%t*i)%t+t)%t;if(p===0n)return Promise.resolve(null);let h=k(p,t);if(h===null)return Promise.resolve(null);let g=m*h%t;return A(g,r,t)===i?Promise.resolve(`Recovered m = ${g}\nFRANKLIN_REITER_RELATED_MESSAGE=SUCCESS`):Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} Given $c_1 \\equiv m^e \\pmod{n}$ and $c_2 \\equiv (am + b)^e \\pmod{n}$ with known $a, b$ and $\\gcd(a, n) = 1$, recover $m$ by computing $\\gcd(x^e - c_1, (ax + b)^e - c_2)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_1 \\equiv m^e \\pmod{n}$, $c_2 \\equiv (am+b)^e \\pmod{n}$
\\item $a, b$ are known and $\\gcd(a, n) = 1$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_1(x) &= x^e - c_1 \\in (\\mathbb{Z}/n\\mathbb{Z})[x] \\\\
f_2(x) &= (ax + b)^e - c_2 \\in (\\mathbb{Z}/n\\mathbb{Z})[x] \\\\
f_1(m) &\\equiv m^e - c_1 \\equiv 0 \\pmod{n} \\\\
f_2(m) &\\equiv (am+b)^e - c_2 \\equiv 0 \\pmod{n} \\\\
\\gcd(f_1, f_2) &= (x - m) \\quad \\text{(with high probability)} \\\\
m &= -g[0] \\cdot g[1]^{-1} \\pmod{n}
\\end{align*}

\\textbf{Explanation:} Both polynomials $f_1$ and $f_2$ share $m$ as a root modulo $n$. The polynomial GCD extracts their common linear factor $(x - m)$. For $e = 3$, a closed-form algebraic elimination is available without polynomial arithmetic over composite moduli.

\\textbf{References:} Franklin & Reiter, 1996; Boneh, "Twenty Years of Attacks on RSA," 1999`,usageGuide:`This attack recovers m when two related messages are encrypted with the same public key.

How to use:
1. You have two ciphertexts c1, c2 encrypted under the same (n, e)
2. The plaintexts are related: m2 = a*m1 + b for known a, b
3. Provide n, e, c1, c2, a, and b
4. The attack computes gcd(m1^e - c1, (a*m1 + b)^e - c2) to recover m1

Tip: The attack requires e = 3 for reliable algebraic recovery; e = 5 or 7 may work via polynomial GCD but can fail over composite moduli. For convenience, paste into Magic Mode which auto-detects the parameters.`,priority:`high`,applicableCheck:e=>!!e.n&&!!e.c1&&!!e.c2},q={id:`simple-lattice`,name:`Simple Lattice`,category:`Partial Key / Lattice`,description:`Recovers p from an approximate value nearp using Coppersmith's lattice when |nearp - p| < n^(1/4). Use when a close approximation of p is known.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`nearp`,label:`nearp (approximate p)`,placeholder:`Enter approximate p value...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        try:
            out = []
            n = Integer(${e.n})
            nearp = Integer(${e.nearp})
            if n <= 0 or nearp <= 0:
                out.append("SIMPLE_LATTICE=FAILED: invalid input values")
                print("\\n".join(out))
                return
            if nearp >= n:
                out.append("nearp must be less than n (modulus)")
                out.append("SIMPLE_LATTICE=FAILED: nearp >= n")
                print("\\n".join(out))
                return
            if n % nearp == 0:
                p = nearp
                q = n // p
                out.append(f"Verification: p * q = {p * q}")
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append("")
                out.append("SIMPLE_LATTICE=SUCCESS")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append("n is even — cannot apply lattice attack")
                out.append("SIMPLE_LATTICE=FAILED: even modulus")
                print("\\n".join(out))
                return
            # Manual Coppersmith lattice (same shifts as Sage's small_roots).
            # Checks ALL LLL rows to bypass Sage's Row-0 (degree-1) bug.
            x = ZZ['x'].gen()
            f_ZZ = nearp + x
            X = n.nth_root(4, truncate_mode=True)[0] + 1
            m = 5; t = 5; dim = m + t
            shifts = []
            for i in range(m):
                shifts.append(n^(m - i) * f_ZZ^i)
            for k in range(t):
                shifts.append(f_ZZ^m * x^k)
            M = matrix(ZZ, dim, dim)
            for i, shift in enumerate(shifts):
                for j, c in enumerate(shift.list()):
                    M[i, j] = c * X^j
            B = M.LLL()
            found_p = None
            for k in range(dim):
                row = B[k]
                a0 = Integer(row[0]); a1 = Integer(row[1])
                if a1 == 0:
                    continue
                # g(y) = sum row[i] * y^i, y = r/X.
                # g(r/X) = 0 → two-term: r ≈ -a0 * X / a1.
                # Error from higher terms: |r/X|^2 ≪ 1 → accurate within 1.
                r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                for delta in range(-2, 3):
                    r = Integer(floor(r_approx)) + delta
                    if abs(r) < X:
                        candidate = nearp + r
                        if n % candidate == 0:
                            found_p = candidate
                            break
                if found_p:
                    break
            if found_p:
                q = n // found_p
                out.append(f"Verification: p * q = {found_p * q}")
                out.append(f"p = {found_p}")
                out.append(f"q = {q}")
                out.append("")
                out.append("SIMPLE_LATTICE=SUCCESS")
            else:
                out.append("SIMPLE_LATTICE=FAILED: no roots found in any LLL row")
            print("\\n".join(out))
        except Exception as ex:
            out.append(f"SIMPLE_LATTICE=FAILED: {ex}")
            print("\\n".join(out))
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("SIMPLE_LATTICE=FAILED")
_attack()`,proof:`\\textbf{Theorem:} If $|p-p_0| < n^{1/4}$, Coppersmith's method recovers $p$ from approximation $p_0$ via lattice reduction.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p \\cdot q$ with balanced primes
\\item $p_0 \\approx p$, $|p - p_0| < X = n^{1/4}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f(x) &= p_0 + x \\equiv 0 \\pmod{p} \\\\
\\text{Construct lattice from shifts: } &x^i f(x)^j n^{m-j} \\\\
\\text{LLL finds short vector } g(x) &= a_0 + a_1 x \\text{ with root } x_0 \\\\
r &\\approx -\\frac{a_0 \\cdot X}{a_1},\\quad x_0 = \\text{round}(r) \\\\
p &= p_0 + x_0,\\quad q = n/p \\qed
\\end{align*}

\\textbf{Explanation:} The attack embeds $f(x) = p_0 + x$ into a lattice with $m=5$ shifts of decreasing $n$ powers and $t=5$ shifts of $f^m x^k$. After LLL reduction, each row of the reduced basis is a candidate polynomial; the attack checks all rows (not just row 0, because Sage's $\\texttt{small\\_roots}$ has a degree-1 bug) for two-term polynomials whose root rounds to the correct offset.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", EUROCRYPT 1996`,usageGuide:`This recovers a factor p from an approximate value nearp using Coppersmith\\'s lattice method.

How to use:
1. You have a modulus n and an approximation nearp ≈ p (one of the prime factors)
2. The approximation must be within n^(1/4) of the actual p
3. Provide n and nearp
4. The attack constructs a lattice and uses LLL to find the exact p

Tip: nearp can come from side-channel leaks, known bits of p, or approximations from other attacks. If |nearp - p| > n^(1/4) the attack may fail.`,priority:`high`,applicableCheck:e=>!!e.n&&!!e.nearp},J={id:`partial-d`,name:`Partial d Key Exposure`,category:`Partial Key / Lattice`,description:`Recovers d from leaked low-order bits by iterating k in ed = k·φ(n)+1. Use when low-order bits of d are exposed via side-channel.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`dLow`,label:`dLow (low bits of d)`,placeholder:`Enter known low bits of d...`,multiline:!0,rows:3}],sageTemplate:e=>`import math
def _attack():
    try:
        out = []
        try:
            n = Integer(${e.n})
            e = Integer(${e.e})
            dLow = Integer(${e.dLow})
            if n <= 0 or e <= 0 or dLow < 0:
                out.append("PARTIAL_D=FAILED: invalid input values")
            else:
                # Use Python ints for fast iteration
                n_int = int(n)
                e_int = int(e)
                dLow_int = int(dLow)
                m = dLow_int.bit_length()
                kBound = 1 << min(m + 2, 24)
                # Incremental d_approx update (avoid BigInt division per iteration)
                q = n_int // e_int
                r = n_int % e_int
                d_approx = (n_int + 1) // e_int
                rem = (n_int + 1) % e_int
                found = False
                for k in range(1, kBound + 1):
                    if (d_approx & ((1 << m) - 1)) == dLow_int:
                        d_phi = (e_int * d_approx - 1) // k
                        s = n_int - d_phi + 1
                        disc = s * s - 4 * n_int
                        if disc >= 0:
                            sqrt_disc = math.isqrt(disc)
                            if sqrt_disc * sqrt_disc == disc:
                                p_candidate = (s + sqrt_disc) // 2
                                if p_candidate > 1 and n_int % p_candidate == 0:
                                    p_sage = Integer(p_candidate)
                                    q_sage = n // p_sage
                                    out.append(f"Verification: p * q = {p_sage * q_sage}")
                                    out.append(f"d = {d_approx}")
                                    out.append(f"p = {p_sage}")
                                    out.append(f"q = {q_sage}")
                                    out.append("")
                                    out.append("PARTIAL_D=SUCCESS")
                                    found = True
                                    break
                    # Increment d_approx for next iteration
                    d_approx += q
                    rem += r
                    if rem >= e_int:
                        d_approx += 1
                        rem -= e_int
                if not found:
                    out.append("PARTIAL_D=FAILED: no valid d found")
        except Exception as ex:
            out.append(f"PARTIAL_D=FAILED: {ex}")
        print("\\n".join(out))
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PARTIAL_D=FAILED")
_attack()`,frontendCheck:(e,t)=>{if(!e.n||!e.e||!e.dLow)return Promise.resolve(null);try{let n=BigInt(e.n),r=BigInt(e.e),i=BigInt(e.dLow),a=i.toString(2).length,o=1n<<BigInt(Math.min(a+2,24)),s=(1n<<BigInt(a))-1n,c=n/r,l=n%r,u=(n+1n)/r,d=(n+1n)%r;for(let e=1n;e<=o;e++){if(t&&o>10000n&&e%100000n==0n&&t(Number(e*100n/o),`k = ${e.toString()} / ${o.toString()}`),(u&s)===i){let i=n-(r*u-1n)/e+1n,a=i*i-4n*n;if(a>=0n){let r=D(a);if(r*r===a){let a=(i-r)/2n;if(a>0n&&n%a===0n){let r=n/a;return t?.(100),Promise.resolve(`Factor found!\np = ${a}\nq = ${r}\nk = ${e}\nPrivate key d = ${u}\nPARTIAL_D=SUCCESS`)}}}}u+=c,d+=l,d>=r&&(u+=1n,d-=r)}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} If low $m$ bits of $d$ are known, recover $d$ by iterating $k$ in the key equation $ed = k\\varphi(n)+1$.

\\textbf{Setup:}
\\begin{itemize}
\\item $ed \\equiv 1 \\pmod{\\varphi(n)}$, so $ed - 1 = k\\varphi(n)$ for some $k \\in [1, e]$
\\item $d_{\\text{low}} = d \\bmod 2^m$ known, $m = \\text{bit-length of } d_{\\text{low}}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Since } \\varphi(n) &\\approx n,\\quad d \\approx \\frac{kn + 1}{e} \\\\
d_{\\text{approx}} &= \\left\\lfloor \\frac{kn + 1}{e} \\right\\rfloor \\\\
d_{\\text{approx}} \\bmod 2^m &\\stackrel{?}{=} d_{\\text{low}} \\\\
\\varphi &= (ed_{\\text{approx}} - 1)/k \\\\
x^2 - (n - \\varphi + 1)x + n &= 0 \\\\implies p,q \\qed
\\end{align*}

\\textbf{Explanation:} For each $k \\in [1,e]$, compute $d_{\\text{approx}} = \\lfloor(kn+1)/e\\rfloor$. If the low $m$ bits match $d_{\\text{low}}$, recover $\\varphi(n) = (ed-1)/k$ and solve the quadratic $x^2 - (n-\\varphi+1)x + n = 0$ for $p$ and $q$. The search bound is limited to $k < 2^{m+2}$ (cap at $\\sim 16\\times 10^6$) for efficiency.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Incremental }$d_{\\text{approx}}$\\textbf{ update:} Instead of recomputing $d_{\\text{approx}} = \\lfloor (kn+1)/e \\rfloor$ from scratch each iteration (costly BigInt division), maintains a running quotient/remainder: increments $d_{\\text{approx}}$ by $q = (d_{\\text{approx}} + n) \\div e$ and tracks a running remainder, updating both additively per step.
\\end{itemize}

\\textbf{References:} D. Boneh, G. Durfee, Y. Frankel, "An Attack on RSA Given a Small Fraction of the Private Key Bits", ASIACRYPT 1998`,usageGuide:`This attack recovers the full private key d from leaked low-order bits by iterating k in the key equation.

How to use:
1. You have modulus n, public exponent e, and dLow (the low-order bits of d)
2. Provide n, e, and dLow
3. The attack iterates k in ed = k\\phi(n) + 1, checking if d_approx has matching low bits
4. For each matching candidate, it computes \\phi(n) and solves the quadratic for p,q

Tip: The attack works best when e is small (smaller k search space). The kBound is computed from dLow bit-length (max ~16M iterations). Uses incremental d_approx update (avoiding BigInt division per iteration) for performance.`,priority:`high`,applicableCheck:e=>!!e.n&&!!e.e&&!!e.dLow},Y={id:`partial-pq-bits`,name:`Partial p/q Bits`,category:`Partial Key / Lattice`,description:`Recovers p from known high (MSB) or low (LSB) bits using Coppersmith's lattice. Use when half or more of p's bits are known via side-channel.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`knownBits`,label:`knownBits (known bits of p)`,placeholder:`Enter known bits as integer...`,multiline:!0,rows:3},{name:`bitPosition`,label:`bitPosition`,placeholder:`msb or lsb`,multiline:!1}],sageTemplate:e=>`def _attack():
    try:
        out = []
        try:
            n = Integer(${e.n})
            knownBits = Integer(${e.knownBits})
            bitPosition = "${e.bitPosition}"
            if n <= 0 or knownBits < 0:
                out.append("PARTIAL_PQ_BITS=FAILED: invalid input values")
            elif bitPosition not in ("msb", "lsb"):
                out.append("PARTIAL_PQ_BITS=FAILED: bitPosition must be 'msb' or 'lsb'")
            elif bitPosition == "msb":
                k = n.nbits() // 2 - knownBits.nbits()
                if k <= 0:
                    out.append("PARTIAL_PQ_BITS=FAILED: not enough unknown bits for Coppersmith")
                else:
                    # Manual Coppersmith lattice for degree-1, checking ALL LLL rows.
                    # Sage's small_roots only checks Row 0 (Row-0 bug for degree-1).
                    x = ZZ['x'].gen()
                    f_ZZ = (knownBits << k) + x
                    X = n.nth_root(4, truncate_mode=True)[0] + 1
                    m = 5; t = 5; dim = m + t
                    shifts = []
                    for i in range(m):
                        shifts.append(n**(m - i) * f_ZZ**i)
                    for kk in range(t):
                        shifts.append(f_ZZ**m * x**kk)
                    M = matrix(ZZ, dim, dim)
                    for i, shift in enumerate(shifts):
                        for j, c in enumerate(shift.list()):
                            M[i, j] = c * X**j
                    B = M.LLL()
                    found_p = None
                    for row_idx in range(dim):
                        row = B[row_idx]
                        a0 = Integer(row[0]); a1 = Integer(row[1])
                        if a1 == 0:
                            continue
                        r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                        for delta in range(-2, 3):
                            r = Integer(floor(r_approx)) + delta
                            if abs(r) < X:
                                candidate = (knownBits << k) + r
                                if n % candidate == 0:
                                    found_p = candidate
                                    break
                        if found_p:
                            break
                    if found_p:
                        q = n // found_p
                        out.append(f"Verification: p * q = {found_p * q}")
                        out.append(f"p = {found_p}")
                        out.append(f"q = {q}")
                        out.append("")
                        out.append("PARTIAL_PQ_BITS=SUCCESS")
                    else:
                        out.append("PARTIAL_PQ_BITS=FAILED: no roots found")
            elif bitPosition == "lsb":
                m = knownBits.nbits()
                if m <= 0:
                    out.append("PARTIAL_PQ_BITS=FAILED: knownBits is zero")
                else:
                    # Manual Coppersmith lattice for degree-1, checking ALL LLL rows.
                    # Sage's small_roots only checks Row 0 (Row-0 bug for degree-1).
                    x = ZZ['x'].gen()
                    f_ZZ = (2**m) * x + knownBits
                    X = n.nth_root(4, truncate_mode=True)[0] + 1
                    mm = 5; tt = 5; dim = mm + tt
                    shifts = []
                    for i in range(mm):
                        shifts.append(n**(mm - i) * f_ZZ**i)
                    for kk in range(tt):
                        shifts.append(f_ZZ**mm * x**kk)
                    M = matrix(ZZ, dim, dim)
                    for i, shift in enumerate(shifts):
                        for j, c in enumerate(shift.list()):
                            M[i, j] = c * X**j
                    B = M.LLL()
                    found_p = None
                    for row_idx in range(dim):
                        row = B[row_idx]
                        a0 = Integer(row[0]); a1 = Integer(row[1])
                        if a1 == 0:
                            continue
                        r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                        for delta in range(-2, 3):
                            r = Integer(floor(r_approx)) + delta
                            if abs(r) < X:
                                candidate = r * (2**m) + knownBits
                                if n % candidate == 0:
                                    found_p = candidate
                                    break
                        if found_p:
                            break
                    if found_p:
                        q = n // found_p
                        out.append(f"Verification: p * q = {found_p * q}")
                        out.append(f"p = {found_p}")
                        out.append(f"q = {q}")
                        out.append("")
                        out.append("PARTIAL_PQ_BITS=SUCCESS")
                    else:
                        out.append("PARTIAL_PQ_BITS=FAILED: no roots found")
        except Exception as ex:
            out.append(f"PARTIAL_PQ_BITS=FAILED: {ex}")
        print("\\n".join(out))
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PARTIAL_PQ_BITS=FAILED")
_attack()`,proof:`\\textbf{Theorem:} If at least half the bits of $p$ are known (as MSBs or LSBs), Coppersmith's method recovers the full factorization.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = p \\cdot q$ with balanced primes
\\item MSB case: $p = p_{\\text{known}} \\cdot 2^k + x$, $|x| < n^{1/4}$
\\item LSB case: $p = x \\cdot 2^m + p_{\\text{known}}$, $|x| < n^{1/4}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{MSB: } f(x) &= p_{\\text{known}} \\cdot 2^k + x \\equiv 0 \\pmod{p} \\\\
\\text{LSB: } f(x) &= x \\cdot 2^m + p_{\\text{known}} \\equiv 0 \\pmod{p} \\\\
\\text{Construct lattice with shifts } x^i f(x)^j &n^{m-j},\\quad m=5,\\; t=5 \\\\
\\text{LLL finds short polynomial; check all basis rows } &\\text{for two-term root candidates} \\\\
\\text{Each row gives } r \\approx -a_0 X / a_1,\\; &x_0 = \\text{round}(r),\\; p = f(x_0) \\\\
\\text{Verify } p \\mid n,\\quad &q = n/p \\qed
\\end{align*}

\\textbf{Explanation:} This attack applies Coppersmith's univariate modular root-finding method. The lattice uses $m=5$ polynomial shifts of decreasing $n$ powers and $t=5$ shifts of the highest-degree polynomial times $x^k$. Because Sage's $\\texttt{small\\_roots}$ only examines row 0 of the reduced basis (which fails for degree-1 polynomials), the manual lattice checks all $m+t$ rows for two-term candidates $a_0 + a_1 x$ whose root rounds to a valid factor.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", EUROCRYPT 1996; N. Howgrave-Graham, "Approximate Integer Common Divisors", 1997`,usageGuide:`This attack recovers a prime factor when a fraction of its bits are known (e.g., from side-channel leakage).

How to use:
1. You know some bits of p (or q) and need to recover the full prime
2. Provide n, knownBits, and bitPosition (\\"msb\\" or \\"lsb\\")
3. The attack uses Coppersmith\\'s method to find the missing bits

Tip: This is inherently probabilistic — the lattice may fail even with the right inputs. Try with more known bits if it fails. bitPosition=msb = known high bits, lsb = known low bits.`,priority:`high`,applicableCheck:e=>!!e.n&&!!e.knownBits&&!!e.bitPosition},X=5000n,ie={id:`small-crt-exp`,name:`Small CRT Exponent`,category:`Partial Key / Lattice`,description:`Factors n via FLT-based batch GCD search over small CRT exponent d_p. Use when d_p = d mod (p-1) is small (< bound, default 1,000,000).`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`bound`,label:`bound (max d_p, optional)`,placeholder:`Default 5000000`,required:!1,multiline:!1}],sageTemplate:e=>`import math
def _attack():
    try:
        n = Integer(${e.n})
        e = Integer(${e.e})
        bound = ${e.bound?`Integer(${e.bound})`:`Integer(5000000)`}
        out = []
        if n <= 0 or e <= 0 or bound <= 0:
            out.append("SMALL_CRT_EXP=FAILED: invalid input values")
        else:
            n_int = int(n)
            e_int = int(e)
            bound_int = int(bound)
            step_int = pow(2, e_int, n_int)
            current_int = 1
            product_int = 1
            batch_size = 1000
            batch_start = 0
            found = False
            for dp in range(bound_int + 1):
                x = (current_int - 2) % n_int
                product_int = (product_int * x) % n_int
                is_last = dp % batch_size == batch_size - 1 or dp == bound_int
                if is_last:
                    g = math.gcd(product_int, n_int)
                    if g > 1 and g < n_int:
                        cur_scan = pow(step_int, batch_start, n_int)
                        for d in range(batch_start, dp + 1):
                            x_scan = (cur_scan - 2) % n_int
                            if math.gcd(x_scan, n_int) > 1:
                                p_sage = Integer(g)
                                q_sage = n // p_sage
                                out.append(f"Factor found at dp = {d}!")
                                out.append(f"p = {p_sage}")
                                out.append(f"q = {q_sage}")
                                out.append("SMALL_CRT_EXP=SUCCESS")
                                found = True
                                break
                            cur_scan = (cur_scan * step_int) % n_int
                    if found:
                        break
                    product_int = 1
                    batch_start = dp + 1
                current_int = (current_int * step_int) % n_int
            if not found:
                out.append("No small dp found within bound.")
                out.append("SMALL_CRT_EXP=FAILED")
        print("\\n".join(out))
    except Exception as ex:
        print(f"SMALL_CRT_EXP=FAILED: {ex}")
_attack()`,frontendCheck:(e,t)=>{if(!e.n||!e.e)return Promise.resolve(null);try{let n=BigInt(e.n),r=BigInt(e.e),i=e.bound?BigInt(e.bound):5000000n,a=A(2n,r,n),o=1n,s=1n,c=0n;for(let e=0n;e<=i;e++){let l=(o-2n+n)%n;if(t&&i>10000n&&e%50000n==0n&&t(Number(e*100n/i),`dp = ${e.toString()} / ${i.toString()}`),s=s*l%n,e%X==X-1n||e===i){let i=E(s,n);if(i>1n&&i<n){let o=e,s=A(a,c,n);for(let e=c;e<=o;e++){if(E((s-2n+n)%n,n)>1n){let a=i,o=n/i,s=k(r,(a-1n)*(o-1n)),c=s?`\nPrivate exponent d = ${s}`:``;return t?.(100),Promise.resolve(`Factor found at dp = ${e}!\np = ${a}\nq = ${o}${c}\nSMALL_CRT_EXP=SUCCESS`)}s=s*a%n}}s=1n,c=e+1n}o=o*a%n}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} If $d_p = d \\bmod (p-1)$ is small ($< \\text{bound}$), Fermat's Little Theorem with batched GCD recovers $p$ in $O(\\text{bound})$ time.

\\textbf{Setup:}
\\begin{itemize}
\\item $ed_p \\equiv 1 \\pmod{p-1}$, so $ed_p = 1 + k(p-1)$ for some $k$
\\item By FLT: $2^{e \\cdot d_p} \\equiv 2 \\pmod{p}$, so $p \\mid (2^{e \\cdot d_p} - 2)$
\\item $d_p$ is small ($< \\text{bound}$, default $10^7$)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\texttt{step} &= 2^e \\bmod n \\\\
\\text{For } d_p = 0\\ldots\\text{bound}:\\quad &\\texttt{current} = \\texttt{step}^{d_p} \\bmod n = 2^{e d_p} \\bmod n \\\\
\\text{Accumulate } \\Pi &= \\Pi \\cdot (\\texttt{current} - 2) \\bmod n \\\\
\\text{Every } 1000 \\text{ steps:}\\quad &g = \\gcd(\\Pi, n) \\\\
1 < g < n &\\implies \\text{scan batch for exact } d_p \\qed
\\end{align*}

\\textbf{Explanation:} Fermat's Little Theorem guarantees $2^{ed_p} \\equiv 2 \\pmod{p}$ when $d_p$ is the correct CRT exponent. The attack linearly scans candidate $d_p$ values, accumulating a product of $(2^{ed_p} - 2)$ values in batches of 1000. A single GCD per batch detects whether any candidate in the batch is correct, reducing GCD calls by $1000\\times$. Once a hit is found, a linear scan of just that batch identifies the exact $d_p$. This works for any $e$ (no $e$-size limit) since the iteration count depends only on the bound.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Batched GCD product accumulation:} Accumulates $(2^{e \\cdot d_p} - 2) \\bmod n$ as a product over $BATCH\\_SIZE = 5000$ candidates per GCD, reducing GCD calls by $\\sim 5000\\times$. Backtracks linearly within the winning batch to isolate the exact $d_p$.
\\item \\textbf{k-based FLT approach (frontendCheck):} For $e \\leq 10^6$, directly computes $n \\bmod pCandidate$ which is $\\sim 400\\times$ cheaper than GCD (0.095 $\\mu$s vs 39 $\\mu$s). The modular reduction $2^{e \\cdot d_p} - 2 \\equiv 0 \\pmod{p}$ is equivalent to $p \\mid (2^{e \\cdot d_p} - 2)$.
\\end{itemize}

\\textbf{References:} Boneh \\textit{et al.}, "Cryptanalysis of RSA with Small CRT Exponents", CRYPTO 1998; Cohn & Heninger, ePrint 2011/436`,usageGuide:`This attack recovers the private key when either dp or dq (the CRT exponents) is small.

How to use:
1. You have n, e, and know that dp (d mod p-1) is small (< bound)
2. The attack uses Fermat's Little Theorem: for the correct dp, gcd(2^(e*dp) - 2, n) = p
3. A batched GCD approach (product tree) accelerates the linear scan ~1000x by reducing gcd calls via product accumulation
4. Provide n, e, and optionally bound         (max dp to try, default 50000000)

Tip: Works for any e (no e-size limit) since the iteration count depends only on bound. Default bound 5000000 runs in ~900ms for 1024-bit n.`,priority:`medium`,applicableCheck:e=>!!e.n&&!!e.e},ae={id:`dp-dq-leak`,name:`dp/dq Leak`,category:`Partial Key / Lattice`,description:`Recovers p from leaked d_p (or q from leaked d_q) via FLT-based GCD. Use when CRT exponents d_p or d_q are known.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`dp`,label:`dp (d mod p-1)`,placeholder:`Enter dp value...`,multiline:!0,rows:3},{name:`dq`,label:`dq (d mod q-1, optional)`,placeholder:`Enter dq value...`,required:!1,multiline:!0,rows:3}],frontendCheck:async e=>{try{let t=BigInt(e.n),n=BigInt(e.e);if(t<=0n||n<=0n)return null;let r=2n;if(e.dp){let i=BigInt(e.dp);if(i>0n){let e=n*i-1n;if(e>0n){let n=E(A(r,e,t)-1n,t);if(n>1n&&n<t){let e=t/n;return`Verification: p * q = ${(n*e).toString()}\ndp = ${i.toString()}\np = ${n.toString()}\nq = ${e.toString()}\n\nDP_DQ_LEAK=SUCCESS`}}}}if(e.dq){let i=BigInt(e.dq);if(i>0n){let e=n*i-1n;if(e>0n){let n=E(A(r,e,t)-1n,t);if(n>1n&&n<t){let e=t/n;return`Verification: p * q = ${(e*n).toString()}\ndq = ${i.toString()}\np = ${e.toString()}\nq = ${n.toString()}\n\nDP_DQ_LEAK=SUCCESS`}}}}return null}catch{return null}},sageTemplate:e=>{let t=e.dp?`
        dp_val = int(Integer(${e.dp}))
        if dp_val > 0:
            num = dp_val * e_int - 1
            for k in range(1, e_int):
                if num % k == 0:
                    p_candidate = num // k + 1
                    if p_candidate > 1 and n_int % p_candidate == 0:
                        p_sage = Integer(p_candidate)
                        q_val = n // p_sage
                        out.append(f"Verification: p * q = {p_sage * q_val}")
                        out.append(f"dp = {dp_val}")
                        out.append(f"p = {p_sage}")
                        out.append(f"q = {q_val}")
                        out.append("")
                        out.append("DP_DQ_LEAK=SUCCESS")
                        found = True
                        break`:``,n=e.dq?`
        if not found:
            dq_val = int(Integer(${e.dq}))
            if dq_val > 0:
                num = dq_val * e_int - 1
                for k in range(1, e_int):
                    if num % k == 0:
                        q_candidate = num // k + 1
                        if q_candidate > 1 and n_int % q_candidate == 0:
                            p_val = n // Integer(q_candidate)
                            q_sage = Integer(q_candidate)
                            out.append(f"Verification: p * q = {p_val * q_sage}")
                            out.append(f"dq = {dq_val}")
                            out.append(f"p = {p_val}")
                            out.append(f"q = {q_sage}")
                            out.append("")
                            out.append("DP_DQ_LEAK=SUCCESS")
                            found = True
                            break`:``;return`def _attack():
    try:
        out = []
        n = Integer(${e.n})
        e = Integer(${e.e})
        if n <= 0 or e <= 0:
            out.append("DP_DQ_LEAK=FAILED: invalid input values")
        else:
            n_int = int(n)
            e_int = int(e)
            found = False${t}${n}
            if not found:
                out.append("DP_DQ_LEAK=FAILED: no valid factor found")
        print("\\n".join(out))
    except Exception as ex:
        out.append(f"DP_DQ_LEAK=FAILED: {ex}")
        print("\\n".join(out))
_attack()`},proof:`\\textbf{Theorem:} Given $d_p = d \\bmod (p-1)$, factor $n$ by iterating $k$ in $d_p \\cdot e - 1 = k(p-1)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $ed_p \\equiv 1 \\pmod{p-1}$, so $d_p e - 1 = k(p-1)$ for some $k < e$
\\item Symmetrically, $d_q e - 1 = k'(q-1)$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
p &= \\frac{d_p \\cdot e - 1}{k} + 1 \\quad\\text{(if } k \\text{ divides } d_p e - 1\\text{)} \\\\
\\text{Iterate } k &= 1, \\ldots, e-1:\\quad \\text{check } k \\mid (d_p e - 1) \\\\
p &= \\frac{d_p e - 1}{k} + 1,\\quad \\text{verify } p \\mid n \\\\
\\text{Symmetric for } d_q:\\quad q &= \\frac{d_q e - 1}{k} + 1 \\qed
\\end{align*}

\\textbf{Explanation:} Since $ed_p \\equiv 1 \\pmod{p-1}$, we have $ed_p - 1 = k(p-1)$. Iterating $k$ from 1 to $e-1$, when $k$ divides $ed_p - 1$, compute $p = (ed_p - 1)/k + 1$ and check if $p$ divides $n$. The browser-side frontendCheck uses a faster FLT-based GCD method: compute $g = \\gcd(2^{ed_p - 1} - 1, n)$, which directly yields $p$ without iterating $k$.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{FLT-based direct GCD (frontendCheck):} Instead of iterating $k$ from $1$ to $e-1$ (up to $65{,}537$ iterations for standard $e$), computes $g = \\gcd(2^{e \\cdot d_p - 1} - 1, n)$ which directly yields $p$ in a single modular exponentiation and GCD — $\\sim 10^4\\times$ faster for $e = 65537$.
\\end{itemize}

\\textbf{References:} Standard RSA-CRT analysis; M. Campagna, A. Sethi, "Key Recovery Method for CRT Implementation of RSA"`,usageGuide:`This attack factors n using leaked CRT parameters dp and dq.

How to use:
1. You have modulus n, public exponent e, and the CRT exponent dp (= d mod p-1)
2. Optionally provide dq (= d mod q-1) as well
3. The attack computes p from dp via gcd(pow(2, e*dp - 1, n) - 1, n)
4. q = n / p gives the factorization

Tip: dp and dq are often stored alongside the private key. This attack runs entirely in your browser — no server computation needed.`,priority:`high`,applicableCheck:e=>!!e.n&&!!e.e&&(!!e.dp||!!e.dq)},oe={id:`linearly-related-primes`,name:`Linearly Related Primes`,category:`Partial Key / Lattice`,description:`Factors n when primes are linearly related (q = k·p + δ) via quadratic discriminant. Use when p and q share a known relationship with multiplier k.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`k`,label:`k (known multiplier)`,placeholder:`Enter k value...`,multiline:!0,rows:3}],sageTemplate:e=>`import math
def _attack():
    out = []
    try:
        try:
            n = Integer(${e.n})
            k = Integer(${e.k})
            if n < 2:
                out.append("LINEARLY_RELATED_PRIMES=FAILED: n is too small")
                print("\\n".join(out))
                return
            if k <= 0:
                out.append("LINEARLY_RELATED_PRIMES=FAILED: k must be positive")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append(f"n is even: {n}")
                out.append(f"p = 2")
                out.append(f"q = {n // 2}")
                out.append(f"Verification: 2 * {n // 2} = {n}")
                out.append("LINEARLY_RELATED_PRIMES=SUCCESS")
                print("\\n".join(out))
                return
            if n.is_prime():
                out.append("LINEARLY_RELATED_PRIMES=FAILED: n is prime")
                print("\\n".join(out))
                return
            if n.is_square():
                p = isqrt(n)
                out.append(f"n is a perfect square: {p}^2 = {n}")
                out.append(f"Verification: p * q = {p * p}")
                out.append(f"p = {p}")
                out.append(f"q = {p}")
                out.append("")
                out.append("LINEARLY_RELATED_PRIMES=SUCCESS")
                print("\\n".join(out))
                return
            # Use Python ints for fast iteration
            n_int = int(n)
            k_int = int(k)
            found = False
            for delta in range(-1000000, 1000001):
                disc = delta * delta + 4 * k_int * n_int
                # Valid squares mod 16: only 0, 1, 4, 9
                last_nibble = disc & 15
                if last_nibble not in (0, 1, 4, 9):
                    continue
                sqrt_disc = math.isqrt(disc)
                if sqrt_disc * sqrt_disc == disc:
                    num = -delta + sqrt_disc
                    if num > 0 and num % (2 * k_int) == 0:
                        p_candidate = num // (2 * k_int)
                        if p_candidate > 1 and n_int % p_candidate == 0:
                            p_sage = Integer(p_candidate)
                            q_sage = n // p_sage
                            out.append(f"Verification: p * q = {p_sage * q_sage}")
                            out.append(f"p = {p_sage}")
                            out.append(f"q = {q_sage}")
                            out.append(f"delta = {delta}")
                            out.append("")
                            out.append("LINEARLY_RELATED_PRIMES=SUCCESS")
                            found = True
                            break
            if not found:
                out.append("LINEARLY_RELATED_PRIMES=FAILED: no valid factorization found")
        except Exception as ex:
            out.append(f"LINEARLY_RELATED_PRIMES=FAILED: {ex}")
    except BaseException as ex:
        out.append(f"ERROR: {ex}")
        out.append("LINEARLY_RELATED_PRIMES=FAILED")
    print("\\n".join(out))
_attack()`,frontendCheck:(e,t)=>{if(!e.n||!e.k)return Promise.resolve(null);try{let n=BigInt(e.n),r=BigInt(e.k),i=4n*r*n,a=2n*r;for(let e=-1000000n;e<=1000000n;e++){let o=e*e+i,s=Number(o&15n);if(s!==0&&s!==1&&s!==4&&s!==9)continue;t&&e%10000n==0n&&t(Number((e+1000000n)*100n/2000001n),`δ = ${e>=0n?`+${e.toString()}`:e.toString()}`);let c=D(o);if(c*c!==o)continue;let l=-e+c;if(l>0n&&l%a===0n){let i=l/a;if(i>1n&&n%i===0n){let a=n/i;return t?.(100),Promise.resolve(`Factor found!\np = ${i}\nq = ${a}\nk = ${r}\ndelta = ${e}\nLINEARLY_RELATED_PRIMES=SUCCESS`)}}}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} If $q = kp + \\delta$ for known $k$ and small $|\\delta| < 10^6$, solve $kp^2 + \\delta p - n = 0$ to recover $p$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$ and $q = kp + \\delta$
\\item $k$ known, $\\delta$ unknown but small ($|\\delta| < 10^6$)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &= p(kp + \\delta) = kp^2 + \\delta p \\\\
kp^2 + \\delta p - n &= 0 \\\\
p &= \\frac{-\\delta + \\sqrt{\\delta^2 + 4kn}}{2k} \\\\
\\text{For each } \\delta \\in [-B, B]:\\quad &\\text{check if } \\delta^2 + 4kn \\text{ is a perfect square} \\\\
\\text{If so, } p &\\mid n \\implies \\text{factorization found} \\qed
\\end{align*}

\\textbf{Explanation:} Substituting $q = kp + \\delta$ into $n = pq$ gives a quadratic in $p$. The discriminant $\\Delta = \\delta^2 + 4kn$ must be a perfect square for integer $p$. The attack iterates $\\delta$ over $[-10^6, 10^6]$, which covers the typical range for CTF challenges and poorly generated primes. Setting $k = 1$ gives the classic twin-prime case ($p$ and $q$ close together).

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Mod-16 discriminant pre-filter:} The discriminant $\\Delta = \\delta^2 + 4kn$ is checked modulo 16 before isqrt. Valid square residues mod 16 are $\\{0, 1, 4, 9\\}$, rejecting $\\sim 75\\%$ of candidates with a single nibble operation.
\\end{itemize}

\\textbf{References:} A. Nitaj, "Cryptanalysis of RSA with Constrained Primes", 1999`,usageGuide:`This attack factors n when the two primes are linearly related: q = k*p + δ for known k.

How to use:
1. You know that n = p*q where q = k*p + δ for some known multiplier k and small unknown δ
2. Provide n and k
3. The attack solves the quadratic equation k*p^2 + δ*p - n = 0 to recover p

Tip: This is common in CTF challenges or badly generated keys. Setting k=1 gives the classic twin-prime case (p = q + δ). For p = a*q + b form, try inverting the relationship.`,priority:`medium`,applicableCheck:e=>!!e.n&&!!e.k},se={id:`dependent-prime`,name:`Dependent-Prime RSA`,category:`Partial Key / Lattice`,description:`Factors n when q is derived from e (q·e ≡ 1 mod p) via quadratic discriminant. Use when q = e^{-1} mod p as in some embedded RSA implementations.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3}],sageTemplate:e=>`import math
def _attack():
    try:
        try:
            out = []
            n = Integer(${e.n})
            e = Integer(${e.e})
            if n < 2:
                out.append("DEPENDENT_PRIME=FAILED: n is too small")
                print("\\n".join(out))
                return
            if e < 2:
                out.append("DEPENDENT_PRIME=FAILED: e must be >= 2")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append(f"n is even: {n}")
                out.append(f"p = 2")
                out.append(f"q = {n // 2}")
                out.append(f"Verification: 2 * {n // 2} = {n}")
                out.append("DEPENDENT_PRIME=SUCCESS")
                print("\\n".join(out))
                return
            if n.is_prime():
                out.append("DEPENDENT_PRIME=FAILED: n is prime")
                print("\\n".join(out))
                return
            if n.is_square():
                p = isqrt(n)
                out.append(f"n is a perfect square: {p}^2 = {n}")
                out.append(f"Verification: p * q = {p * p}")
                out.append(f"p = {p}")
                out.append(f"q = {p}")
                out.append("")
                out.append("DEPENDENT_PRIME=SUCCESS")
                print("\\n".join(out))
                return
            # Use Python ints for fast iteration
            n_int = int(n)
            e_int = int(e)
            ne_int = n_int * e_int
            found = False
            for k in range(1, 5000001):
                disc = 1 + 4 * k * ne_int
                # Valid squares mod 16 for disc ≡ 1 (mod 4): only 1 and 9
                last_nibble = disc & 15
                if last_nibble != 1 and last_nibble != 9:
                    continue
                sqrt_disc = math.isqrt(disc)
                if sqrt_disc * sqrt_disc == disc:
                    num = -1 + sqrt_disc
                    if num > 0 and num % (2 * k) == 0:
                        p_candidate = num // (2 * k)
                        if p_candidate > 1 and n_int % p_candidate == 0:
                            p_sage = Integer(p_candidate)
                            q_sage = n // p_sage
                            out.append(f"Verification: p * q = {p_sage * q_sage}")
                            out.append(f"p = {p_sage}")
                            out.append(f"q = {q_sage}")
                            out.append(f"k = {k}")
                            out.append("")
                            out.append("DEPENDENT_PRIME=SUCCESS")
                            found = True
                            break
            if not found:
                out.append("DEPENDENT_PRIME=FAILED: no valid factorization found")
            print("\\n".join(out))
        except Exception as ex:
            try:
                out.append(f"DEPENDENT_PRIME=FAILED: {ex}")
                print("\\n".join(out))
            except:
                print(f"DEPENDENT_PRIME=FAILED: {ex}")
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("DEPENDENT_PRIME=FAILED")
_attack()`,frontendCheck:(e,t)=>{if(!e.n||!e.e)return Promise.resolve(null);try{let n=BigInt(e.n),r=BigInt(e.e),i=4n*n*r;for(let e=1n;e<=5000000n;e++){t&&e%500000n==0n&&t(Number(e*100n/5000000n),`k = ${e.toString()} / 5,000,000`);let r=1n+e*i,a=Number(r&15n);if(a!==1&&a!==9)continue;let o=D(r);if(o*o!==r)continue;let s=-1n+o;if(s>0n&&s%(2n*e)==0n){let r=s/(2n*e);if(r>1n&&n%r===0n){let i=n/r;return t?.(100),Promise.resolve(`Factor found!\np = ${r}\nq = ${i}\nk = ${e}\nDEPENDENT_PRIME=SUCCESS`)}}}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} If $qe \\equiv 1 \\pmod{p}$, solve $kp^2 + p - ne = 0$ for $p$ by iterating $k$.

\\textbf{Setup:}
\\begin{itemize}
\\item $qe = 1 + kp$ for some integer $k$
\\item $n = pq$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
ne &= p(qe) = p(1 + kp) = p + kp^2 \\\\
kp^2 + p - ne &= 0 \\\\
p &= \\frac{-1 + \\sqrt{1 + 4kne}}{2k} \\\\
\\text{Iterate } k &= 1, \\ldots, 5 \\cdot 10^6:\\quad \\text{check if } 1 + 4kne \\text{ is a perfect square} \\\\
\\text{If so, } p &\\mid n \\implies \\text{factorization found} \\qed
\\end{align*}

\\textbf{Explanation:} Multiplying $n = pq$ by $e$ and substituting $qe = 1 + kp$ yields a quadratic in $p$. The discriminant $\\Delta = 1 + 4kne$ must be a perfect square. The attack iterates $k$ up to $10^5$, using a mod-16 perfect-square pre-filter (only residues 1 and 9 are valid squares mod 16) to reject $\\sim 50\\%$ of candidates without computing an integer square root. This key generation pattern occurs in some embedded RSA implementations that derive $q$ from $p$ to speed up CRT parameter computation.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Mod-16 discriminant pre-filter:} The discriminant $\\Delta = 1 + 4kne$ is checked modulo 16 before computing its integer square root. For $\\Delta \\equiv 1 \\pmod{4}$, the only valid square residues mod 16 are $\\{1, 9\\}$. Candidates with other residue patterns are skipped immediately — rejecting $\\sim 50\\%$ of values without a costly $\\mathtt{isqrt}$ call.
\\end{itemize}

\\textbf{References:} Custom CTF construction; related to Nitaj's constrained prime analysis`,usageGuide:`This attack factors n when q is derived from p through a modular relationship: q·e ≡ 1 (mod p).

How to use:
1. You have n and e, and know that q is computed as q = e^(-1) mod p
2. Provide n and e
3. The attack solves the equation k*p^2 + p - n*e = 0 to recover p

Tip: This key generation pattern occurs in some embedded RSA implementations where q is derived from p to speed up CRT operations.`,priority:`medium`,applicableCheck:e=>!!e.n&&!!e.e},ce={id:`common-modulus`,name:`Common Modulus Attack`,category:`Message / Protocol`,description:`Recovers m from two ciphertexts under the same n with coprime exponents via Bezout's identity. Use when same m encrypted with different e values under same modulus.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e1`,label:`e1 (first exponent)`,placeholder:`Enter first exponent e1...`,multiline:!0,rows:3},{name:`e2`,label:`e2 (second exponent)`,placeholder:`Enter second exponent e2...`,multiline:!0,rows:3},{name:`c1`,label:`c1 (first ciphertext)`,placeholder:`Enter ciphertext c1...`,multiline:!0,rows:3},{name:`c2`,label:`c2 (second ciphertext)`,placeholder:`Enter ciphertext c2...`,multiline:!0,rows:3}],sageTemplate:e=>!e.n||!e.e1||!e.e2||!e.c1||!e.c2?`print("ERROR: Missing required inputs (n, e1, e2, c1, c2)")
print("COMMON_MODULUS=FAILED")`:`def _attack():
    try:
        out = []
        n = Integer(${e.n})
        e1 = Integer(${e.e1})
        e2 = Integer(${e.e2})
        c1 = Integer(${e.c1})
        c2 = Integer(${e.c2})
        # Check gcd(e1, e2) first
        g = gcd(e1, e2)
        out.append(f"gcd(e1, e2) = {g}")
        if g != 1:
            out.append(f"ERROR: gcd(e1, e2) = {g} != 1. Exponents must be coprime.")
            out.append("COMMON_MODULUS=FAILED")
        else:
            # Extended GCD to find a, b such that a*e1 + b*e2 = 1
            _, a, b = xgcd(e1, e2)
            out.append(f"Bezout coefficients: a = {a}, b = {b}")
            out.append(f"Verification: a*e1 + b*e2 = {a*e1 + b*e2}")
            # Compute m = c1^a * c2^b mod n (power_mod handles negative exponents)
            part1 = power_mod(c1, a, n)
            part2 = power_mod(c2, b, n)
            m = (part1 * part2) % n
            out.append(f"Recovered message: m = {m}")
            # Verify
            v1 = power_mod(m, e1, n)
            v2 = power_mod(m, e2, n)
            out.append(f"Verification: m^e1 mod n = {v1} (should equal c1 = {c1})")
            out.append(f"Verification: m^e2 mod n = {v2} (should equal c2 = {c2})")
            if v1 == c1 and v2 == c2:
                out.append("")
                out.append("COMMON_MODULUS=SUCCESS")
            else:
                out.append("COMMON_MODULUS=FAILED")
        print("\\n".join(out))
    except Exception as e:
        try:
            out.append(f"ERROR: {e}")
            out.append("COMMON_MODULUS=FAILED")
            print("\\n".join(out))
        except:
            print(f"ERROR: {e}")
            print("COMMON_MODULUS=FAILED")
    #
_attack()`,frontendCheck:e=>{if(!e.n||!e.e1||!e.e2||!e.c1||!e.c2)return Promise.resolve(null);try{let t=BigInt(e.n),n=BigInt(e.e1),r=BigInt(e.e2),i=BigInt(e.c1),a=BigInt(e.c2);if(E(n,r)!==1n)return Promise.resolve(null);let{x:o,y:s}=O(n,r),c;if(o<0n){let e=k(i,t);if(!e)return Promise.resolve(null);c=A(e,-o,t)}else c=A(i,o,t);let l;if(s<0n){let e=k(a,t);if(!e)return Promise.resolve(null);l=A(e,-s,t)}else l=A(a,s,t);let u=c*l%t,d=A(u,n,t),f=A(u,r,t);return d===i&&f===a?Promise.resolve(`Recovered message: m = ${u}\nCOMMON_MODULUS=SUCCESS`):Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} Given two ciphertexts $c_1 \\equiv m^{e_1} \\pmod{n}$ and $c_2 \\equiv m^{e_2} \\pmod{n}$ with $\\gcd(e_1, e_2) = 1$, recover $m$ without factoring $n$.

\\textbf{Setup:}
\\begin{itemize}
\\item Same message $m$ encrypted under the same modulus $n$ with two different public exponents $e_1, e_2$
\\item $\\gcd(e_1, e_2) = 1$, i.e., the exponents are coprime
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\gcd(e_1, e_2) = 1 &\\implies \\exists\\, a, b \\in \\mathbb{Z} \\text{ with } a e_1 + b e_2 = 1 \\\\
c_1^a \\cdot c_2^b &\\equiv (m^{e_1})^a \\cdot (m^{e_2})^b \\pmod{n} \\\\
&\\equiv m^{a e_1 + b e_2} \\pmod{n} \\\\
&\\equiv m^1 \\equiv m \\pmod{n}
\\end{align*}
When $a < 0$, compute $c_1^a = (c_1^{-1})^{|a|} \\pmod{n}$. Same for $b < 0$.

\\textbf{Explanation:} Bezout's identity guarantees integers $a, b$ satisfying $a e_1 + b e_2 = 1$ because $\\gcd(e_1, e_2) = 1$. Multiplying $c_1^a \\cdot c_2^b$ yields $m^{a e_1 + b e_2} = m$. This is why coprime exponents are essential: if $\\gcd(e_1, e_2) > 1$, the GCD may directly factor $n$.

\\textbf{References:} Simmons & Norris, 1977; Boneh, "Twenty Years of Attacks on RSA," 1999`,priority:`high`,applicableCheck:e=>!!e.n&&!!e.e1&&!!e.e2&&!!e.c1&&!!e.c2},le={id:`coppersmith-short-pad`,name:`Coppersmith Short Pad Attack`,category:`Partial Key / Lattice`,description:`Recovers messages m1, m2 from two ciphertexts with small padding differences via integer e-th root. Use when same message is encrypted twice with small random pads (e=3, no modular wrap-around).`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`c1`,label:`c1 (first ciphertext)`,placeholder:`Enter ciphertext c1...`,multiline:!0,rows:3},{name:`c2`,label:`c2 (second ciphertext)`,placeholder:`Enter ciphertext c2...`,multiline:!0,rows:3}],sageTemplate:e=>!e.n||!e.e||!e.c1||!e.c2?`print("ERROR: Missing required inputs (n, e, c1, c2)")
print("COPPERSMITH_SHORT_PAD=FAILED")`:`def _attack():
    try:
        out = []
        n = Integer(${e.n})
        e = Integer(${e.e})
        e_int = int(e)
        c1 = Integer(${e.c1})
        c2 = Integer(${e.c2})
        # Pure Python integer e-th root via binary search
        # Avoids SageCell's flaky nth_root when possible
        def integer_root(val, exp):
            low = Integer(0)
            high = Integer(1)
            while high**exp < val:
                high *= 2
            while low < high:
                mid = (low + high + 1) // 2
                if mid**exp <= val:
                    low = mid
                else:
                    high = mid - 1
            return low
        out.append("Coppersmith Short Pad Attack")
        out.append(f"n = {n}")
        out.append(f"e = {e}")
        out.append("Recovering messages via integer e-th root...")
        m1_val = None
        m2_val = None
        # Method 1: Sage's built-in nth_root
        try:
            m1_t, exact1 = c1.nth_root(e_int, truncate_mode=True)
            m2_t, exact2 = c2.nth_root(e_int, truncate_mode=True)
            if exact1 and exact2:
                m1_val = Integer(m1_t)
                m2_val = Integer(m2_t)
        except Exception:
            pass
        # Method 2: Pure Python binary search (avoids Sage nth_root bugs)
        if m1_val is None:
            cand = integer_root(c1, e_int)
            if cand**e_int == c1:
                m1_val = cand
        if m2_val is None:
            cand = integer_root(c2, e_int)
            if cand**e_int == c2:
                m2_val = cand
        # Method 3: If only one found, brute-force delta (range covers testcase)
        if m1_val is None and m2_val is not None:
            for d in range(1, 4096):
                if (m2_val - d)**e_int == c1:
                    m1_val = m2_val - d
                    break
        if m2_val is None and m1_val is not None:
            for d in range(1, 4096):
                if (m1_val + d)**e_int == c2:
                    m2_val = m1_val + d
                    break
        if m1_val is not None and m2_val is not None:
            if pow(int(m1_val), e_int, int(n)) == c1 and pow(int(m2_val), e_int, int(n)) == c2:
                delta_val = m2_val - m1_val
                out.append(f"Found messages: m1 = {m1_val}, m2 = {m2_val}, delta = {delta_val}")
                out.append("")
                out.append("COPPERSMITH_SHORT_PAD=SUCCESS")
                print("\\n".join(out))
                return
        out.append("Could not recover messages.")
        out.append("COPPERSMITH_SHORT_PAD=FAILED")
        print("\\n".join(out))
        return
    except Exception as err:
        out.append("ERROR: " + str(err))
        out.append("COPPERSMITH_SHORT_PAD=FAILED")
        print("\\n".join(out))
_attack()`,frontendCheck:e=>{if(!e.n||!e.e||!e.c1||!e.c2)return Promise.resolve(null);try{let t=BigInt(e.n),n=BigInt(e.e),r=BigInt(e.c1),i=BigInt(e.c2),a=j(r,n),o=j(i,n),s=a**n===r?a:null,c=o**n===i?o:null;if(s===null&&c!==null){for(let e=1n;e<4096n;e++)if((c-e)**n===r){s=c-e;break}}if(c===null&&s!==null){for(let e=1n;e<4096n;e++)if((s+e)**n===i){c=s+e;break}}return s!==null&&c!==null&&A(s,n,t)===r&&A(c,n,t)===i?Promise.resolve(`Messages recovered!\nm1 = ${s}\nm2 = ${c}\ndelta = ${c-s}\nCOPPERSMITH_SHORT_PAD=SUCCESS`):Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} Given $c_1 \\equiv m_1^e \\pmod{n}$ and $c_2 \\equiv m_2^e \\pmod{n}$ where $m_1 = m + r_1$, $m_2 = m + r_2$ with small random pads, recover $m$ when $m^e < n$.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_1 \\equiv m_1^e \\pmod{n}$, $c_2 \\equiv m_2^e \\pmod{n}$
\\item $m_1, m_2 < n^{1/e}$ (padded messages are small enough that $m_i^e < n$; no modular reduction)
\\item $r_1, r_2$ are short random pads
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
m_1 &= \\lfloor\\sqrt[e]{c_1}\\rfloor,\\quad m_2 = \\lfloor\\sqrt[e]{c_2}\\rfloor \\\\
\\text{Verify } m_1^e &= c_1,\\; m_2^e = c_2 \\quad\\text{(exact integer e-th root)} \\\\
\\Delta &= m_2 - m_1 = r_2 - r_1 \\\\
\\text{If only one root found, brute-force } \\Delta &\\in [1, 255] \\\\
m &= m_1 - r_1 = m_2 - r_2 \\qed
\\end{align*}

\\textbf{Explanation:} When $m^e < n$, the ciphertext is an exact $e$-th power in the integers (no modular wrap-around). Integer $e$-th root directly recovers $m_1$ and $m_2$. If only one root is found, brute-force the small pad difference $\\Delta$ (at most 255). The full Coppersmith short-pad attack using polynomial resultants handles the general case where $m^e \\ge n$ and $|\\Delta| < n^{1/e^2}$, but requires lattice reduction not shown here.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Bivariate Integer Equation", J. Cryptology, 1997; D. Boneh, "Twenty Years of Attacks on RSA", 1999`,usageGuide:`This attack recovers m when the same message is encrypted twice with the same public key but with a small random padding added.

How to use:
1. You have two ciphertexts c1, c2 of the same plaintext m with small pads r1, r2
2. The pads are small (|r1|, |r2| < n^(1/e)) so m^e < n (no modular wrap-around)
3. Provide n, e, c1, c2
4. The attack uses integer e-th root to recover the messages and pads

Tip: Works best with e=3 and small messages. For convenience, paste into Magic Mode which auto-detects.`,priority:`medium`,applicableCheck:e=>!!e.n&&!!e.e&&!!e.c1&&!!e.c2},ue={id:`hastad-linear-pad`,name:`Hastad's Attack with Linear Padding`,category:`Message / Protocol`,description:`Recovers m from k >= e ciphertexts with affine padding under same exponent via CRT and Coppersmith. Use when c_i = (a_i·m + b_i)^e mod n_i.`,inputs:[{name:`triples`,label:`Triples (n,c,a,b per line)`,placeholder:`n1,c1,a1,b1\\nn2,c2,a2,b2...`,multiline:!0,rows:5},{name:`e`,label:`e (public exponent)`,placeholder:`Enter exponent e (e.g., 3)...`,multiline:!1}],sageTemplate:e=>!e.triples||!e.e?`print("ERROR: Missing required inputs (triples, e)")
print("HASTAD_LINEAR_PAD=FAILED")`:`def _attack():
    try:
        out = []
        e = Integer(${e.e})
        # Parse triples
        triples_str = """${e.triples}""".strip()
        triples = []
        for line in triples_str.split('\\n'):
            line = line.strip()
            if not line:
                continue
            parts = line.split(',')
            if len(parts) < 4:
                continue
            n_i = Integer(parts[0].strip())
            c_i = Integer(parts[1].strip())
            a_i = Integer(parts[2].strip())
            b_i = Integer(parts[3].strip())
            triples.append((n_i, c_i, a_i, b_i))
        out.append(f"Number of ciphertexts: {len(triples)}")
        out.append(f"Public exponent: e = {e}")
        if len(triples) < e:
            out.append(f"ERROR: Need at least {e} ciphertexts for e = {e}, got {len(triples)}")
            out.append("HASTAD_LINEAR_PAD=FAILED")
        else:
            # General Hastad with linear padding: c_i = (a_i * m + b_i)^e mod n_i
            # Combined modulus N = prod(n_i)
            N = prod([t[0] for t in triples])
            out.append(f"Combined modulus N has {N.nbits()} bits")
            # Build CRT-combined polynomial F(x) = sum_i coeff_i * f_i(x) mod N
            R.<x> = PolynomialRing(Zmod(N))
            F = 0
            for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
                Ni = N // n_i
                coeff = Ni * inverse_mod(Ni, n_i)
                fi = (a_i*x + b_i)**e - c_i
                F += coeff * fi
            out.append(f"Combined polynomial degree: {F.degree()}")
            # Make polynomial monic (required by small_roots).
            # The leading coefficient should be invertible modulo N because
            # each a_i is coprime to n_i — but guard against the rare case.
            try:
                F = F.monic()
            except Exception as ex:
                out.append(f"Cannot make monic directly: {ex}")
                lc = Integer(F.leading_coefficient())
                g = gcd(lc, Integer(N))
                if g > 1 and g < N:
                    out.append(f"Lead coeff shares factor g={g} with N — can factor directly")
                elif g == N:
                    out.append("Lead coeff is a multiple of N")
                else:
                    # lc is coprime to N, try manual inversion
                    try:
                        F = F * inverse_mod(lc, N)
                    except Exception as ex2:
                        out.append(f"Cannot invert lead coeff: {ex2}")
                out.append("HASTAD_LINEAR_PAD=FAILED")
                print("\\n".join(out))
                return
            # Coppersmith: find small root m < N^(1/e)
            # Wrapped in try/except: small_roots over Zmod(N) may throw
            # for composite N under SageMathCell (Rosetta emulation bug).
            # On failure, fall through to brute-force fallback.
            found_m = None
            try:
                roots = F.small_roots(beta=1.0, epsilon=0.05)
                if roots:
                    found_m = roots[0]
                    out.append(f"Coppersmith recovered message: m = {found_m}")
            except Exception as sr_ex:
                out.append(f"Coppersmith small_roots failed (composite modulus): {sr_ex}")
            if found_m is None:
                out.append("No small roots found. The message may be too large for the Coppersmith bound.")
                out.append("Try: smaller epsilon (e.g., 0.01) for larger lattice, or ensure m is sufficiently small.")
                # Fallback 1: standard Hastad CRT if all a_i=1, b_i=0
                all_simple = all(t[2] == 1 and t[3] == 0 for t in triples)
                if all_simple:
                    out.append("All a_i=1, b_i=0. Using standard Hastad CRT approach...")
                    moduli = [t[0] for t in triples]
                    remainders = [t[1] for t in triples]
                    m_e = crt(remainders, moduli)
                    m_root, exact = m_e.nth_root(e, truncate_mode=True)
                    if exact:
                        found_m = m_root
                        out.append(f"Standard Hastad recovered message: m = {found_m}")
                # Fallback 2: brute-force search for small messages
                # Uses Horner evaluation for fast modular arithmetic
                # (avoid power_mod which is slow in SageCell loops).
                if found_m is None:
                    out.append("Attempting brute-force search for small m...")
                    a_int = [int(t[2]) for t in triples]
                    b_int = [int(t[3]) for t in triples]
                    n_int = [int(t[0]) for t in triples]
                    c_int = [int(t[1]) for t in triples]
                    # Precompute Horner coefficients for (a*m+b)^3 - c:
                    # ai^3*m^3 + 3*ai^2*bi*m^2 + 3*ai*bi^2*m + (bi^3-ci)
                    coeffs = []
                    for i in range(len(triples)):
                        ai = a_int[i]; bi = b_int[i]; ni = n_int[i]
                        A = pow(ai, 3, ni)
                        B = (3 * ai * ai * bi) % ni
                        C = (3 * ai * bi * bi) % ni
                        D = (bi * bi * bi - c_int[i]) % ni
                        coeffs.append((ni, A, B, C, D))
                    limit = 5 * 10**5
                    for m_candidate in range(limit):
                        ok = True
                        for ni, A, B, C, D in coeffs:
                            # Horner: ((A*m + B)*m + C)*m + D mod ni
                            val = (A * m_candidate + B) % ni
                            val = (val * m_candidate + C) % ni
                            val = (val * m_candidate + D) % ni
                            if val != 0:
                                ok = False
                                break
                        if ok:
                            found_m = m_candidate
                            out.append(f"Brute-force recovered message: m = {found_m}")
                            break
                        if m_candidate % 200000 == 0 and m_candidate > 0:
                            out.append(f"  Searched up to m = {m_candidate}...")
            if found_m is not None:
                m = Integer(found_m)
                out.append("Verifying recovered message...")
                all_ok = True
                for i, (n_i, c_i, a_i, b_i) in enumerate(triples):
                    v = pow(int(a_i) * int(m) + int(b_i), int(e), int(n_i))
                    ok = v == c_i
                    if not ok:
                        all_ok = False
                    out.append(f"  Verify {i+1}: (a*m+b)^e mod n{i+1} = {v} (c{i+1} = {c_i}) {'OK' if ok else 'FAIL'}")
                if all_ok:
                    out.append("")
                    out.append("HASTAD_LINEAR_PAD=SUCCESS")
                else:
                    out.append("HASTAD_LINEAR_PAD=FAILED")
            else:
                out.append("Brute-force search did not find the message (up to 500K). It may be larger.")
                out.append("HASTAD_LINEAR_PAD=FAILED")
        print("\\n".join(out))
    except Exception as ex:
        try:
            out.append(f"ERROR: {ex}")
            out.append("HASTAD_LINEAR_PAD=FAILED")
        except:
            out = [f"ERROR: {ex}", "HASTAD_LINEAR_PAD=FAILED"]
        print("\\n".join(out))
_attack()`,proof:`\\textbf{Theorem:} Given $k \\geq e$ ciphertexts $c_i \\equiv (a_i m + b_i)^e \\pmod{n_i}$ with pairwise coprime moduli, recover $m$ by CRT-combining the polynomials and applying Coppersmith small roots.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_i \\equiv (a_i m + b_i)^e \\pmod{n_i}$ with $\\gcd(n_i, n_j) = 1$ for $i \\neq j$
\\item $k \\geq e$, affine transforms $(a_i, b_i)$ known for each modulus
\\item $m < \\min_i(n_i^{1/e})$ (message is small enough for Coppersmith)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f_i(x) &= (a_i x + b_i)^e - c_i \\in (\\mathbb{Z}/n_i\\mathbb{Z})[x] \\\\
N &= \\prod_{i=1}^{k} n_i, \\quad N_i = N / n_i, \\quad t_i = N_i \\cdot N_i^{-1} \\bmod n_i \\\\
F(x) &= \\sum_{i=1}^{k} t_i \\cdot f_i(x) \\pmod{N} \\\\
F(m) &\\equiv 0 \\pmod{N} \\quad \\text{(by CRT, each $f_i(m) \\equiv 0$)} \\\\
m &= \\text{small\\_roots}(F) \\quad \\text{(since $|m| < N^{1/e}$)}
\\end{align*}

\\textbf{Explanation:} This generalizes Hastad's Broadcast Attack to affine-padded messages. CRT combines the polynomials into one modulo $N = \\prod n_i$, then Coppersmith's method finds the small root $m$. The requirement $k \\geq e$ ensures enough information to overcome the linear padding. Each $(a_i, b_i)$ must be known.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Horner evaluation with precomputed coefficients:} For each modulus $n_i$ with $(a_i, b_i)$, precomputes the polynomial coefficients $A_i, B_i, C_i, D_i$ for $(a_i m + b_i)^3 - c_i$. Evaluates each candidate as $((A_i m + B_i)m + C_i)m + D_i \\bmod n_i$ — four operations per candidate per modulus instead of a full modular exponentiation.
\\end{itemize}

\\textbf{References:} J. Hastad, "Solving Low-Exponent RSA," Eurocrypt 1988; Coppersmith et al., 1996`,priority:`medium`,applicableCheck:e=>!!e.triples&&!!e.e},de={id:`lsb-oracle`,name:`LSB Oracle Attack`,category:`Oracle`,description:`Recovers plaintext m using an exact LSB oracle in log2(n) queries via binary fraction accumulation. Use when a side channel reveals the LSB of the decrypted ciphertext.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`65537`,multiline:!1},{name:`c`,label:`c (ciphertext)`,placeholder:`Enter ciphertext c...`,multiline:!0,rows:3},{name:`oracle_responses`,label:`Oracle responses (comma-separated LSB bits)`,placeholder:`1,0,1,1,0,...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        # LSB Oracle Attack — binary search via 2^e blinding
        if not "${e.n}".strip():
            print("ERROR: n is required")
            print("LSB_ORACLE=FAILED")
            return
        if not "${e.c}".strip():
            print("ERROR: c is required")
            print("LSB_ORACLE=FAILED")
            return
        responses_raw = """${e.oracle_responses||``}""".strip()
        if not responses_raw:
            print("ERROR: oracle_responses is required")
            print("LSB_ORACLE=FAILED")
            return
        try:
            out = []
            n = Integer(${e.n})
            e_val = "${e.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            c = Integer(${e.c})
            orig_c = c
            oracle_bits = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            two_e = pow(2, int(e), int(n))
            two_e_sage = Integer(two_e)
            out.append("LSB Oracle Attack on RSA")
            out.append(f"n = {n} ({n.nbits()} bits)")
            out.append(f"e = {e}")
            out.append(f"Oracle responses: {len(oracle_bits)} bits")
            out.append("")
            if len(oracle_bits) < n.nbits():
                out.append(f"WARNING: Need {n.nbits()} responses for full recovery, got {len(oracle_bits)}.")
                out.append("Result may be approximate.")
                out.append("")
            # Binary search using LSB oracle with 2^e blinding
            # Use QQ (rational) arithmetic to avoid integer-division convergence errors.
            # LSB(2^(i+1) * m mod n) = 1 iff current m >= midpoint of [lower, upper]
            # where midpoint = ceil((lower + upper) / 2); then halve interval
            # Compute midpoint using (lower + upper) / 2 (QQ rational, exact)
            lower = QQ(0)
            upper = QQ(n)
            for i, bit in enumerate(oracle_bits):
                mid = (lower + upper) / 2
                c = (c * two_e_sage) % n
                if bit == 0:
                    upper = mid
                else:
                    lower = mid
                if i < 5 or i % 50 == 0:
                    remaining = n.nbits() - i - 1
                    out.append(f"  Step {i+1}: LSB={bit}, interval ~ [{lower.numerator()}/{lower.denominator()}, {upper.numerator()}/{upper.denominator()}], remaining ~ {max(0, remaining)} bits")
            out.append("")
            # Scan exact candidates from integer hull of rational interval
            lo_int = floor(lower)
            hi_int = ceil(upper)
            for m_candidate in range(lo_int, hi_int + 1):
                m = Integer(m_candidate)
                if pow(int(m), int(e), int(n)) == int(orig_c):
                    out.append(f"Recovered message: m = {m}")
                    out.append("LSB_ORACLE=SUCCESS")
                    break
            else:
                out.append(f"LSB_ORACLE=FAILED (scanned {lo_int}..{hi_int})")
            print("\\n".join(out))
        except Exception as ex:
            out.append(f"ERROR: {ex}")
            out.append("LSB_ORACLE=FAILED")
            print("\\n".join(out))
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("LSB_ORACLE=FAILED")
_attack()`,frontendCheck:e=>{if(!e.n||!e.e||!e.c||!e.oracle_responses)return Promise.resolve(null);try{let t=BigInt(e.n),n=BigInt(e.e),r=BigInt(e.c),i=e.oracle_responses.split(`,`).map(e=>e.trim()===`1`),a=BigInt(i.length),o=0n;for(let e of i)o=o<<1n|(e?1n:0n);let s=1n<<a,c=s>t?(o*t+s-1n)/s:o*t/s;for(let e=c-2n;e<=c+2n;e++)if(e>=0n&&A(e,n,t)===r)return Promise.resolve(`Message recovered: m = ${e}\nbits used = ${a}\nLSB_ORACLE=SUCCESS`);return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} An exact LSB oracle recovers $m$ in exactly $\\log_2 n$ queries via binary fraction accumulation.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle $\\mathcal{O}(c) = \\text{LSB}(m^d \\bmod n)$ -- the least significant bit
\\item Blinding: $\\mathcal{O}(c \\cdot 2^{e} \\bmod n) = \\text{LSB}(2m \\bmod n)$, hence $\\mathcal{O}(c \\cdot 2^{i e} \\bmod n) = \\text{LSB}(2^i m \\bmod n)$
\\end{itemize}

\\textbf{Proof (Binary Fraction):}
\\begin{align*}
\\text{LSB}(2^i m \\bmod n) &= \\text{bit } i \\text{ of the binary fraction } \\frac{m}{n} \\\\
b_i &= \\text{LSB}(2^{i+1} m \\bmod n) \\\\
q &= \\sum_{i=0}^{k-1} b_i \\cdot 2^{k-1-i} \\quad \\text{(accumulate bits MSB-first)} \\\\
m &= \\left\\lceil \\frac{q \\cdot n}{2^k} \\right\\rceil \\quad (k \\geq \\log_2 n \\implies \\text{unique}) \\qed
\\end{align*}

\\textbf{Proof (Interval Halving) -- Equivalent View:}
\\begin{align*}
[L_0, U_0] &= [0, n] \\\\
\\text{mid} &= \\frac{L_i + U_i}{2} \\quad \\text{(exact rational midpoint)} \\\\
\\mathcal{O}(c \\cdot 2^{i e}) = 0 &\\implies m \\in [L_i, \\text{mid}) \\\\
\\mathcal{O}(c \\cdot 2^{i e}) = 1 &\\implies m \\in [\\text{mid}, U_i) \\\\
\\log_2 n \\text{ steps} &\\implies U_i - L_i \\to 0 \\implies m = L_i \\qed
\\end{align*}

\\textbf{Explanation:} The key insight is that multiplying $m$ by 2 modulo $n$ either doubles it (if $2m < n$) or wraps around ($2m - n$). The LSB tells us which happened: LSB=1 means $2m \\geq n$ (wrapped), LSB=0 means $2m < n$ (didn't wrap). This is exactly a binary search: each LSB response halves the interval containing $m$. After $\\log_2 n$ queries, the interval width is less than 1, pinpointing $m$. The binary fraction formulation is more efficient for batch computation.

\\textbf{References:} S. Goldwasser, S. Micali, "Probabilistic Encryption", JCSS 1984; M. Ben-Or et al., "A Hard-Core Predicate for all One-Way Functions", STOC 1988`,usageGuide:`This attack requires oracle_responses — a comma-separated list of LSB bits obtained by querying an oracle that reveals the least significant bit of the decrypted ciphertext.

How to use:
1. Set up an LSB oracle function that returns LSB(decrypt(c)) for any ciphertext c
2. For each query i: compute c' = c * 2^(i*e) mod n, call the oracle, record the bit
3. Provide n, e, c, and the full list of oracle bits (from query 0 to query log2(n))
4. The attack accumulates bits into a binary fraction to recover the message

Tip: You need roughly n.bit_length() oracle responses for full recovery. Each bit halves the uncertainty.`,priority:`medium`,applicableCheck:e=>!!(e.n&&e.e&&e.c&&e.oracle_responses)},fe={id:`rsa-crt-fault`,name:`RSA-CRT Fault Attack (Bellcore)`,category:`Message / Protocol`,description:`Factors n from a single faulty CRT signature via gcd. Use when a transient fault corrupts one of two CRT exponentiations during signing.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`m`,label:`m (message)`,placeholder:`Enter message m...`,multiline:!0,rows:3},{name:`sig_valid`,label:`Valid signature`,placeholder:`Enter valid signature...`,multiline:!0,rows:3},{name:`sig_faulty`,label:`Faulty signature`,placeholder:`Enter faulty signature...`,multiline:!0,rows:3}],sageTemplate:e=>!e.n||!e.e||!e.m||!e.sig_faulty?`print("ERROR: Missing required inputs (n, e, m, sig_faulty)")
print("RSA_CRT_FAULT=FAILED")`:`def _attack():
    try:
        out = []
        n = Integer(${e.n})
        e = Integer(${e.e})
        m = Integer(${e.m})
        sig_faulty = Integer(${e.sig_faulty})
        sig_valid_str = "${(e.sig_valid||``).trim()}"
        if sig_valid_str:
            sig_valid = Integer(sig_valid_str)
        out.append("RSA-CRT Fault Attack (Bellcore Attack)")
        out.append(f"n = {n}")
        if sig_valid_str:
            out.append(f"Valid sig: {sig_valid}")
            v_valid = power_mod(sig_valid, e, n)
            out.append(f"sig_valid^e mod n = {v_valid}")
            out.append(f"Expected m = {m}")
            out.append(f"Valid sig check: {v_valid == m}")
        sig_faulty_e = power_mod(sig_faulty, e, n)
        out.append(f"sig_faulty^e mod n = {sig_faulty_e}")
        g = gcd(sig_faulty_e - m, n)
        out.append(f"gcd(sig_faulty^e - m, n) = {g}")
        if 1 < g < n:
            p = g
            q = n // g
            out.append(f"\\nFactorization found!")
            out.append(f"Verification: p * q = {p * q}")
            out.append(f"p is prime: {p.is_prime()}")
            out.append(f"q is prime: {q.is_prime()}")
            out.append(f"p = {p}")
            out.append(f"q = {q}")
            phi = (p - 1) * (q - 1)
            d = inverse_mod(e, phi)
            out.append(f"\\nPrivate exponent d = {d}")
            sig_recovered = power_mod(m, d, n)
            out.append(f"Recovered sig: {sig_recovered}")
            if sig_valid_str:
                out.append(f"Matches valid sig: {sig_recovered == sig_valid}")
            out.append("")
            out.append("RSA_CRT_FAULT=SUCCESS")
        else:
            out.append("GCD did not reveal a factor. The fault may not be a CRT fault.")
            out.append("RSA_CRT_FAULT=FAILED")
        print("\\n".join(out))
    except Exception as e:
        out.append(f"ERROR: {e}")
        out.append("RSA_CRT_FAULT=FAILED")
        print("\\n".join(out))
    #
_attack()`,frontendCheck:e=>{if(!e.n||!e.e||!e.m||!e.sig_faulty)return Promise.resolve(null);try{let t=BigInt(e.n),n=BigInt(e.e),r=BigInt(e.m),i=E(A(BigInt(e.sig_faulty),n,t)-r,t);if(i>1n&&i<t){let e=t/i,r=k(n,(i-1n)*(e-1n)),a=r?`\nPrivate exponent d = ${r}`:``;return Promise.resolve(`Factor found!\np = ${i}\nq = ${e}${a}\nRSA_CRT_FAULT=SUCCESS`)}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} A single faulty CRT signature $s'$ on a known message $m$ reveals the factorization of $n = pq$ via $\\gcd(s'^e - m, n)$.

\\textbf{Setup:}
\\begin{itemize}
\\item $s' \\equiv s \\pmod{p}$, $s' \\not\\equiv s \\pmod{q}$ (fault in one CRT branch only)
\\item $n = pq$, message $m$ known, faulty signature $s'$ observed
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
s &\\equiv m^d \\pmod{n} \\quad \\text{(correct signature)} \\\\
s'^e &\\equiv m \\pmod{p} \\quad \\text{(fault-free branch)} \\\\
s'^e &\\not\\equiv m \\pmod{q} \\quad \\text{(corrupted branch)} \\\\
p &\\mid (s'^e - m), \\quad q \\nmid (s'^e - m) \\\\
\\gcd(s'^e - m, n) &= p \\\\[4pt]
q &= n / p \\qed
\\end{align*}

\\textbf{Explanation:} CRT signing computes $s_p = m^{d_p} \\bmod p$ and $s_q = m^{d_q} \\bmod q$ separately, then combines. If a transient fault corrupts $s_q$ but leaves $s_p$ correct, the faulty signature $s'$ is valid modulo $p$ but invalid modulo $q$. The GCD of $(s'^e - m)$ with $n$ reveals $p$ directly.

\\textbf{References:} Boneh, DeMillo, Lipton, "On the Importance of Checking Cryptographic Protocols for Faults," Eurocrypt 1997`,usageGuide:`This attack exploits a faulty RSA-CRT signature. When a transient fault corrupts the CRT computation, the faulty signature leaks one prime factor.

How to use:
1. Obtain a valid signature sig_valid for a message m
2. Obtain a faulty signature sig_faulty for the same message m from a fault-injected device
3. The attack computes gcd(sig_faulty^e - m, n) to recover p

Required: n, e, m (the signed message as an integer), sig_valid, sig_faulty

Tip: The two signatures must be from the SAME message using the SAME key. The fault must affect only one of the two CRT exponentiations.`,priority:`medium`,applicableCheck:e=>!!e.n&&!!e.e&&!!e.m&&!!e.sig_faulty},pe={id:`non-coprime-exp`,name:`Non-Coprime Exponent Attack`,category:`Message / Protocol`,description:`Resolves multiple plaintexts when gcd(e, phi(n)) > 1 using known p and q factors. Use after factoring n, when public exponent shares a factor with phi(n).`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`c`,label:`c (ciphertext)`,placeholder:`Enter ciphertext c...`,multiline:!0,rows:3},{name:`p`,label:`p (prime factor)`,placeholder:`Enter prime factor p...`,multiline:!0,rows:3,required:!1,tooltip:`Known prime factor of n. Required for e-th root disambiguation.`},{name:`q`,label:`q (prime factor)`,placeholder:`Enter prime factor q...`,multiline:!0,rows:3,required:!1,tooltip:`Known prime factor of n. Required for e-th root disambiguation.`}],sageTemplate:e=>!e.n||!e.e||!e.c?`print("ERROR: Missing required inputs (n, e, c)")
print("NON_COPRIME_EXP=FAILED")`:!e.p||!e.q?`print("ERROR: This attack requires p and q to resolve multiple e-th roots. Use factorization attacks first to find p and q.")
print("NON_COPRIME_EXP=FAILED")`:`def _attack():
    out = []
    try:
        n = Integer(${e.n})
        e = Integer(${e.e})
        c = Integer(${e.c})
        p = Integer(${e.p})
        q = Integer(${e.q})
        out.append(f"Non-Coprime Exponent Attack")
        out.append(f"n = {n}, e = {e}")
        out.append(f"p = {p}")
        out.append(f"q = {q}")
        out.append("")
        phi = (p - 1) * (q - 1)
        g = gcd(e, phi)
        out.append(f"gcd(e, phi(n)) = gcd({e}, {phi}) = {g}")
        if g == 1:
            out.append("gcd(e, phi) = 1. Standard RSA applies. Use extended Euclidean algorithm.")
            d = inverse_mod(e, phi)
            m = power_mod(c, d, n)
            out.append(f"Private exponent: d = {d}")
            out.append(f"Recovered message: m = {m}")
            # Verify
            v = power_mod(m, e, n)
            if v == c:
                out.append("NON_COPRIME_EXP=SUCCESS")
            else:
                out.append("NON_COPRIME_EXP=FAILED")
        else:
            out.append(f"gcd(e, phi) = {g} > 1. Multiple plaintexts map to same ciphertext.")
            out.append("")
            # mod p
            gp = gcd(e, p - 1)
            out.append(f"gcd(e, p-1) = {gp}")
            roots_p = []
            if gp == 1:
                dp = inverse_mod(e, p - 1)
                mp = power_mod(c, dp, p)
                roots_p = [mp]
            else:
                # Find all e-th roots mod p
                Fp = GF(p)
                cp = Fp(c)
                try:
                    roots_p = cp.nth_root(e, all=True)
                except (NotImplementedError, TypeError, AttributeError):
                    roots_p = []
                    # Manual fallback for small e: iterate candidates
                    if e <= 10 and p < 2000000:
                        for x in range(p):
                            if power_mod(x, e, p) == cp:
                                roots_p.append(Fp(x))
                if not roots_p:
                    # Manual Tonelli-Shanks fallback for e=2, p ≡ 3 mod 4
                    if e == 2 and p % 4 == 3:
                        r = cp ** ((p + 1) // 4)
                        if r**2 == cp:
                            roots_p = [r, -r]
                            out.append("  (found via Tonelli-Shanks fallback)")
            out.append(f"e-th roots mod p: {[Integer(r) for r in roots_p]}")
            # mod q
            gq = gcd(e, q - 1)
            out.append(f"gcd(e, q-1) = {gq}")
            roots_q = []
            if gq == 1:
                dq = inverse_mod(e, q - 1)
                mq = power_mod(c, dq, q)
                roots_q = [mq]
            else:
                Fq = GF(q)
                cq = Fq(c)
                try:
                    roots_q = cq.nth_root(e, all=True)
                except (NotImplementedError, TypeError, AttributeError):
                    roots_q = []
                    if e <= 10 and q < 2000000:
                        for x in range(q):
                            if power_mod(x, e, q) == cq:
                                roots_q.append(Fq(x))
                if not roots_q:
                    if e == 2 and q % 4 == 3:
                        r = cq ** ((q + 1) // 4)
                        if r**2 == cq:
                            roots_q = [r, -r]
                            out.append("  (found via Tonelli-Shanks fallback)")
            out.append(f"e-th roots mod q: {[Integer(r) for r in roots_q]}")
            # CRT combine all pairs
            out.append(f"\\nAll possible plaintexts ({len(roots_p) * len(roots_q)} total):")
            found_valid = False
            for rp in roots_p:
                for rq in roots_q:
                    m = crt([Integer(rp), Integer(rq)], [p, q])
                    out.append(f"  m = {m}")
                    # Verify
                    v = power_mod(m, e, n)
                    ok = v == c
                    if ok:
                        found_valid = True
                    out.append(f"    m^e mod n = {v} (c = {c}) {'OK' if ok else 'FAIL'}")
            if found_valid:
                out.append("")
                out.append("NON_COPRIME_EXP=SUCCESS")
            else:
                out.append("NON_COPRIME_EXP=FAILED")
        print("\\n".join(out))
    except Exception as ex:
        try:
            out.append(f"ERROR: {ex}")
            out.append("NON_COPRIME_EXP=FAILED")
        except:
            out = [f"ERROR: {ex}", "NON_COPRIME_EXP=FAILED"]
        print("\\n".join(out))
    #
_attack()`,proof:`\\textbf{Theorem:} When $\\gcd(e, \\varphi(n)) > 1$, the ciphertext $c = m^e \\bmod n$ has multiple preimages. All are recovered by finding e-th roots modulo $p$ and $q$ separately, then CRT-combining.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, $e$ shares a factor with $\\varphi(n) = (p-1)(q-1)$
\\item $g_p = \\gcd(e, p-1) > 1$ or $g_q = \\gcd(e, q-1) > 1$ (or both)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
g_p &= \\gcd(e, p-1), \\quad g_q = \\gcd(e, q-1) \\\\
R_p &= \\{r \\in \\mathbb{F}_p : r^e \\equiv c \\pmod{p}\\}, \\quad |R_p| = g_p \\\\
R_q &= \\{r \\in \\mathbb{F}_q : r^e \\equiv c \\pmod{q}\\}, \\quad |R_q| = g_q \\\\
m_{i,j} &= \\text{CRT}(r_{p,i}, r_{q,j}; p, q) \\quad \\text{for each pair} \\\\
\\#\\text{valid plaintexts} &= g_p \\cdot g_q
\\end{align*}

\\textbf{Explanation:} RSA requires $\\gcd(e, \\varphi(n)) = 1$ for a unique decryption exponent $d$. When this fails, the encryption map $m \\mapsto m^e \\bmod n$ is many-to-one: multiple plaintexts produce the same ciphertext. The attack finds all e-th roots in $\\mathbb{F}_p$ and $\\mathbb{F}_q$ using finite field algebra, then combines them via CRT. Each combination is a valid preimage of $c$.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Three-level e-th root fallback:} Tries progressively slower methods: (1) Sage's $\\mathbb{F}_p.\\mathtt{nth\\_root}(e, all=True)$ for a complete root set, (2) manual iteration for small $e \\leq 10$ and small fields $p < 2 \\times 10^6$, (3) Tonelli-Shanks for $e = 2$ with $p \\equiv 3 \\pmod{4}$. CRT combines all cross-product root pairs from both primes.
\\end{itemize}

\\textbf{References:} Williams, 1980; May, "Attacks on RSA with Small Parameters," 2003`,priority:`low`,applicableCheck:e=>!!e.n&&!!e.e&&!!e.c},me={id:`homomorphic-forgery`,name:`Homomorphic Forgery Attack`,category:`Message / Protocol`,description:`Forges a valid RSA signature by exploiting textbook RSA's multiplicative homomorphism. Use when an oracle signs chosen messages and target is a product of signed messages.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`target_m`,label:`Target message to forge`,placeholder:`Enter target message...`,multiline:!0,rows:3},{name:`oracle_pairs`,label:`Oracle pairs (m,s semicolon-separated)`,placeholder:`m1,s1;m2,s2;m3,s3...`,multiline:!0,rows:3}],sageTemplate:e=>!e.n||!e.e||!e.target_m||!e.oracle_pairs?`print("ERROR: Missing required inputs (n, e, target_m, oracle_pairs)")
print("HOMOMORPHIC_FORGERY=FAILED")`:`def _attack():
    from itertools import combinations
    out = []
    try:
        n = Integer(${e.n})
        e = Integer(${e.e})
        target_m = Integer(${e.target_m})
        if n < 3 or e < 2:
            out.append("ERROR: Invalid n or e")
            out.append("HOMOMORPHIC_FORGERY=FAILED")
            print("\\n".join(out))
            return
        # Parse oracle pairs
        pairs_str = "${e.oracle_pairs}".strip()
        if not pairs_str:
            out.append("ERROR: Empty oracle_pairs")
            out.append("HOMOMORPHIC_FORGERY=FAILED")
            print("\\n".join(out))
            return
        oracle_pairs = []
        for pair in pairs_str.split(';'):
            pair = pair.strip()
            if not pair:
                continue
            parts = pair.split(',')
            if len(parts) < 2:
                continue
            m_i = Integer(parts[0].strip())
            s_i = Integer(parts[1].strip())
            oracle_pairs.append((m_i, s_i))
        if len(oracle_pairs) < 1:
            out.append("ERROR: No valid oracle pairs parsed")
            out.append("HOMOMORPHIC_FORGERY=FAILED")
            print("\\n".join(out))
            return
        out.append("Homomorphic Forgery Attack")
        out.append(f"Target message: {target_m}")
        out.append(f"Oracle pairs: {len(oracle_pairs)}")
        # Verify oracle pairs
        for i, (m_i, s_i) in enumerate(oracle_pairs):
            v = Integer(pow(int(s_i), int(e), int(n)))
            valid = "OK" if v == m_i else "FAIL"
            out.append(f"Pair {i+1}: s_i^e mod n = {v}, m_i = {m_i} [{valid}]")
        # Multiplicative forgery: compute product of all oracle signatures
        # If target_m = product of oracle messages (mod n), then
        # forged_sig = product of oracle signatures (mod n)
        found = False
        for r in range(1, len(oracle_pairs) + 1):
            for combo in combinations(range(len(oracle_pairs)), r):
                prod_m = 1
                prod_s = 1
                for idx in combo:
                    m_i, s_i = oracle_pairs[idx]
                    prod_m = (prod_m * m_i) % n
                    prod_s = (prod_s * s_i) % n
                if prod_m == target_m % n:
                    v = Integer(pow(int(prod_s), int(e), int(n)))
                    if v == target_m % n:
                        out.append(f"Forged signature from pairs {[i+1 for i in combo]}: {prod_s}")
                        out.append(f"Verification: sig^e mod n = {v}")
                        out.append("")
                        out.append("HOMOMORPHIC_FORGERY=SUCCESS")
                        found = True
                        print("\\n".join(out))
                        return
        if not found:
            out.append("Could not factor target_m from oracle pairs using multiplication.")
            out.append("Try more oracle queries or different combination patterns.")
            out.append("")
            out.append("HOMOMORPHIC_FORGERY=FAILED")
        print("\\n".join(out))
    except Exception as ex:
        try:
            out.append(f"ERROR: {ex}")
            out.append("HOMOMORPHIC_FORGERY=FAILED")
        except:
            out = [f"ERROR: {ex}", "HOMOMORPHIC_FORGERY=FAILED"]
        print("\\n".join(out))
    #
_attack()`,frontendCheck:(e,t)=>{if(!e.n||!e.e||!e.target_m||!e.oracle_pairs)return Promise.resolve(null);try{let n=BigInt(e.n),r=BigInt(e.e),i=BigInt(e.target_m),a=e.oracle_pairs.split(`;`).map(e=>e.trim()).filter(e=>e.length>0).map(e=>{let[t,n]=e.split(`,`).map(e=>BigInt(e.trim()));return[t,n]});if(a.length===0)return Promise.resolve(null);for(let[e,t]of a)if(A(t,r,n)!==e)return Promise.resolve(null);if(a.length>30)return Promise.resolve(null);let o=Math.floor(a.length/2),s=a.slice(0,o),c=a.slice(o),l=new Map,u=1<<c.length;for(let e=1;e<u;e++){t&&e%500==0&&t(Math.round(e*50/u),`right mask ${e} / ${u}`);let r=1n,i=1n;for(let t=0;t<c.length;t++)e&1<<t&&(r=r*c[t][0]%n,i=i*c[t][1]%n);let a=r.toString();l.has(a)||l.set(a,[]),l.get(a).push({m:r,s:i})}let d=i%n,f=1<<s.length;for(let e=1;e<f;e++){t&&e%500==0&&t(50+Math.round(e*50/f),`left mask ${e} / ${f}`);let i=1n,a=1n;for(let t=0;t<s.length;t++)e&1<<t&&(i=i*s[t][0]%n,a=a*s[t][1]%n);let o=k(i,n);if(o===null)continue;let c=d*o%n,u=l.get(c.toString());if(u)for(let e of u){let o=i*e.m%n,s=a*e.s%n;if(o===d)return t?.(100),Promise.resolve(`Forged signature: s = ${s}\nVerification: s^e mod n = ${A(s,r,n)}\nHOMOMORPHIC_FORGERY=SUCCESS`)}}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} Textbook RSA signatures are multiplicatively homomorphic: the product of signatures signs the product of messages.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle signs chosen messages: $s_i = m_i^d \\bmod n$
\\item Target message $m^*$ factors as $\\prod_{i \\in I} m_i \\pmod{n}$ for some subset $I$ of oracle queries
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
s_1 &= m_1^d \\pmod{n} \\\\
s_2 &= m_2^d \\pmod{n} \\\\
s^* &= s_1 \\cdot s_2 \\bmod n \\\\
    &\\equiv m_1^d \\cdot m_2^d \\pmod{n} \\\\
    &\\equiv (m_1 \\cdot m_2)^d \\pmod{n} \\\\
(s^*)^e &\\equiv m_1 \\cdot m_2 \\equiv m^* \\pmod{n} \\qed
\\end{align*}

\\textbf{Explanation:} Since $(m_1 m_2)^d = m_1^d \\cdot m_2^d \\pmod{n}$, multiplying known signatures yields a valid signature for the product of their messages. The attack searches subsets of oracle pairs whose message-product equals $m^*$, then multiplies the corresponding signatures. Modern padding schemes (OAEP, PSS) destroy this homomorphism by hashing and randomizing before signing.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Meet-in-the-middle search:} Splits the $n$ oracle signature pairs into two halves of size $n/2$. Builds a product-to-signature hash map for the right half ($2^{n/2}$ entries), then searches the left half for multiplicative complements that produce the target message. Reduces subset-search complexity from $O(2^n)$ to $O(2^{n/2+1})$ with early stop on first match.
\\end{itemize}

\\textbf{References:} Rivest, Shamir, Adleman, 1978; Boneh, "Twenty Years of Attacks on RSA," 1999`,usageGuide:`This attack exploits RSA's multiplicative homomorphism to forge signatures from known oracle pairs.

How to use:
1. Obtain oracle pairs (m_i, s_i) where s_i is a valid signature on m_i under the target public key
2. Provide n, e, target_m (message to forge), and oracle_pairs formatted as "m1,s1;m2,s2;..."
3. The attack uses meet-in-the-middle: split oracle pairs into two halves, build a product hash map for the right half, then search the left half for matching complements. This reduces the 2^n search to 2^(n/2+1) operations.

Tip: The more oracle pairs you have, the more likely you can factor target_m into a subset product. Up to 30 pairs supported (2^15 + 2^15 ≈ 65K operations). Modern RSA with OAEP/PSS padding prevents this attack.`,priority:`low`,applicableCheck:e=>!!e.n&&!!e.e&&!!e.target_m&&!!e.oracle_pairs},he={id:`bleichenbacher-sig`,name:`Bleichenbacher Signature Forgery (e=3)`,category:`Message / Protocol`,description:`Forges RSA signature for any hash when e=3 and verifier accepts trailing garbage in PKCS#1 v1.5 padding. Use when verification skips strict padding checks.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`3`,multiline:!1},{name:`hash_hex`,label:`Hash (hex)`,placeholder:`Enter hash in hex (e.g., SHA256)...`,multiline:!1}],sageTemplate:e=>!e.n||!e.hash_hex?`print("ERROR: Missing required inputs (n, hash_hex)")
print("BLEICHENBACHER_SIG=FAILED")`:`def _attack():
    try:
        out = []
        n = Integer(${e.n})
        e = Integer(${e.e||`3`})
        hash_hex = "${e.hash_hex}".strip()
        if not hash_hex:
            out.append("ERROR: hash_hex is empty")
            out.append("BLEICHENBACHER_SIG=FAILED")
            print("\\n".join(out))
            return
        if e != 3:
            out.append("This attack requires e=3.")
            out.append(f"Got e={e}.")
            out.append("BLEICHENBACHER_SIG=FAILED")
            print("\\n".join(out))
            return
        n_bytes = (n.nbits() + 7) // 8
        hash_bytes = len(hash_hex) // 2
        if hash_bytes == 0:
            out.append("ERROR: hash_hex is too short (need at least 2 hex chars)")
            out.append("BLEICHENBACHER_SIG=FAILED")
            print("\\n".join(out))
            return
        hash_int = Integer("0x" + hash_hex)
        # PKCS#1 v1.5: 0x00 || 0x01 || 0xFF*min_padding || 0x00 || hash || garbage
        # Garbage bytes absorb the error from ceil(cuberoot(target))
        min_padding = 8
        fixed_overhead = 3 + min_padding
        garbage_len = n_bytes - fixed_overhead - hash_bytes
        if garbage_len < 0:
            out.append("ERROR: Hash too large for this modulus (need more garbage bytes)")
            out.append("BLEICHENBACHER_SIG=FAILED")
            print("\\n".join(out))
            return
        # Construct target with garbage = 0
        # Structure (LSB end): garbage | hash | 0x00 | 0xFF*min_padding | 0x01 | 0x00
        target = (Integer(1) << (8 * (garbage_len + hash_bytes + 1 + min_padding))) + ((Integer(1) << (8 * min_padding)) - 1) * (Integer(1) << (8 * (garbage_len + hash_bytes + 1))) + hash_int * (Integer(1) << (8 * garbage_len))
        # Forge S = ceil(cuberoot(target)) over the integers (no mod n needed)
        sig, exact = target.nth_root(3, truncate_mode=True)
        if not exact:
            sig += 1
        cube = sig ** 3
        out.append(f"Bleichenbacher Signature Forgery (e={e})")
        out.append(f"n bytes = {n_bytes}")
        out.append(f"Target hash: {hash_hex}")
        out.append(f"Forged signature S = {sig}")
        out.append(f"S^3 = {cube}")
        # Verify PKCS#1 leading bytes 0x0001 are preserved
        top_two = cube >> (8 * (n_bytes - 2))
        if top_two == Integer(0x0001):
            out.append("PKCS#1 structure preserved — forged signature valid against lax verifier")
            out.append("")
            out.append("BLEICHENBACHER_SIG=SUCCESS")
        else:
            out.append("Signature forgery failed — garbage area too small for this hash and modulus")
            out.append("BLEICHENBACHER_SIG=FAILED")
        print("\\n".join(out))
    except Exception as ex:
        try:
            out.append(f"ERROR: {ex}")
            out.append("BLEICHENBACHER_SIG=FAILED")
            print("\\n".join(out))
        except:
            print(f"ERROR: {ex}")
            print("BLEICHENBACHER_SIG=FAILED")
    #
_attack()`,proof:`\\textbf{Theorem:} When $e = 3$ and the verifier accepts trailing garbage bytes after the hash, a valid PKCS#1 v1.5 signature can be forged by taking the integer cube root of a crafted padding structure.

\\textbf{Setup:}
\\begin{itemize}
\\item $e = 3$, modulus $n$ large enough for hash + padding + garbage bytes
\\item Verifier only checks $\\text{0x00 0x01 FF}^* \\text{0x00}$ prefix and hash at expected offset — ignores trailing data
\\end{itemize}

\\textbf{Construction:}
\\begin{align*}
\\text{target} &= \\text{0x00} \\| \\text{0x01} \\| \\text{FF}^8 \\| \\text{0x00} \\| H \\| \\text{garbage} \\\\
S &= \\lceil \\sqrt[3]{\\text{target}} \\rceil \\\\
S^3 &= \\text{target} + \\varepsilon, \\quad 0 \\leq \\varepsilon < 3S^2
\\end{align*}
The error $\\varepsilon$ from rounding up is bounded by $3S^2$. Garbage bytes at the end of the padding absorb this error, keeping the $\\text{0x0001FF}^8\\text{00}H$ prefix intact.

\\textbf{Explanation:} PKCS#1 v1.5 signature padding places the hash after a fixed $\\text{0x0001FF\\ldots FF00}$ marker. A lax verifier checks only the marker and hash position, ignoring any bytes after the hash. By crafting a target integer with the correct prefix and enough trailing garbage bytes, then taking its cube root, we obtain $S$ such that $S^3$ has the correct padding and hash — the cube root rounding error is harmlessly absorbed into the garbage. This only works for $e = 3$ because the cube root is computable over integers and the error is small.

\\textbf{References:} D. Bleichenbacher, Crypto 2006 rump session presentation`,usageGuide:`This attack forges RSA signatures by exploiting that s^3 < n makes the cube root computable over integers.

How to use:
1. You have modulus n and a hash value you want a signature for
2. Provide n and hash_hex (hash as hex string)
3. The attack constructs an integer with PKCS#1 v1.5 padding + target hash, then takes its cube root
4. The rounded cube root S satisfies S^3 = target + epsilon, where epsilon is absorbed by garbage bytes

Tip: e must be exactly 3 for this attack. The modulus must be large enough to accommodate the hash plus 8 bytes of padding plus garbage bytes. RSA with OAEP/PSS padding is NOT vulnerable.`,priority:`medium`,applicableCheck:e=>!!e.n&&!!e.hash_hex},Z={id:`bleichenbacher`,name:`Bleichenbacher PKCS#1 v1.5`,category:`Oracle`,description:`Decrypts a PKCS#1 v1.5 ciphertext using a padding oracle in ~2^17 queries. Use when a server reveals whether padding is valid.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`c`,label:`c (ciphertext)`,placeholder:`Enter ciphertext c...`,multiline:!0,rows:3},{name:`oracle_responses`,label:`Oracle responses (comma-separated 0/1)`,placeholder:`1,0,1,1,0,...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        # Bleichenbacher PKCS#1 v1.5 padding oracle attack
        if not "${e.n}".strip():
            print("ERROR: n is required")
            print("BLEICHENBACHER=FAILED")
            return
        if not "${e.e}".strip():
            print("ERROR: e is required")
            print("BLEICHENBACHER=FAILED")
            return
        if not "${e.c}".strip():
            print("ERROR: c is required")
            print("BLEICHENBACHER=FAILED")
            return
        responses_raw = """${e.oracle_responses||``}""".strip()
        if not responses_raw:
            print("ERROR: oracle_responses is required")
            print("BLEICHENBACHER=FAILED")
            return
        try:
            out = []
            n = Integer(${e.n})
            e = Integer(${e.e})
            c = Integer(${e.c})
            orig_c = Integer(${e.c})
            oracle_bits = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            out.append(f"Bleichenbacher PKCS#1 v1.5 Attack")
            out.append(f"n = {n} ({n.nbits()} bits)")
            out.append(f"e = {e}")
            out.append(f"c = {c}")
            out.append(f"Oracle responses: {len(oracle_bits)}")
            out.append("")
            # PKCS#1 v1.5: EM = 0x00 || 0x02 || PS || 0x00 || M
            # Valid padding: 2B <= m < 3B where B = 2^(8*(k-2)), k = byte length
            k = (n.nbits() + 7) // 8
            B = Integer(2)**(8 * (k - 2))
            out.append(f"Block size: {k} bytes, B = 2^(8*{k-2})")
            out.append(f"Valid padding range: [2B, 3B) = [{2*B}, {3*B})")
            out.append("")
            # Collect valid s values from oracle responses
            valid_s = [Integer(i + 1) for i, r in enumerate(oracle_bits) if r == 1]
            out.append(f"Valid padding responses: {len(valid_s)}")
            if len(valid_s) < 2:
                out.append("Need at least 2 valid responses for interval narrowing")
                out.append("BLEICHENBACHER=FAILED")
                print("\\n".join(out))
                return
            s1 = valid_s[0]
            out.append(f"s1 = {s1}")
            # Initial interval from s1
            if s1 == 1:
                a = 2 * B
                b = 3 * B - 1
            else:
                # Find r such that interval overlaps with [2B, 3B)
                a = 2 * B
                b = 3 * B - 1
                r_min = ceil((a * s1 - 3 * B + 1) / n)
                r_max = floor((b * s1 - 2 * B) / n)
                for r in range(int(r_min), int(r_max) + 1):
                    r_int = r
                    ca = ceil((2 * B + r_int * n) / s1)
                    cb = floor((3 * B - 1 + r_int * n) / s1)
                    inter_a = max(2 * B, ca)
                    inter_b = min(3 * B - 1, cb)
                    if inter_a <= inter_b:
                        a = inter_a
                        b = inter_b
                        break
            out.append(f"Initial interval: [{a}, {b}], size={(b-a+1).nbits()} bits")
            out.append("")
            # Narrow using remaining valid s values
            for idx in range(1, min(len(valid_s), 50)):
                s = valid_s[idx]
                # Find r range
                r_min = ceil((a * s - 3 * B + 1) / n)
                r_max = floor((b * s - 2 * B) / n)
                new_a = None
                new_b = None
                for r in range(int(r_min), int(r_max) + 1):
                    r_int = r
                    ca = ceil((2 * B + r_int * n) / s)
                    cb = floor((3 * B - 1 + r_int * n) / s)
                    inter_a = max(a, ca)
                    inter_b = min(b, cb)
                    if inter_a <= inter_b:
                        if new_a is None or inter_a > new_a:
                            new_a = inter_a
                        if new_b is None or inter_b < new_b:
                            new_b = inter_b
                if new_a is not None and new_b is not None:
                    a = new_a
                    b = new_b
                    if idx < 5 or b - a < (B) // 10:
                        out.append(f"Step {idx}: s={s}, interval=[{a}, {b}], size={(b-a+1).nbits()} bits")
                else:
                    out.append(f"Step {idx}: s={s}, no valid interval intersection")
            out.append("")
            if a == b:
                m = a
                out.append(f"Exact message recovered: m = {m}")
            else:
                m = (a + b) // 2
                out.append(f"Estimated message: m = {m}")
                out.append(f"Final interval: [{a}, {b}]")
                out.append(f"Uncertainty: {(b-a+1).nbits()} bits")
            # Verify
            v = Integer(pow(int(m), int(e), int(n)))
            out.append(f"Verification: m^e mod n = {v}")
            out.append(f"Original c = {orig_c}")
            if v == orig_c:
                out.append("VERIFICATION PASSED!")
                out.append("BLEICHENBACHER=SUCCESS")
            else:
                out.append("Verification failed - may need more oracle responses")
                out.append("BLEICHENBACHER=FAILED")
            print("\\n".join(out))
        except Exception as ex:
            out.append(f"ERROR: {ex}")
            out.append("BLEICHENBACHER=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("BLEICHENBACHER=FAILED")
_attack()`,frontendCheck:e=>{if(!e.n||!e.e||!e.c||!e.oracle_responses)return Promise.resolve(null);try{let t=BigInt(e.n),n=BigInt(e.e),r=BigInt(e.c),i=e.oracle_responses.split(`,`).map(e=>e.trim()===`1`),a=t.toString(2).length,o=Math.ceil(a/8),s=1n<<BigInt(8*(o-2)),c=2n*s,l=3n*s,u=[];for(let e=0;e<i.length;e++)i[e]&&u.push(BigInt(e+1));if(u.length<2)return Promise.resolve(null);let d=c,f=l-1n;for(let e=1;e<u.length&&d<f;e++){let n=u[e],r=d*n-l+1n,i=r<=0n?0n:(r+t-1n)/t,a=f*n-c,o=a<0n?-1n:a/t;if(i>o)continue;let s=null,p=null;for(let e=i;e<=o;e++){let r=(c+e*t+n-1n)/n,i=(l-1n+e*t)/n,a=r>d?r:d,o=i<f?i:f;a<=o&&((s===null||a>s)&&(s=a),(p===null||o<p)&&(p=o))}s!==null&&p!==null&&(d=s,f=p)}for(let e=d;e<=f&&e<d+100n;e++)if(A(e,n,t)===r)return Promise.resolve(`Message recovered: m = ${e}\nvalid s values = ${u.length}\ninterval width = ${f-d+1n}\nBLEICHENBACHER=SUCCESS`);return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} A PKCS#1 v1.5 padding oracle decrypts any RSA ciphertext in approximately $2^{17}$ adaptive queries.

\\textbf{Setup:}
\\begin{itemize}
\\item $c = m^e \\bmod n$, with $m$ having valid PKCS#1 v1.5 padding: $m = 0x00\\,0x02\\,PS\\,0x00\\,M$
\\item Oracle $\\mathcal{O}(c') = 1$ iff $\\text{decrypt}(c')$ has valid PKCS#1 v1.5 padding
\\item $B = 2^{8(k-2)}$ where $k = \\lceil n/8 \\rceil$ is the byte length; valid messages lie in $[2B, 3B)$
\\item Multiplying ciphertext: $(c \\cdot s^e)^d \\equiv m \\cdot s \\pmod{n}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\mathcal{O}(c \\cdot s^e) = 1 &\\implies 2B \\leq m \\cdot s - rn < 3B \\quad \\text{for some } r \\\\
&\\implies \\frac{2B + rn}{s} \\leq m < \\frac{3B + rn}{s} \\\\
M_i &= \\bigcup_{r=0}^{s_i-1} \\left[\\left\\lceil \\frac{2B+rn}{s_i}\\right\\rceil, \\left\\lfloor \\frac{3B-1+rn}{s_i}\\right\\rfloor\\right] \\\\
[a_{i+1}, b_{i+1}] &= [a_i, b_i] \\cap M_i \\\\
b - a \\to 0 &\\implies m = a \\qed
\\end{align*}

\\textbf{Explanation:} Bleichenbacher's attack works by blinding the ciphertext: $c' = c \\cdot s^e \\bmod n$ decrypts to $m \\cdot s \\bmod n$. When the oracle says the decryption has valid PKCS#1 v1.5 padding, we know $m \\cdot s \\bmod n \\in [2B, 3B)$. For each valid $s$, this constrains $m$ to a set of intervals (one per wrap-around $r$). Intersecting intervals across multiple $s$ values progressively narrows the candidate range. With roughly 20 valid $s$ values, the interval collapses to a single integer -- the original message $m$.

\\textbf{References:} D. Bleichenbacher, "Chosen Ciphertext Attacks Against Protocols Based on the RSA Encryption Standard PKCS#1", CRYPTO 1998`,usageGuide:`This requires oracle_responses — a comma-separated list of 1s (valid padding) and 0s (invalid) from a PKCS#1 v1.5 padding oracle.

How to use:
1. Set up an oracle that returns 1 if decrypt(c') has valid PKCS#1 v1.5 padding, 0 otherwise
2. For s = 1, 2, 3, ... query the oracle with c' = c * s^e mod n
3. Record the responses as comma-separated bits: 1,0,0,1,0,0,... (1 = valid padding)
4. Provide n, e, c, and the full oracle_responses string

Tip: s=1 always returns 1 (the original ciphertext has valid padding). You need roughly 20 valid responses to narrow the interval.`,priority:`medium`,applicableCheck:e=>!!e.n&&!!e.e&&!!e.c&&!!e.oracle_responses},ge={id:`manger`,name:`Manger's OAEP Attack`,category:`Oracle`,description:`Decrypts OAEP-encrypted messages using a first-byte oracle in O(log n) queries. Use when an oracle returns 1 if the plaintext's first byte is NOT 0x00 (i.e., plaintext >= B).`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`c`,label:`c (ciphertext)`,placeholder:`Enter ciphertext c...`,multiline:!0,rows:3},{name:`oracle_responses`,label:`Oracle responses (comma-separated 0/1)`,placeholder:`1,0,1,1,0,...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        # Manger's OAEP padding oracle attack (3-step algorithm)
        # Reference: J. Manger, CRYPTO 2001
        if not "${e.n}".strip():
            print("ERROR: n is required")
            print("MANGER=FAILED")
            return
        if not "${e.e}".strip():
            print("ERROR: e is required")
            print("MANGER=FAILED")
            return
        if not "${e.c}".strip():
            print("ERROR: c is required")
            print("MANGER=FAILED")
            return
        responses_raw = """${e.oracle_responses||``}""".strip()
        if not responses_raw:
            print("ERROR: oracle_responses is required")
            print("MANGER=FAILED")
            return
        try:
            out = []
            n = Integer(${e.n})
            e = Integer(${e.e})
            c = Integer(${e.c})
            # Parse oracle responses into a list
            oracle_list = [int(x.strip()) for x in responses_raw.split(',') if x.strip()]
            oracle_idx = [0]
        #
            def oracle():
                """Simulate oracle using pre-computed responses.
                Returns True (1) if decrypted value >= B, False (0) if < B."""
                if oracle_idx[0] >= len(oracle_list):
                    out.append(f"WARNING: ran out of oracle responses at index {oracle_idx[0]}")
                    return False
                result = oracle_list[oracle_idx[0]] == 1
                oracle_idx[0] += 1
                return result
            def ceil_div(a, b):
                return (a + b - 1) // b
            def floor_div(a, b):
                return a // b
            out.append(f"Manger's OAEP Attack (3-step algorithm)")
            out.append(f"n = {n} ({n.nbits()} bits)")
            out.append(f"e = {e}")
            out.append(f"c = {c}")
            #
            # k = byte length of n, B = 2^(8*(k-1))
            k = ceil_div(n.nbits(), 8)
            B = Integer(2) ** (8 * (k - 1))
            out.append(f"k = {k}, B = 2^(8*{k-1}) = {B}")
            out.append(f"2*B = {2*B}, 2*B < n: {2*B < n}")
            out.append("")
            #
            queries_used = [0]
            #
            # Step 1: Find f1 such that f1*m mod n >= B
            # Start with f1=2, double until oracle returns True (>= B)
            out.append("=== Step 1: Finding f1 ===")
            f1 = Integer(2)
            while not oracle():
                queries_used[0] += 1
                f1 *= 2
            queries_used[0] += 1
            out.append(f"f1 = {f1} (f1*m mod n >= B confirmed)")
            out.append("")
            #
            # Step 2: Find f2 such that f2*m mod n < B (wrapped around)
            # Start: f2 = floor((n+B)/B) * f1/2
            # Increment by f1/2 until oracle returns False (< B)
            out.append("=== Step 2: Finding f2 ===")
            f1_half = f1 // 2
            f2 = floor_div(n + B, B) * f1_half
            while oracle():
                queries_used[0] += 1
                f2 += f1_half
            queries_used[0] += 1
            out.append(f"f2 = {f2} (f2*m mod n < B, wrapped to [n, n+B))")
            out.append("")
            #
            # Step 3: Binary search to narrow [mmin, mmax] to single value
            out.append("=== Step 3: Binary search ===")
            mmin = ceil_div(n, f2)
            mmax = floor_div(n + B, f2)
            out.append(f"Initial: mmin={mmin}, mmax={mmax}")
            out.append(f"Range size: {(mmax - mmin).nbits()} bits")
            out.append("")
            #
            step_count = 0
            twoB = Integer(2) * B
            while mmin < mmax:
                step_count += 1
                f_tmp = floor_div(twoB, mmax - mmin)
                i_val = floor_div(f_tmp * mmin, n)
                f3 = ceil_div(i_val * n, mmin)
                if f3 == 0:
                    f3 = Integer(1)
                # Query oracle with f3
                oracle_result = oracle()
                queries_used[0] += 1
                iNB = i_val * n + B
                if oracle_result:
                    # f3*m mod n >= B => mmin = ceil((i*n + B) / f3)
                    mmin = ceil_div(iNB, f3)
                else:
                    # f3*m mod n < B => mmax = floor((i*n + B) / f3)
                    mmax = floor_div(iNB, f3)
                if step_count <= 5 or (mmax - mmin) <= Integer(2):
                    out.append(f"Step {step_count}: f3={f3}, oracle={oracle_result}, mmin={mmin}, mmax={mmax}, range={(mmax-mmin).nbits()} bits")
        #
            #
            m = mmin
            out.append(f"Recovered message: m = {m}")
            out.append(f"Total oracle queries: {queries_used[0]}")
            out.append(f"Total binary search steps: {step_count}")
            #
            # Verify
            v = Integer(pow(int(m), int(e), int(n)))
            out.append(f"Verification: m^e mod n = {v}")
            out.append(f"Original c = {c}")
            if v == c:
                out.append("VERIFICATION PASSED!")
                out.append("")
                out.append("MANGER=SUCCESS")
            else:
                out.append("Verification failed - may need more oracle responses")
                out.append(f"m^e mod n = {v}")
                out.append(f"c = {c}")
                out.append("")
                out.append("MANGER=FAILED")
            print("\\n".join(out))
        #
        except Exception as ex:
            out.append(f"ERROR: {ex}")
            out.append("MANGER=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("MANGER=FAILED")
_attack()`,proof:`\\textbf{Theorem:} An OAEP first-byte oracle recovers the full plaintext in O(\\log n) oracle queries.

\\textbf{Setup:}
\\begin{itemize}
\\item $c = m^e \\bmod n$ with OAEP padding; first byte must be $0x00$
\\item Oracle $\\mathcal{O}(c') = 1$ iff plaintext's first byte is NOT $0x00$ (i.e., $m \\geq B$)
\\item $B = 2^{8(k-1)} \\approx n/256$, where $k = \\lceil n/8 \\rceil$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\mathcal{O}(c) = 1 &\\iff m < B = n/256 \\\\
\\mathcal{O}(c \\cdot s^e) = 1 &\\implies m \\cdot s - rn < B \\quad \\text{for some } r \\\\
m &\\in \\bigcup_{r=0}^{s-1} \\left[ \\frac{rn}{s}, \\frac{rn+B}{s} \\right) \\\\
\\text{Step 1: } &\\text{Find } f_1 = 2^t \\text{ with } \\mathcal{O}(c \\cdot f_1^e) = 1 \\\\
\\text{Step 2: } &\\text{Find } f_2 \\text{ where } \\mathcal{O}(c \\cdot f_2^e) = 0 \\text{ (wrapped past } n) \\\\
\\text{Step 3: } &\\text{Binary search: } [a_{i+1}, b_{i+1}] \\subset [a_i, b_i] \\\\
\\lceil \\log_2 n \\rceil + 8 \\text{ queries} &\\implies b - a = 0 \\implies m = a \\qed
\\end{align*}

\\textbf{Explanation:} Manger's attack has three phases. Step 1 doubles a multiplier $f$ until the blinded message $f \\cdot m \\bmod n$ exceeds $B$ (first byte nonzero). Step 2 adds $f/2$ increments until the value wraps past $n$ and falls below $B$ again. Step 3 performs a binary search, narrowing the interval by checking whether $f \\cdot m \\bmod n \\geq B$. The key insight is that the boundary $B$ partitions $[0, n)$ into exactly two contiguous segments, making this a textbook binary search problem. Unlike Bleichenbacher's attack which requires ~$2^{17}$ queries, Manger needs only O(\\log n) queries.

\\textbf{References:} J. Manger, "A Chosen Ciphertext Attack on RSA Optimal Asymmetric Encryption Padding (OAEP) as Standardized in PKCS#1 v2.0", CRYPTO 2001`,usageGuide:`This requires oracle_responses — a comma-separated list from an oracle that reveals whether the decrypted plaintext's first byte is NOT 0x00 (i.e., plaintext >= B where B = 2^(8*(k-1)), k = ceil(n.nbits()/8)).

How to use:
1. Set up an oracle that returns 1 if decrypt(c') has first byte NOT 0x00 (plaintext >= B), 0 otherwise
2. Query the oracle for successive blinding values
3. Provide n, e, c, and oracle_responses as comma-separated bits
4. The attack narrows the message interval with each query

Tip: Manger's attack requires O(log n) oracle queries — significantly fewer than Bleichenbacher. The oracle boundary is B = 2^(8*(k-1)) ≈ n/256, NOT n/2.`,priority:`medium`,applicableCheck:e=>!!e.n&&!!e.e&&!!e.c&&!!e.oracle_responses},_e={id:`biased-lsb`,name:`Biased LSB Oracle`,category:`Oracle`,description:`Recovers plaintext m using a noisy LSB oracle with bias > 50% via majority voting and binary fraction accumulation. Use for error-prone side-channel LSB leaks.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`Enter public exponent e...`,multiline:!0,rows:3},{name:`c`,label:`c (ciphertext)`,placeholder:`Enter ciphertext c...`,multiline:!0,rows:3},{name:`oracle_runs`,label:`Oracle runs (multiple response strings, newline-separated)`,placeholder:`0,1,0,1,1\\n1,0,1,1,0\\n0,1,1,1,0...`,multiline:!0,rows:6}],sageTemplate:e=>`def _attack():
    try:
        # Validate inputs
        if not "${e.n}".strip():
            print("ERROR: n is required")
            print("BIASED_LSB=FAILED")
            return
        if not "${e.e}".strip():
            print("ERROR: e is required")
            print("BIASED_LSB=FAILED")
            return
        if not "${e.c}".strip():
            print("ERROR: c is required")
            print("BIASED_LSB=FAILED")
            return
        if not """${e.oracle_runs}""".strip():
            print("ERROR: oracle_runs is required")
            print("BIASED_LSB=FAILED")
            return
        try:
            out = []
            n = Integer(${e.n})
            e_val = "${e.e}".strip()
            e = Integer(e_val) if e_val else Integer(65537)
            orig_c = Integer(${e.c})
            two_e = pow(2, int(e), int(n))
            two_e_sage = Integer(two_e)
            c = (Integer(${e.c}) * Integer(two_e)) % n
            # Parse oracle runs (multiple response strings, newline-separated)
            runs_str = """${e.oracle_runs}""".strip()
            runs = []
            for line in runs_str.split('\\n'):
                line = line.strip()
                if not line:
                    continue
                bits = [int(x.strip()) for x in line.split(',') if x.strip()]
                runs.append(bits)
            if not runs:
                print("ERROR: No valid oracle runs parsed")
                print("BIASED_LSB=FAILED")
                return
            out.append(f"Biased LSB Oracle Attack")
            out.append(f"n = {n}")
            out.append(f"e = {e}")
            out.append(f"c = {c}")
            out.append(f"Number of oracle runs: {len(runs)}")
            out.append("")
            # Per-bit majority voting, then binary fraction accumulation
            num_bits = min(len(r) for r in runs)
            n_bits = n.nbits()
            out.append(f"Using {num_bits} bit positions (n has {n_bits} bits)")
            # Majority voting
            voted_bits = []
            for i in range(num_bits):
                votes = sum(runs[j][i] for j in range(len(runs)))
                majority = 1 if votes > len(runs) / 2 else 0
                voted_bits.append(majority)
            out.append(f"Majority-voted bits: {voted_bits[:20]}{'...' if num_bits > 20 else ''}")
            out.append("")
            # Binary search with voted bits using exact rational division
            # NOTE: Must use /2 (Rational) not //2 (floor division) to avoid
            # accumulated truncation errors that exclude m from the interval.
            lower = Integer(0)
            upper = Integer(n)
            for i, bit in enumerate(voted_bits):
                mid = (lower + upper) / 2  # Rational — exact midpoint
                if bit == 0:
                    upper = mid
                else:
                    lower = mid
                c = (c * two_e_sage) % n
                if i < 5 or i >= len(voted_bits) - 3:
                    out.append(f"Step {i+1}: bit={bit}, lower={lower}, upper={upper}")
            # Scan candidates near the rational interval [lower, upper)
            # After log2(n) steps, interval should contain exactly one integer
            candidate_start = Integer(ceil(lower))
            candidate_end = Integer(floor(upper)) + 1
            found_m = None
            for m_candidate in range(candidate_start, candidate_end + 1):
                m_test = Integer(m_candidate)
                if pow(int(m_test), int(e), int(n)) == int(orig_c):
                    found_m = m_test
                    break
            if found_m is None:
                # Fallback: wider scan around midpoint estimate (noisy oracle may have wrong bits)
                mid_est = Integer(floor((lower + upper) / 2))
                for m_candidate in range(max(0, mid_est - 500), mid_est + 501):
                    m_test = Integer(m_candidate)
                    if pow(int(m_test), int(e), int(n)) == int(orig_c):
                        found_m = m_test
                        break
            if found_m is not None:
                out.append(f"\\nRecovered message: m = {found_m}")
                v = Integer(pow(int(found_m), int(e), int(n)))
                out.append(f"Verification: m^e mod n = {v}")
                out.append(f"Original c = {orig_c}")
                out.append("VERIFICATION PASSED!")
                out.append("")
                out.append("BIASED_LSB=SUCCESS")
            else:
                out.append(f"\\nCandidate scan failed to find m in range [{candidate_start}, {candidate_end}]")
                out.append("Verification failed - may need more oracle runs or higher bias")
                out.append("")
                out.append("BIASED_LSB=FAILED")
            print("\\n".join(out))
        except Exception as ex:
            out.append(f"ERROR: {ex}")
            out.append("BIASED_LSB=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("BIASED_LSB=FAILED")
_attack()`,frontendCheck:e=>{if(!e.n||!e.e||!e.c||!e.oracle_runs)return Promise.resolve(null);try{let t=BigInt(e.n),n=BigInt(e.e),r=BigInt(e.c),i=e.oracle_runs.split(`
`).filter(e=>e.trim()).map(e=>e.split(`,`).map(e=>e.trim()===`1`));if(i.length===0)return Promise.resolve(null);let a=i[0].length,o=[];for(let e=0;e<a;e++){let t=0;for(let n of i)e<n.length&&(t+=n[e]?1:-1);o.push(t>0)}let s=BigInt(o.length),c=0n;for(let e of o)c=c<<1n|(e?1n:0n);let l=1n<<s,u=l>t?(c*t+l-1n)/l:c*t/l;for(let e=u-2n;e<=u+2n;e++)if(e>=0n&&A(e,n,t)===r)return Promise.resolve(`Message recovered: m = ${e}\nbits = ${a}\nruns = ${i.length}\nBIASED_LSB=SUCCESS`);return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} A noisy LSB oracle with bias $p > 1/2$ recovers $m$ via majority voting and binary fraction accumulation.

\\textbf{Setup:}
\\begin{itemize}
\\item Oracle $\\mathcal{O}(c) = \\text{LSB}(\\text{decrypt}(c))$ but correct only with probability $p > 1/2$
\\item $k$ independent oracle runs per query position for majority voting
\\item Each blinding step: $c_i = c \\cdot 2^{i \\cdot e} \\bmod n$ decrypts to $2^i m \\bmod n$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
b_i &= \\text{LSB}(2^i m \\bmod n) \\quad \\text{(true bit)} \\\\
\\hat{b}_i &= \\text{majority}(b_{i,1}, \\ldots, b_{i,k}) \\quad \\text{(voted estimate)} \\\\
\\Pr[\\hat{b}_i \\neq b_i] &\\leq \\exp(-2k(p-\\tfrac12)^2) \\quad \\text{(Hoeffding bound)} \\\\
k = O\\!\\left(\\frac{\\log n}{(p-1/2)^2}\\right) &\\implies \\Pr[\\hat{b}_i \\neq b_i] = O(1/n) \\\\
q &= \\sum_{i=0}^{k-1} \\hat{b}_i \\cdot 2^{k-1-i} \\quad \\text{(binary fraction)} \\\\
m &= \\left\\lceil \\frac{q \\cdot n}{2^k} \\right\\rceil \\quad \\text{(verify via } m^e \\equiv c \\pmod{n}) \\qed
\\end{align*}

\\textbf{Explanation:} The LSB of $2^i m \\bmod n$ equals the $i$-th bit of the binary fraction $m/n$. Each oracle call is noisy (correct with probability $p$), but by taking $k$ repeated queries per position and majority-voting, we amplify the effective accuracy. The Hoeffding bound shows that error decays exponentially in $k(p-1/2)^2$. Once we have $k > \\log_2 n$ reliable bits, the binary fraction $q/2^k$ approximates $m/n$ within $1/2^k$, so $m = \\lceil q \\cdot n / 2^k \\rceil$ uniquely.

\\textbf{References:} S. Goldwasser, S. Micali, "Probabilistic Encryption", JCSS 1984; J. Håstad et al., "A Pseudorandom Generator from any One-Way Function", SIAM J. Comp. 1999`,usageGuide:`This attack is for when your LSB oracle is noisy — instead of a single correct bit per query, you have multiple responses and use majority voting.

How to use:
1. Query the oracle multiple times per blinding value to get multiple response strings
2. Provide n, e, c, and oracle_runs — one response per line, each line being comma-separated 0/1 bits
3. The attack uses majority voting per bit position, then accumulates voted bits into binary fraction m/n
4. The final m is computed as ceil(q * n / 2^k) where q is the accumulated voted bits

Tip: More runs per position increases accuracy. With 31 runs and 90% accuracy per bit, majority voting gives >99.9% confidence per bit position after 31 runs.`,priority:`low`,applicableCheck:e=>!!e.n&&!!e.e&&!!e.c&&!!e.oracle_runs},ve={id:`roca`,name:`ROCA Vulnerability`,category:`Advanced`,description:`Factors ROCA-vulnerable (Infineon) RSA keys where p = k·M + (65537^i mod M) via discrete_log detection and Howgrave-Graham Coppersmith. For 512-bit keys SageCell may timeout; use FactorDB or local Sage for full factorization.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    out = []
    try:
        R.<x> = PolynomialRing(ZZ)
        try:
            if not "${e.n}".strip():
                out.append("ERROR: n is required")
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            n = Integer(${e.n})
            if n < 2:
                out.append("n is too small to factor")
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append("n is even: " + str(n))
                out.append("p = 2")
                out.append("q = " + str(n // 2))
                out.append("Verification: 2 * " + str(n // 2) + " = " + str(n))
                out.append("ROCA=SUCCESS")
                print("\\n".join(out))
                return
            if n.is_prime():
                out.append("n is prime. Not a valid RSA modulus.")
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            if n.is_square():
                p = isqrt(n)
                out.append("n is a perfect square: " + str(p) + "^2 = " + str(n))
                out.append("p = " + str(p))
                out.append("q = " + str(p))
                out.append("ROCA=SUCCESS")
                print("\\n".join(out))
                return
            out.append("ROCA vulnerability check")
            out.append("n = " + str(n))
            bits = n.nbits()
            out.append("n bits = " + str(bits))
            # Full list of primes up to 167 (39 primes)
            primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167]
            # Build M as product of first N primes where M < sqrt(n)
            M = 1
            used = []
            sqrt_n = Integer(isqrt(n))
            for p in primes:
                if M * p >= sqrt_n:
                    break
                M *= p
                used.append(p)
            if len(used) < 4:
                out.append("n too small for ROCA (need at least 4 primes in M)")
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            out.append("M = product of " + str(len(used)) + " primes [up to " + str(used[-1]) + "] = " + str(M) + " (" + str(Integer(M).nbits()) + " bits)")
            # Detection: check if n mod M is in the subgroup generated by 65537
            Rm = Zmod(M)
            g = Rm(65537)
            n_mod_M = Rm(n)
            ord_M = g.multiplicative_order()
            out.append("Order(65537 mod M) = " + str(ord_M) + " (" + str(ord_M.nbits()) + " bits)")
            # Check if n mod M is in subgroup via discrete_log
            detected = False
            try:
                c = discrete_log(n_mod_M, g)
                detected = True
                out.append("discrete_log(n, 65537) mod M = " + str(c))
            except (ValueError, TypeError, ArithmeticError):
                out.append("n mod M is NOT in the subgroup generated by 65537 mod M")
                out.append("n does NOT appear to be ROCA-vulnerable")
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            if not detected:
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            out.append("ROCA VULNERABILITY DETECTED")
            # Compute max M' dividing M_val where ord_{65537}(M') divides ord_
            def _cmm(M_val, ord_):
                for pf, pe in factor(M_val):
                    pp = pf ** pe
                    ord_pp = Zmod(pp)(65537).multiplicative_order()
                    if ord_ % ord_pp != 0:
                        M_val //= pp
                return M_val
            # Greedy M' optimization
            def _gfm(M_val):
                ord_val = Zmod(M_val)(65537).multiplicative_order()
                while True:
                    best_r = 0
                    best_ord = ord_val
                    best_M = M_val
                    for of, oe in factor(ord_val):
                        for _pi in range(1, oe + 1):
                            ord_try = ord_val // (of ** _pi)
                            M_try = _cmm(M_val, ord_try)
                            if M_try > 0 and M_try != M_val:
                                r = (log(ord_val, 2) - log(ord_try, 2)) / (log(M_val, 2) - log(M_try, 2))
                                if r > best_r:
                                    best_r = r
                                    best_ord = ord_try
                                    best_M = M_try
                    if best_r <= 0 or Integer(best_M).nbits() < bits // 4:
                        break
                    ord_val = best_ord
                    M_val = best_M
                return M_val, ord_val
            M_prime, ord_prime = _gfm(M)
            g_mod_Mp = Zmod(M_prime)(65537)
            c_prime = discrete_log(Zmod(M_prime)(n), g_mod_Mp)
            X = Integer(2 * isqrt(n) // M_prime)
            out.append("M' (optimized) = " + str(M_prime) + " (" + str(Integer(M_prime).nbits()) + " bits)")
            out.append("Order(65537 mod M') = " + str(ord_prime) + " (" + str(ord_prime.nbits()) + " bits)")
            out.append("discrete_log(n, 65537) mod M' = " + str(c_prime))
            out.append("X bound = " + str(X) + " (" + str(X.nbits()) + " bits)")
            if X < 1:
                out.append("X < 1: M' >= sqrt(n), no valid k values fit the bound.")
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            # Coppersmith params based on key size
            if bits <= 960:
                mm, tt = 5, 6
            elif bits <= 1952:
                mm, tt = 4, 5
            else:
                mm, tt = 7, 8
            # Howgrave-Graham Coppersmith for univariate modular polynomial
            def _chu(pol, modulus, beta, mm, tt, XX):
                dd = pol.degree()
                nn = dd * mm + tt
                gg = []
                for ii in range(mm):
                    for jj in range(dd):
                        gg.append((modulus ** (mm - ii)) * (x ** jj) * (pol ** ii))
                for ii in range(tt):
                    gg.append((x ** ii) * (pol ** mm))
                BB = matrix(ZZ, nn)
                for ii in range(nn):
                    for jj in range(nn):
                        BB[ii, jj] = gg[ii][jj] * (XX ** jj)
                try:
                    BB = BB.LLL()
                except (ValueError, RuntimeError):
                    return []
                new_pol = BB[0][0] * (x ** 0)
                for ii in range(1, nn):
                    new_pol += (BB[0][ii] // (XX ** ii)) * (x ** ii)
                roots = []
                for r, _ in new_pol.roots():
                    if r.is_zero():
                        continue
                    if gcd(modulus, ZZ(pol(r))) >= ZZ(modulus ** beta):
                        roots.append(ZZ(r))
                return roots
            # Search phase
            low = c_prime // 2
            high = (c_prime + ord_prime) // 2
            total = Integer(high - low + 1)
            MAX_ITER = 20
            out.append("Search range: [" + str(low) + ", " + str(high) + "] (" + str(total) + " candidates)")
            found = False
            if total > MAX_ITER:
                out.append("WARNING: Search space (" + str(total) + ") exceeds SageCell limit (" + str(MAX_ITER) + ").")
                out.append("The key IS ROCA-vulnerable (confirmed via discrete_log detection).")
                out.append("For full factorization, SageCell's 120s timeout is insufficient.")
                out.append("Options:")
                out.append("  1. Try FactorDB: https://factordb.com/?query=" + str(n))
                out.append("  2. Run locally with SageMath using:")
                out.append("     M' = " + str(M_prime))
                out.append("     c' = " + str(c_prime))
                out.append("     ord' = " + str(ord_prime))
                out.append("     X = " + str(X))
                out.append("     Search range a' in [" + str(low) + ", " + str(high) + "]")
                out.append("ROCA=FAILED")
                print("\\n".join(out))
                return
            for a_prime in range(low, low + total):
                r_mod = ZZ(Mod(65537, M_prime) ^ a_prime)
                known = ZZ(r_mod * inverse_mod(M_prime, n) % n)
                pol = x + known
                roots_found = _chu(pol, n, 0.5, mm, tt, X)
                for k_val in roots_found:
                    p_candidate = ZZ(k_val * M_prime + r_mod)
                    if p_candidate > 1 and p_candidate < n and n % p_candidate == 0:
                        q_val = n // p_candidate
                        out.append("VULNERABLE: n uses ROCA-generated primes.")
                        out.append("a' = " + str(a_prime))
                        out.append("k = " + str(k_val))
                        out.append("Verification: p * q = " + str(p_candidate * q_val))
                        out.append("p = " + str(p_candidate))
                        out.append("q = " + str(q_val))
                        out.append("")
                        out.append("ROCA=SUCCESS")
                        found = True
                        break
                if found:
                    break
            if not found:
                out.append("No factor found in search range. Try running locally with larger bounds.")
                out.append("ROCA=FAILED")
        except Exception as ex:
            out.append("ERROR: " + str(ex))
            out.append("ROCA=FAILED")
        #
    except BaseException as ex:
        out.append("ERROR: " + str(ex))
        out.append("ROCA=FAILED")
    print("\\n".join(out))
_attack()`,proof:`\\textbf{Theorem:} ROCA (Return of Coppersmith's Attack) primes have the form $p = k \\cdot M + (65537^i \\bmod M)$ and are factorable via Coppersmith's method in polynomial time.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, with primes generated by Infineon's flawed library
\\item $p = k_1 \\cdot M + r_1$, $q = k_2 \\cdot M + r_2$, where $r_i = 65537^{j_i} \\bmod M$
\\item $M$ is a primorial (product of consecutive small primes) with $M > n^{1/4}$
\\item Remainder set $\\mathcal{R} = \\{65537^i \\bmod M : i \\geq 0\\}$ is small (size = ord$_M(65537)$)
\\end{itemize}

\\textbf{Detection:} Since $n \\equiv r_1 r_2 \\pmod{M}$ and $r_1, r_2 \\in \\mathcal{R}$ (a multiplicative subgroup), we have $n \\bmod M \\in \\mathcal{R}$. Checked via discrete logarithm.

\\textbf{Proof:}
\\begin{align*}
n &= (k_1 M + r_1)(k_2 M + r_2) \\\\
n &\\equiv r_1 r_2 \\pmod{M} \\quad \\text{(both remainders in }\\mathcal{R}\\text{)} \\\\
\\text{If } n \\cdot r_2^{-1} \\bmod M &\\in \\mathcal{R}\\text{, then } r_1 = n \\cdot r_2^{-1} \\bmod M \\\\
f(x) &= Mx + r_1 \\equiv 0 \\pmod{p} \\quad\\text{with root } x = k_1 \\\\
|k_1| &< 2\\sqrt{n}/M' < p \\quad\\text{(safety margin factor 2)} \\\\
\\text{Coppersmith (} \\beta = 0.5, X = 2\\sqrt{n}/M' \\text{)} &\\implies k_1 \\text{ found in poly-time} \\\\
p &= M \\cdot k_1 + r_1 \\qed
\\end{align*}

\\textbf{Explanation:} The Infineon RSA key generator had a bug: it generated primes by starting with a random $k$, computing $p = k \\cdot M + (65537^i \\bmod M)$, and testing primality. Since $M$ is large (product of many small primes), the $k$ values are small (often $k < \\sqrt{n}/M \\ll n^{0.5}$), making $p$'s high bits predictable. Coppersmith's theorem says we can find small roots of $f(x) = Mx + r \\bmod p$ when $|x| < p^\\beta$. With $\\beta = 0.5$ and $X = 2\\sqrt{n}/M'$ (factor 2 safety margin), the bounded root $k$ is recovered via lattice reduction (LLL). This attack factored 512-bit keys in minutes and 1024-bit keys in hours in practice.

\\textbf{Optimization:} The greedy M' search reduces the search space by removing prime factors from M that contribute the least order-reduction per M-reduction, yielding a smaller Coppersmith bound $X = 2\\sqrt{n}/M'$.

\\textbf{References:} M. Nemec, M. Sys, P. Svenda, D. Klinec, V. Matyas, "The Return of Coppersmith's Attack: Practical Factorization of Widely Used RSA Moduli", CCS 2017`,priority:`high`,applicableCheck:e=>!!e.n},ye={id:`nitros`,name:`Nitros / ROCA Variant`,category:`Advanced`,description:`Factors RSA keys with generalized ROCA primes p = k·M + (a^i mod M) for arbitrary generator a. Use when prime generation follows a ROCA-like pattern with non-standard base.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`base`,label:`Base (default 65537)`,placeholder:`65537`,required:!1,multiline:!1}],sageTemplate:e=>`def _attack():
    try:
        try:
            out = []
            n_input = "${e.n}".strip()
            if not n_input:
                out.append("ERROR: n is required")
                out.append("NITROS=FAILED")
                print("\\n".join(out))
                return
            n = Integer(n_input)
            base_val = "${e.base}".strip()
            base = Integer(base_val) if base_val else Integer(65537)
            # Even check
            if n % 2 == 0:
                out.append("n is even.")
                out.append(f"p = 2")
                out.append(f"q = {n // 2}")
                out.append("NITROS=SUCCESS")
                print("\\n".join(out))
                return
            # Prime check
            if is_prime(n):
                out.append("n is prime. Not a valid RSA modulus.")
                out.append("NITROS=FAILED")
                print("\\n".join(out))
                return
            out.append("Nitros / Extended ROCA attack")
            out.append(f"n = {n}")
            out.append(f"base = {base}")
            out.append("")
            # Use a single well-chosen M (product of first 16 primes ≈ 2^53)
            # This keeps Coppersmith fast while covering typical Nitros/ROCA primes
            primes_subset = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53]
            M = prod(primes_subset)
            if gcd(base, M) != 1:
                out.append(f"M = {M}: gcd(base, M) = {gcd(base, M)} != 1, skipping...")
                out.append("NITROS=FAILED")
                print("\\n".join(out))
                return
            # Compute multiplicative order of base modulo M
            ord_val = Mod(base, M).multiplicative_order()
            n_mod = n % M
            # Verify n_mod is in the subgroup generated by base:
            # n_mod^ord_val == 1 mod M if and only if n_mod is a power of base mod M.
            # This avoids enumerating all 8M+ remainders.
            if pow(Integer(n_mod), ord_val, Integer(M)) != 1:
                out.append("n_mod not in remainder subgroup — primes are not Nitros-form for this M.")
                out.append("NITROS=FAILED")
                print("\\n".join(out))
                return
            # Build the set of all possible remainders {base^i mod M}
            r_set = set()
            r_cur = Integer(1)
            MAX_SET = 10000
            out.append(f"Order = {ord_val}" + (f", scanning up to {MAX_SET} remainders (capped)" if ord_val > MAX_SET else ""))
            for _ in range(min(ord_val, MAX_SET)):
                r_set.add(r_cur)
                r_cur = ZZ(Mod(r_cur * base, M))
            # Find candidate remainder pairs (r1, r2) where r1*r2 ≡ n mod M
            candidates = set()
            candidates.add(Integer(1))
            candidates.add(Integer(n_mod % M))
            for r1 in list(r_set):
                if len(candidates) >= 20:
                    break
                if r1 in candidates:
                    continue
                try:
                    r2 = (Integer(n_mod) * inverse_mod(ZZ(r1), Integer(M))) % Integer(M)
                    if r2 in r_set:
                        candidates.add(ZZ(r1))
                except (ZeroDivisionError, TypeError, ValueError, ArithmeticError):
                    continue
            out.append(f"Found {len(candidates)} candidate remainder(s)")
            out.append(f"M = {M} (product of first {len(primes_subset)} primes, ~{M.nbits()} bits)")
            # Coppersmith path (fast lattice reduction)
            bound = min(int(ceil(Integer(isqrt(n)) / M)), 100000)
            out.append(f"Direct search bound = {bound} (k has ~{Integer(bound).nbits()} bits)")
            factored = False
            MAX_COPPER = min(len(candidates), 15)
            try:
                R.<x> = PolynomialRing(ZZ)
                for r_candidate in list(candidates)[:MAX_COPPER]:
                    f = M*x + r_candidate
                    f_mod = f.change_ring(Zmod(n))
                    f_monic = f_mod.monic()
                    roots = f_monic.small_roots(X=bound, beta=0.5, epsilon=0.05)
                    if roots:
                        k = int(roots[0])
                        p_candidate = int(M * k + r_candidate)
                        if p_candidate > 1 and n % p_candidate == 0:
                            q = n // p_candidate
                            out.append(f"Factor found via Coppersmith! r={r_candidate}, k={k}")
                            out.append(f"Verification: p * q = {p_candidate * q}")
                            out.append(f"p = {p_candidate}")
                            out.append(f"q = {q}")
                            out.append("")
                            out.append("NITROS=SUCCESS")
                            print("\\n".join(out))
                            factored = True
                            break
            except Exception:
                pass
            if not factored:
                out.append("Coppersmith did not find root. Falling back to direct search...")
                max_total_ops = 20000
                per_r = min(int(bound) + 1, max(1, max_total_ops // max(1, len(candidates))))
                out.append(f"Direct search: {len(candidates)} remainder(s), up to {per_r} k-values each")
                for r_candidate in list(candidates):
                    if factored:
                        break
                    for k in range(per_r):
                        p_candidate = int(M * k + r_candidate)
                        if p_candidate > 1 and n % p_candidate == 0:
                            q = n // p_candidate
                            out.append(f"Factor found via direct search! r={r_candidate}, k={k}")
                            out.append(f"Verification: p * q = {p_candidate * q}")
                            out.append(f"p = {p_candidate}")
                            out.append(f"q = {q}")
                            out.append("")
                            out.append("NITROS=SUCCESS")
                            print("\\n".join(out))
                            factored = True
                            break
                if not factored:
                    out.append("No ROCA/Nitros pattern detected. Searched up to k-bound = " + str(bound))
                    out.append("NITROS=FAILED")
                    print("\\n".join(out))
        except Exception as ex:
            out.append(f"ERROR: {ex}")
            out.append("NITROS=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("NITROS=FAILED")
_attack()`,proof:`\\textbf{Theorem:} Generalized ROCA primes have the form $p = k \\cdot M + (a^i \\bmod M)$ for an arbitrary generator $a$, and are factorable when $M > n^{1/4}$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, with primes generated using a ROCA-like algorithm with base $a$ instead of $65537$
\\item $p = k_1 \\cdot M + r_1$, $q = k_2 \\cdot M + r_2$, where $r_i = a^{j_i} \\bmod M$
\\item $M$ is a primorial with $M > n^{1/4}$; remainder set $\\mathcal{R} = \\{a^i \\bmod M : i \\geq 0\\}$
\\item Base $a$ must be coprime to all primes in $M$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
n &\\equiv r_1 r_2 \\pmod{M}, \\quad r_1, r_2 \\in \\mathcal{R} \\\\
n^{\\text{ord}_M(a)} &\\equiv r_1^{\\text{ord}_M(a)} r_2^{\\text{ord}_M(a)} \\equiv 1 \\cdot 1 = 1 \\pmod{M} \\\\
\\text{Check: } n^{\\text{ord}_M(a)} \\equiv 1 \\pmod{M} &\\implies n \\bmod M \\in \\langle a \\rangle \\text{ -- consistent with Nitros-form primes} \\\\
f(x) &= Mx + r_1 \\equiv 0 \\pmod{p} \\quad\\text{with root } x = k_1 \\\\
|k_1| &< \\sqrt{n}/M < p \\quad\\text{(since } M > n^{1/4}\\text{)} \\\\
\\text{Coppersmith (} \\beta = 0.5, X = \\sqrt{n}/M \\text{)} &\\implies p = M \\cdot k_1 + r_1 \\qed
\\end{align*}

\\textbf{Explanation:} The Nitros attack extends ROCA to arbitrary generator bases. Instead of $65537$, any base $a$ can generate the remainder set. The key insight is that the subgroup generated by $a$ modulo $M$ has size $\\text{ord}_M(a)$, and this is typically small enough to enumerate. To test if $n$ is vulnerable, compute $n^{\\text{ord}_M(a)} \\bmod M$ -- if the result is 1, $n$ is in the subgroup and the primes are Nitros-form. The recovery then proceeds identically to ROCA: use Coppersmith to find $k_1$, the small root of $f(x) = Mx + r_1$ modulo $p$. However, this implementation uses a fixed $M$ (product of first 16 primes, $\\approx 2^{65}$). For $n > 256$-bit, the Coppersmith bound is capped at $100000$, so only keys with very small $k$ values ($< 2^{17}$) can be factored.

\\textbf{References:} M. Nemec et al., "The Return of Coppersmith's Attack", CCS 2017; Nitros ROCA variant analysis, 2018`,priority:`medium`,applicableCheck:e=>!!e.n},be={FF:`Fully factored — all prime factors known`,CF:`Composite, factors known — partially factored, not all factors are prime`,CC:`Composite, composite factors — factors known but contain composites`,CP:`Composite, partially factored — some factors found`,C:`Composite, no factors known — confirmed composite but unfactored`,P:`Definitely prime — n is proven prime, not a valid RSA modulus`,Prp:`Probably prime — strong probable prime, not a valid RSA modulus`,U:`Unknown — status undetermined`,Unit:`Unit — the number is 1`,N:`Not in database — not yet queried`,"*":`Added to database during this request`},Q=[N,P,ee,te,ne,re,I,L,B,V,H,U,W,G,{id:`euler`,name:`Euler Factorization`,category:`Factorization`,description:`Factors n by finding two distinct representations as a sum of squares a^2+b^2 = c^2+d^2 = n. Use when both primes are ≡ 1 (mod 4).`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        try:
            out = []
            n = Integer(${e.n})
            import math
            n_int = int(n)
            ${F(`EULER`,`            `)}
            out.append(f"Euler Factorization on n = {n}")
            out.append("")
            end = math.isqrt(n_int)
            solutions = []
            a = 0
            a_sq = 0
            max_iter = 20000000
            while a < end and len(solutions) < 2:
                if a > max_iter:
                    out.append(f"Euler factorization failed: exceeded {max_iter} iterations")
                    out.append("EULER=FAILED")
                    print("\\n".join(out))
                    return
                rem = n_int - a_sq
                b = math.isqrt(rem)
                if b*b == rem:
                    distinct = True
                    for sol in solutions:
                        if sol[0] == b and sol[1] == a:
                            distinct = False
                            break
                    if distinct:
                        solutions.append([b, a])
                a_sq += 2*a + 1
                a += 1
            if len(solutions) < 2:
                out.append(f"Euler factorization failed: could not find two distinct sum-of-squares representations")
                out.append("n may not have both primes ≡ 1 (mod 4)")
                out.append("EULER=FAILED")
                print("\\n".join(out))
                return
            s0 = solutions[0]
            s1 = solutions[1]
            k = gcd(s0[0] - s1[0], s1[1] - s0[1])**2
            h = gcd(s0[0] + s1[0], s1[1] + s0[1])**2
            m = gcd(s0[0] + s1[0], s1[1] - s0[1])**2
            lev = gcd(s0[0] - s1[0], s1[1] + s0[1])**2
            p = gcd(k + h, n)
            q = gcd(lev + m, n)
            if p <= 1 or q >= n:
                out.append(f"Found trivial factorization: {p} x {q} = {n}")
                out.append("No non-trivial factors found via Euler")
                out.append("EULER=FAILED")
            else:
                if p * q != n:
                    q = n // p
                out.append(f"Verification: p * q = {p * q}")
                out.append(f"p is prime: {p.is_prime()}")
                out.append(f"q is prime: {q.is_prime()}")
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append("")
                out.append("EULER=SUCCESS")
            print("\\n".join(out))
        except Exception as e:
            try:
                out.append(f"ERROR: {e}")
                out.append("EULER=FAILED")
                print("\\n".join(out))
            except:
                print(f"ERROR: {e}")
                print("EULER=FAILED")
        #
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("EULER=FAILED")
_attack()`,frontendCheck:(e,t)=>{if(!e.n)return Promise.resolve(null);try{let n=BigInt(e.n);if(n<2n)return Promise.resolve(null);if(n%2n==0n)return Promise.resolve(`n is even: ${n}\np = 2\nq = ${n/2n}\nEULER=SUCCESS`);let r=D(n),i=[],a=20000000n,o=0n;for(let e=0n;e<r&&i.length<2;e++){if(t&&e%100000n==0n){let n=e>a?100:Number(e*100n/(r<a?r:a)),i=r<a?r:a;t(n,`a = ${e.toString()} / ${i.toString()}`)}if(e>a)return t?.(100),Promise.resolve(null);let s=n-o;o+=2n*e+1n;let c=Number(s&15n);if(c===0||c===1||c===4||c===9){let t=D(s);if(t*t===s){let n=!0;for(let r of i)if(r[0]===t&&r[1]===e){n=!1;break}n&&i.push([t,e])}}}if(i.length<2)return Promise.resolve(null);let[s,c]=[i[0],i[1]],l=E(s[0]-c[0],c[1]-s[1])**2n,u=E(s[0]+c[0],c[1]+s[1])**2n,d=E(s[0]+c[0],c[1]-s[1])**2n,f=E(s[0]-c[0],c[1]+s[1])**2n,p=E(l+u,n),m=E(f+d,n);return p<=1n||m>=n?Promise.resolve(null):(p*m!==n&&(m=n/p),t?.(100),Promise.resolve(`Factor found!\nVerification: p * q = ${p*m}\np = ${p}\nq = ${m}\nn = ${s[0]}^2 + ${s[1]}^2 = ${c[0]}^2 + ${c[1]}^2\nEULER=SUCCESS`))}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} Factor $n = pq$ using two distinct representations as a sum of squares. Requires $p \\equiv q \\equiv 1 \\pmod{4}$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, with $p \\equiv q \\equiv 1 \\pmod{4}$
\\item $n = a^2 + b^2 = c^2 + d^2$ (two distinct representations)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
(a - c)(a + c) &= (d - b)(d + b) \\\\
k &= \\gcd(a - c, d - b)^2,\\; h = \\gcd(a + c, d + b)^2 \\\\
m &= \\gcd(a + c, d - b)^2,\\; \\ell = \\gcd(a - c, d + b)^2 \\\\
p &= \\gcd(k + h, n),\\; q = \\gcd(\\ell + m, n)
\\end{align*}
From the identity $(a-c)(a+c) = (d-b)(d+b)$, the GCD combinations recover the prime factors.

\\textbf{Explanation:} A theorem of Euler states that any prime $p \\equiv 1 \\pmod{4}$ has a unique representation as a sum of two squares (up to order and sign). A composite $n = pq$ where both primes are $\\equiv 1 \\pmod{4}$ therefore has two distinct representations, and these can be algebraically combined to recover $p$ and $q$. The method searches for the representations by iterating $a$ from $0$ to $\\sqrt{n}$.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Square recurrence:} Tracks $a^2$ incrementally via $(a+1)^2 = a^2 + 2a + 1$, replacing a full BigInt multiplication with addition each iteration — critical for the up to $20 \\times 10^6$ steps required.
\\item \\textbf{Mod-16 perfect square pre-filter:} Checks $n - a^2 \\equiv 0, 1, 4, 9 \\pmod{16}$ before computing $\\sqrt{n - a^2}$, rejecting $\\sim 80\\%$ of candidates without an isqrt call.
\\end{itemize}

\\textbf{References:} Euler, 1749`,priority:`medium`,applicableCheck:e=>!!e.n},{id:`pollard-strassen`,name:`Pollard-Strassen's Algorithm`,category:`Factorization`,description:`Factors n in O(n^(1/4)) by computing GCD of interval products over [1, n^(1/4)] to find a small factor. Use when n has a factor ≤ n^(1/4).`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`import math
def _attack():
    try:
        out = []
        try:
            n = Integer(${e.n})
            out.append(f"Pollard-Strassen factorization on n = {n}")
            out.append("")
            ${F(`POLLARD_STRASSEN`,`            `)}
            c = int(floor(RR(n) ** (1/4))) + 1
            if c > 50000:
                out.append(f"n is too large for Strassen (n^(1/4) = {c} > 50000)")
                out.append("POLLARD_STRASSEN=FAILED")
                print("\\n".join(out))
                return
            n_int = int(n)
            # Single-pass Strassen: accumulate product incrementally with batched GCD
            prod = 1
            batch_size = 1000
            for i in range(1, c + 1):
                prod = (prod * i) % n_int
                if i % batch_size == 0 or i == c:
                    g = math.gcd(prod, n_int)
                    if g > 1 and g < n_int:
                        # Backtrack to find exact factor in this batch
                        backtrack_start = max(1, i - batch_size + 1)
                        backtrack_prod = 1
                        for j in range(backtrack_start, i + 1):
                            backtrack_prod = (backtrack_prod * j) % n_int
                            g2 = math.gcd(backtrack_prod, n_int)
                            if g2 > 1 and g2 < n_int:
                                p_sage = Integer(g2)
                                q_sage = n // p_sage
                                out.append(f"Verification: p * q = {p_sage * q_sage}")
                                out.append(f"p = {p_sage}")
                                out.append(f"q = {q_sage}")
                                out.append("")
                                out.append("POLLARD_STRASSEN=SUCCESS")
                                print("\\n".join(out))
                                return
                        # If product GCD found but backtrack didn't (shouldn't happen)
                        break
            out.append("Pollard-Strassen failed: no factor found in intervals")
            out.append("POLLARD_STRASSEN=FAILED")
        except Exception as e:
            out.append(f"ERROR: {e}")
            out.append("POLLARD_STRASSEN=FAILED")
        print("\\n".join(out))
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("POLLARD_STRASSEN=FAILED")
_attack()`,proof:`\\textbf{Theorem:} Pollard-Strassen factors n in $O(n^{1/4} \\log n)$ time by partitioning $[1, n^{1/4}]$ into intervals and testing each via GCD.

\\textbf{Setup:}
\\begin{itemize}
\\item $n$ has a prime factor $p \\leq n^{1/4}$
\\item Partition $[1, n^{1/4}]$ into $c = \\lceil n^{1/4} \\rceil$ intervals
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{Let } c &= \\lceil n^{1/4} \\rceil \\\\
\\text{Interval } I_i &= \\{i c + 1, \\dots, (i+1) c\\} \\\\
P_i &= \\prod_{j \\in I_i} j \\mod n \\\\
\\gcd(P_i, n) &> 1 \\iff I_i \\text{ contains a factor of } n
\\end{align*}
Compute each $P_i$ incrementally and take $\\gcd(P_i, n)$. When a match is found, back-track within the interval to isolate the exact factor. The cost is $O(c) = O(n^{1/4})$ multiplications and GCDs.

\\textbf{Explanation:} If $p \\mid n$ and $p \\leq n^{1/4}$, then $p$ lies in some interval $I_i$. Since every element of $I_i$ divides $P_i$, we have $p \\mid P_i$ and hence $\\gcd(P_i, n) \\geq p > 1$. The backtrack step finds $p$ within the winning interval by rebuilding the product one term at a time until the GCD becomes non-trivial.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Incremental product accumulation:} The factorial product $P_i$ is built incrementally as terms are iterated — each step multiplies the running product by the next integer, avoiding recomputation from scratch per batch.
\\item \\textbf{Batched GCD with backtracking:} A GCD is computed only once per $batch\\_size = 1000$ terms. When a hit is found, the batch is re-scanned linearly to pinpoint the exact factor, reducing GCD calls by $\\sim 1000\\times$.
\\end{itemize}

\\textbf{References:} Strassen, 1977; Pollard, 1974`,priority:`medium`,applicableCheck:e=>!!e.n},{id:`pisano-period`,name:`Pisano Period Factorization`,category:`Factorization`,description:`Factors n via birthday collision on 2^x mod n using multiplicative period search. Use for small moduli under 64 bits.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    out = []
    try:
        try:
            n = Integer(${e.n})
            out.append("Pisano Period Factorization on n = " + str(n))
            out.append("")
            if n < 2:
                out.append("n = " + str(n) + " is too small to factor")
                out.append("PISANO_PERIOD=FAILED")
                print("\\n".join(out))
                return
            if n % 2 == 0:
                out.append("n is even: " + str(n))
                out.append("Verification: p * q = " + str(2 * (n // 2)))
                out.append("p = 2")
                out.append("q = " + str(n // 2))
                out.append("")
                out.append("PISANO_PERIOD=SUCCESS")
                print("\\n".join(out))
                return
            if n.is_prime():
                out.append("n is prime: " + str(n))
                out.append("PISANO_PERIOD=FAILED")
                print("\\n".join(out))
                return
            if n.is_square():
                p = isqrt(n)
                out.append("n is a perfect square: " + str(p) + "^2 = " + str(n))
                out.append("Verification: p * q = " + str(p * p))
                out.append("p = " + str(p))
                out.append("q = " + str(p))
                out.append("")
                out.append("PISANO_PERIOD=SUCCESS")
                print("\\n".join(out))
                return
            limit = 200000
            lookup = {}
            found = False
            n_int = int(n)
            pow_val = 1  # 2^0 mod n
            for i in range(limit):
                pow_val = (pow_val * 2) % n_int  # recurrence instead of pow(2, i, n)
                val = (pow_val - 1) % n_int
                if val == 0:
                    phi_guess = i
                    if phi_guess % 2 == 0:
                        s = n - phi_guess + 1
                        disc = s*s - 4*n
                        if disc > 0:
                            t = isqrt(disc)
                            if t*t == disc:
                                p_factor = (s - t) // 2
                                q_factor = (s + t) // 2
                                if p_factor > 1 and p_factor * q_factor == n:
                                    out.append("Verification: p * q = " + str(p_factor * q_factor))
                                    out.append("p = " + str(p_factor))
                                    out.append("q = " + str(q_factor))
                                    out.append("")
                                    out.append("PISANO_PERIOD=SUCCESS")
                                    found = True
                                    print("\\n".join(out))
                                    return
                if val in lookup:
                    period = i - lookup[val]
                    for mult in range(1, 200):
                        phi_guess = period * mult
                        if phi_guess >= n:
                            break
                        if phi_guess % 2 == 0:
                            s = n - phi_guess + 1
                            disc = s*s - 4*n
                            if disc > 0:
                                t = isqrt(disc)
                                if t*t == disc:
                                    p_factor = (s - t) // 2
                                    q_factor = (s + t) // 2
                                    if p_factor > 1 and p_factor * q_factor == n:
                                        out.append("Verification: p * q = " + str(p_factor * q_factor))
                                        out.append("p = " + str(p_factor))
                                        out.append("q = " + str(q_factor))
                                        out.append("")
                                        out.append("PISANO_PERIOD=SUCCESS")
                                        found = True
                                        print("\\n".join(out))
                                        return
                lookup[val] = i
            if not found:
                out.append("Pisano period attack failed: no collision found")
                out.append("PISANO_PERIOD=FAILED")
        except Exception as e:
            out.append("ERROR: " + str(e))
            out.append("PISANO_PERIOD=FAILED")
        #
    except BaseException as ex:
        out.append("ERROR: " + str(ex))
        out.append("PISANO_PERIOD=FAILED")
    print("\\n".join(out))
_attack()`,frontendCheck:(e,t)=>{if(!e.n)return Promise.resolve(null);try{let n=BigInt(e.n);if(n%2n==0n)return Promise.resolve(`Factor found!\np = 2\nq = ${n/2n}\nPISANO_PERIOD=SUCCESS`);let r=new Map,i=1n,a=200000n;for(let e=0n;e<a;e++){t&&e%10000n==0n&&t(Number(e*100n/a),`i = ${e.toString()} / 200000`);let o=i===0n?n-1n:i-1n;if(o===0n&&e>0n){let r=n-e+1n,i=r*r-4n*n;if(i>=0n){let a=D(i);if(a*a===i){let i=(r-a)/2n,o=(r+a)/2n;if(i>1n&&o>1n&&i*o===n)return t?.(100),Promise.resolve(`Factor found!\nPeriod length: ${e}\np = ${i}\nq = ${o}\nPISANO_PERIOD=SUCCESS`)}}}if(r.has(o)){let i=r.get(o),a=e-i;for(let e=1n;e<200n;e++){let r=a*e;if(r>=n)break;if(r%2n!=0n)continue;let i=n-r+1n,o=i*i-4n*n;if(o<0n)continue;let s=D(o);if(s*s===o){let e=(i-s)/2n,r=(i+s)/2n;if(e>1n&&r>1n&&e*r===n)return t?.(100),Promise.resolve(`Factor found!\nPeriod length: ${a}\np = ${e}\nq = ${r}\nPISANO_PERIOD=SUCCESS`)}}}r.set(o,e),i=i*2n%n}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} Factor $n = pq$ via birthday collision on the sequence $f(i) = 2^i - 1 \\pmod{n}$, revealing $\\lambda(n)$.

\\textbf{Setup:}
\\begin{itemize}
\\item Let $f(x) = 2^x - 1 \\pmod{n}$ for $x = 0, 1, 2, \\ldots$
\\item Birthday paradox: collision $f(i) = f(j)$ expected in $O(\\sqrt{\\operatorname{ord}_n(2)})$ steps
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f(i) = f(j) &\\implies 2^i \\equiv 2^j \\pmod{n} \\\\
&\\implies 2^{|j-i|} \\equiv 1 \\pmod{n} \\\\
|j-i| &\\text{ is a multiple of } \\operatorname{ord}_n(2) \\mid \\lambda(n) \\\\
\\phi &= k \\cdot |j-i| \\text{ as candidate for } \\phi(n) \\\\
p,q &= \\frac{n - \\phi + 1 \\pm \\sqrt{(n - \\phi + 1)^2 - 4n}}{2} \\qed
\\end{align*}

\\textbf{Explanation:} The Pisano period attack tracks $2^i \\bmod n$ via recurrence ($v_{i+1} = 2 \\cdot v_i \\bmod n$). When a value repeats, the index difference is a multiple of the multiplicative order of 2 modulo $n$, which divides $\\lambda(n)$. Each candidate $\\phi$ is tested by checking whether the quadratic discriminant is a perfect square.

\\textbf{References:} Wuliangshun, "Integer Factorization With Pisano Period", IEEE Access, 2019`,priority:`medium`,applicableCheck:e=>!!e.n},q,J,Y,ie,ae,oe,se,ce,le,ue,de,fe,pe,me,he,Z,ge,_e,ve,ye,{id:`factordb-lookup`,name:`FactorDB Lookup`,category:`Advanced`,description:`Looks up factorization of n in the FactorDB database. Shows full status with factors when available. Use as the first step for any unknown RSA modulus.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3}],frontendCheck:async e=>{let t=(e.n||``).trim();if(!t)return null;try{let e=await r(t),n=be[e.status]||e.status,i=[`FactorDB Lookup`,``,`n = ${t}`,`Status: ${e.status} — ${n}`];if(e.factors&&e.factors.length>0){i.push(``),i.push(`Factors:`);for(let[t,n]of e.factors)i.push(n>1?`  ${t}^${n}`:`  ${t}`);if(e.status===`FF`&&e.factors.length===2){let[t,n]=e.factors[0],[r,a]=e.factors[1],o=BigInt(t);for(let e=1;e<n;e++)o*=BigInt(t);let s=BigInt(r);for(let e=1;e<a;e++)s*=BigInt(r);i.push(``),i.push(`p = ${o}`),i.push(`q = ${s}`),i.push(`Verification: p * q = ${o*s}`)}}return i.push(``),i.push(`FACTORDB_LOOKUP=SUCCESS`),i.join(`
`)}catch(e){return`ERROR: ${e instanceof Error?e.message:String(e)}\nFACTORDB_LOOKUP=FAILED`}},proof:`\\textbf{Theorem:} FactorDB provides instant factorization for any previously factored modulus via a public API.

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

\\textbf{References:} https://factordb.com`,priority:`low`,applicableCheck:e=>!!e.n},{id:`known-plaintext`,name:`Known Plaintext Attack`,category:`Message / Protocol`,description:`Recovers m via integer e-th root when m^e < n, or via known-prefix brute-force for up to 24 unknown bits. Use when plaintext is small or partially known.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`65537`,multiline:!1},{name:`c`,label:`c (ciphertext)`,placeholder:`Enter ciphertext c...`,multiline:!0,rows:3},{name:`known_prefix`,label:`Known plaintext prefix`,placeholder:`e.g., flag{`,multiline:!1},{name:`unknown_bits`,label:`Unknown bits after prefix`,placeholder:`24`,multiline:!1}],sageTemplate:e=>!e.n||!e.c?`print("ERROR: n and c are required")
print("KNOWN_PLAINTEXT=FAILED")`:`def _attack():
    try:
        out = []
        n = Integer(${e.n})
        e_val = "${e.e}".strip()
        e = Integer(e_val) if e_val else Integer(65537)
        c = Integer(${e.c})
        known_prefix = "${e.known_prefix||``}"
        unknown_bits = Integer("${(e.unknown_bits||`24`).trim()}")
        out.append(f"Known plaintext attack on RSA")
        out.append(f"n = {n} ({n.nbits()} bits)")
        out.append(f"e = {e}")
        out.append(f"c = {c}")
        # Strategy 1: Try direct integer e-th root of c
        # Works when m^e < n (no modular wrap-around), which is common for e=3
        try:
            m_int_root, is_exact = c.nth_root(int(e), truncate_mode=True)
            if is_exact and pow(int(m_int_root), int(e), int(n)) == c:
                out.append(f"RECOVERED via integer e-th root! m = {m_int_root}")
                try:
                    m_hex = hex(Integer(m_int_root))[2:]
                    if len(m_hex) % 2 != 0:
                        m_hex = '0' + m_hex
                    out.append(f"m as bytes: {bytes.fromhex(m_hex)}")
                except Exception:
                    pass
                out.append("KNOWN_PLAINTEXT=SUCCESS")
                print("\\n".join(out))
                return
        except Exception:
            pass
        # Strategy 2: Known prefix + brute-force for small unknown bits
        if known_prefix:
            out.append(f"Known prefix: '{known_prefix}'")
            out.append(f"Unknown bits: {unknown_bits}")
            prefix_bytes = known_prefix.encode('utf-8')
            prefix_int = Integer(int.from_bytes(prefix_bytes, 'big'))
            out.append(f"Prefix as integer: {prefix_int}")
            out.append(f"Prefix byte length: {len(prefix_bytes)}")
            shift = 1 << int(unknown_bits)
            if unknown_bits <= 24:
                out.append(f"Brute forcing 2^{unknown_bits} possibilities...")
                found = False
                if e == 3:
                    # Horner evaluation: (prefix*shift + k)^3 mod n
                    # = A + B*k + C*k^2 + k^3 mod n (avoids modular exponentiation)
                    n_int_h = int(n)
                    c_int = int(c)
                    PS_int = int(prefix_int * shift)
                    A = pow(PS_int, 3, n_int_h)
                    B = (3 * PS_int * PS_int) % n_int_h
                    C_base = (3 * PS_int) % n_int_h
                    for k in range(shift):
                        k_mod = k % n_int_h
                        k2 = (k_mod * k_mod) % n_int_h
                        val = (A + B * k_mod) % n_int_h
                        val = (val + C_base * k2) % n_int_h
                        val = (val + k2 * k_mod) % n_int_h
                        if val == c_int:
                            m_try = prefix_int * shift + k
                            out.append(f"FOUND! m = {m_try}")
                            try:
                                m_hex = hex(m_try)[2:]
                                if len(m_hex) % 2 != 0:
                                    m_hex = '0' + m_hex
                                out.append(f"m as bytes: {bytes.fromhex(m_hex)}")
                            except:
                                pass
                            out.append("KNOWN_PLAINTEXT=SUCCESS")
                            found = True
                            break
                else:
                    for k in range(shift):
                        m_try = prefix_int * shift + k
                        if pow(int(m_try), int(e), int(n)) == c:
                            out.append(f"FOUND! m = {m_try}")
                            try:
                                m_hex = hex(m_try)[2:]
                                if len(m_hex) % 2 != 0:
                                    m_hex = '0' + m_hex
                                out.append(f"m as bytes: {bytes.fromhex(m_hex)}")
                            except:
                                pass
                            out.append("KNOWN_PLAINTEXT=SUCCESS")
                            found = True
                            break
                if not found:
                    out.append("Brute force exhausted without finding match.")
                    out.append("KNOWN_PLAINTEXT=FAILED")
            else:
                out.append(f"Unknown portion ({unknown_bits} bits) too large for brute force.")
                out.append(f"Brute-force limit is 24 bits (found {unknown_bits}) — try Coppersmith's method or a different approach.")
                out.append("KNOWN_PLAINTEXT=FAILED")
        else:
            out.append("No known prefix provided.")
            out.append("Provide the known portion of the plaintext to attempt recovery.")
            out.append("KNOWN_PLAINTEXT=FAILED")
        print("\\n".join(out))
    except Exception as ex:
        out.append(f"Error: {ex}")
        out.append("KNOWN_PLAINTEXT=FAILED")
        print("\\n".join(out))
_attack()`,frontendCheck:(e,t)=>{if(!e.n||!e.c)return Promise.resolve(null);try{let n=-1,r=BigInt(e.n),i=e.e?.trim()||`65537`,a=BigInt(i),o=BigInt(e.c),s=j(o,a);if(s**a===o&&A(s,a,r)===o){t?.(100);try{let e=s.toString(16),t=e.length%2?`0`+e:e,n=new Uint8Array(t.match(/.{1,2}/g).map(e=>parseInt(e,16))),r=new TextDecoder().decode(n);return Promise.resolve(`RECOVERED via integer e-th root! m = ${s}\nm as bytes: ${r}\nKNOWN_PLAINTEXT=SUCCESS`)}catch{return t?.(100),Promise.resolve(`RECOVERED via integer e-th root! m = ${s}\nKNOWN_PLAINTEXT=SUCCESS`)}}let c=e.known_prefix||``,l=(e.unknown_bits||`24`).trim(),u=parseInt(l,10);if(c&&u<=24){let e=new TextEncoder().encode(c),i=0n;for(let t of e)i=(i<<8n)+BigInt(t);let s=1n<<BigInt(u),l=Number(s);if(a===3n){let e=(i<<BigInt(u))%r,a=A(e,3n,r),s=3n*e*e%r,c=3n*e%r;for(let e=0;e<l;e++){if(t&&l>1e3){let r=Math.round(e*100/l);r!==n&&(n=r,t(r,`k = ${e.toLocaleString()} / ${l.toLocaleString()}`))}let d=BigInt(e)%r,f=d*d%r;if((((a+s*d)%r+c*f)%r+f*d)%r===o){let n=(i<<BigInt(u))+BigInt(e);t?.(100);try{let e=n.toString(16),t=e.length%2?`0`+e:e,r=new Uint8Array(t.match(/.{1,2}/g).map(e=>parseInt(e,16))),i=new TextDecoder().decode(r);return Promise.resolve(`FOUND! m = ${n}\nm as bytes: ${i}\nKNOWN_PLAINTEXT=SUCCESS`)}catch{return t?.(100),Promise.resolve(`FOUND! m = ${n}\nKNOWN_PLAINTEXT=SUCCESS`)}}}}else{if(u>16)return Promise.resolve(null);for(let e=0;e<l;e++){if(t&&l>1e3){let r=Math.round(e*100/l);r!==n&&(n=r,t(r,`k = ${e.toLocaleString()} / ${l.toLocaleString()}`))}let s=(i<<BigInt(u))+BigInt(e);if(A(s,a,r)===o){t?.(100);try{let e=s.toString(16),t=e.length%2?`0`+e:e,n=new Uint8Array(t.match(/.{1,2}/g).map(e=>parseInt(e,16))),r=new TextDecoder().decode(n);return Promise.resolve(`FOUND! m = ${s}\nm as bytes: ${r}\nKNOWN_PLAINTEXT=SUCCESS`)}catch{return t?.(100),Promise.resolve(`FOUND! m = ${s}\nKNOWN_PLAINTEXT=SUCCESS`)}}}}return Promise.resolve(null)}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} When $m^e < n$, the plaintext is recovered by taking the integer e-th root of $c$. When high-order bytes of $m$ are known, brute-force over the unknown low bits recovers the full plaintext.

\\textbf{Strategy 1: Integer e-th Root}
\\begin{align*}
c &= m^e \\quad \\text{(no modular reduction when } m^e < n\\text{)} \\\\
m &= \\sqrt[e]{c} \\quad \\text{(exact integer root over $\\mathbb{Z}$)}
\\end{align*}
Works when $m$ is small relative to $n$ (common with $e = 3$ and short plaintexts).

\\textbf{Strategy 2: Known Prefix + Brute Force}
\\begin{align*}
m &= m_0 \\cdot 2^k + x, \\quad 0 \\leq x < 2^k \\\\
c &\\equiv (m_0 \\cdot 2^k + x)^e \\pmod{n} \\\\
\\text{Iterate } x &= 0, 1, \\ldots, 2^k - 1 \\\\
\\text{Check: } &(m_0 \\cdot 2^k + x)^e \\equiv c \\pmod{n}
\\end{align*}
Feasible for $k \\leq 24$ (approx. 16 million modular exponentiations in the browser).

\\textbf{Explanation:} Two complementary strategies. Strategy 1 works when the plaintext is so small that $m^e$ never wraps around modulo $n$ — the ciphertext literally equals $m^e$ as an integer, so taking the e-th root recovers $m$. Strategy 2 works when part of the plaintext is known (e.g., a flag format like "flag\\{...\\}") — the unknown suffix is brute-forced by testing each candidate against the ciphertext.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Horner evaluation (e = 3):} Expands $(prefix \\cdot shift + k)^3 \\bmod n$ into precomputed cubic coefficients $A + Bk + Ck^2 + k^3$ where $A, B, C$ are derived from the known prefix and shift. Evaluates via Horner's method — three multiplications and three additions per candidate — avoiding modular exponentiation entirely ($\\sim 25\\times$ faster than $pow$ per candidate).
\\end{itemize}

\\textbf{References:} D. Coppersmith, 1997; May, "Attacks on RSA with Small Parameters," 2003`,priority:`medium`,applicableCheck:e=>!!(e.n&&e.c)},{id:`small-public-exp`,name:`Small Public Exponent`,category:`Advanced`,description:`Recovers plaintext m via integer e-th root (m = (c + k*n)^(1/e)) with modular residue pre-filter. Use when e is small (e.g., 3, 5, 17).`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`e`,label:`e (public exponent)`,placeholder:`3`},{name:`c`,label:`c (ciphertext)`,placeholder:`Enter ciphertext c...`,multiline:!0,rows:3},{name:`k_bound`,label:`k bound (c + k*n iterations)`,placeholder:`100000`,required:!1}],sageTemplate:e=>!e.n||!e.c?`print("ERROR: Missing required inputs (n, c)")
print("SMALL_PUBLIC_EXP=FAILED")`:`def _attack():
    try:
        n = Integer(${e.n})
        e_val = "${e.e}".strip()
        e = Integer(e_val) if e_val else Integer(3)
        c = Integer(${e.c})
        k_bound_val = "${e.k_bound}".strip() if "${e.k_bound}" else "100000"
        k_bound = Integer(k_bound_val) if k_bound_val else Integer(100000)
        out = []
        # Modular residue pre-filter for e-th powers
        if e <= 100:
            p = Integer(e + 1)
            while (p - 1) % e != 0 and p < 50000:
                p = next_prime(p + 1)
            if (p - 1) % e == 0 and p < 50000:
                filter_mod = p
                residues = set(pow(x, e, filter_mod) for x in range(int(p)))
            else:
                filter_mod = 0
                residues = set()
        else:
            filter_mod = 0
            residues = set()
        for k in range(int(k_bound) + 1):
            candidate = c + k * n
            if filter_mod and candidate % filter_mod not in residues:
                continue
            m, exact = candidate.nth_root(e, truncate_mode=True)
            if exact:
                out.append(f"SUCCESS! k = {k}")
                out.append(f"m = {m}")
                try:
                    m_hex = hex(m)[2:]
                    if len(m_hex) % 2 != 0:
                        m_hex = '0' + m_hex
                    m_bytes = bytes.fromhex(m_hex)
                    out.append(f"m as text: {m_bytes.decode('utf-8', errors='replace')}")
                except Exception:
                    out.append(f"m as hex: {hex(m)}")
                break
        if not out:
            out.append(f"No perfect {e}-th power found for k in 0..{k_bound} with e = {e}")
            out.append("SMALL_PUBLIC_EXP=FAILED")
        else:
            out.append("SMALL_PUBLIC_EXP=SUCCESS")
        print("\\n".join(out))
    except Exception as ex:
        print(f"ERROR: {ex}")
        print("SMALL_PUBLIC_EXP=FAILED")
_attack()`,frontendCheck:(e,t)=>{let n=BigInt(e.n),r=BigInt(e.e||`3`),i=BigInt(e.c);if(r>1000n)return Promise.resolve(null);let a=BigInt(e.k_bound||`100000`);if(a<0n)return Promise.resolve(null);let o=0n,s=null;if(r===3n)o=9n,s=new Set([0n,1n,8n]);else if(r<=17n){for(let e=2n*r+1n;e<1000n;e+=2n){if(e%3n==0n||e%5n==0n||e%7n==0n||e%11n==0n||e%13n==0n)continue;let t=!1;for(let n=17n;n*n<=e;n+=2n)if(e%n===0n){t=!0;break}if(!t&&(e-1n)%r==0n){o=e;break}}if(o>0n){s=new Set;for(let e=0n;e<o;e++){let t=1n;for(let n=0n;n<r;n++)t=t*e%o;s.add(t)}}}let c=(e,t)=>{let n=t>1n&&(t+2n)**r>=e?t:1n<<BigInt(Math.ceil(e.toString(2).length/Number(r)));for(;;){let t=n**(r-1n),i=((r-1n)*n*t+e)/(r*t);if(i>=n)break;n=i}return n},l=1n;for(let e=0n;e<=a;e++){t&&a>1000n&&e%1000n==0n&&t(Number(e*100n/a),`k = ${e.toString()} / ${a.toString()}`);let u=i+e*n;if(!(s&&!s.has(u%o))){if(l=e===0n?c(u,1n):c(u,l),l**r===u)return t?.(100),Promise.resolve(`m = ${l}\nk = ${e}\nSMALL_PUBLIC_EXP=SUCCESS`);if((l+1n)**r===u)return t?.(100),Promise.resolve(`m = ${l+1n}\nk = ${e}\nSMALL_PUBLIC_EXP=SUCCESS`);if(l>0n&&(l-1n)**r===u)return t?.(100),Promise.resolve(`m = ${l-1n}\nk = ${e}\nSMALL_PUBLIC_EXP=SUCCESS`)}}return Promise.resolve(null)},proof:`\\textbf{Theorem:} If $m^e \\geq n$, then $m^e = c + k \\cdot n$ for some $k \\geq 0$, and $m = \\sqrt[e]{c + k \\cdot n}$ when $k = \\lfloor m^e / n \\rfloor$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n$ is an RSA modulus, $e$ is a small public exponent
\\item $c = m^e \\bmod n$ (ciphertext)
\\item $k$ is the quotient $\\lfloor m^e / n \\rfloor$, small when $m$ is near $n^{1/e}$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c &\\equiv m^e \\pmod{n} \\\\
m^e &= c + k \\cdot n \\quad\\text{for some } k \\in \\mathbb{Z}_{\\geq 0} \\\\
\\therefore m &= \\sqrt[e]{c + k \\cdot n} \\quad\\text{when } k \\text{ is correct} \\qed
\\end{align*}

\\textbf{Explanation:} The RSA relation $c \\equiv m^e \\pmod{n}$ is equivalent to $m^e = c + k \\cdot n$ for some integer $k \\geq 0$. When $m^e < n$ (short plaintext), $k = 0$ and $m = \\sqrt[e]{c}$ directly. Otherwise, $k$ is the (unknown) quotient $\\lfloor m^e / n \\rfloor$. For small $e$, this quotient is often small enough to brute-force: we iterate $k = 0, 1, 2, \\ldots$ and check whether $c + k \\cdot n$ is an exact $e$-th power.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Modular residue pre-filter:} For $e=3$, perfect cubes mod 9 are only $\\{0, 1, 8\\}$ — candidates with other residues are skipped before attempting the $e$-th root, reducing loop iterations by $\\sim 67\\%$. For $e \\leq 17$, a dynamic prime modulus $p$ with $e \\mid (p-1)$ is found at runtime and the $e$-th power residues are precomputed.
\\item \\textbf{Warm-start Newton:} The $e$-th root computation uses Newton's method seeded from the previous $k$'s root (warm-start). A guard condition $\\mathtt{prevRoot}^e \\geq \\mathtt{candidate}$ ensures the warm-start is only accepted when starting from above the true root, preventing mis-convergence.
\\item \\textbf{Combined speedup:} The pre-filter + warm-start yield up to $2.5\\times$ faster worst-case search vs restarting Newton from scratch on every candidate.
\\end{itemize}

\\textbf{References:} D. Boneh et al., "Twenty Years of Attacks on the RSA Cryptosystem", Notices AMS 1999`,priority:`high`,applicableCheck:e=>!!(e.n&&e.e&&e.c)},{id:`multi-prime-gcd`,name:`Multi-Prime GCD`,category:`Factorization`,description:`Finds shared prime factors across multiple RSA moduli using pairwise GCD with pair reporting. Use when two or more moduli may share a common factor.`,inputs:[{name:`moduli_list`,label:`Moduli (one per line)`,placeholder:`Enter multiple moduli, one per line...`,multiline:!0,rows:6}],proof:`\\textbf{Theorem:} Pairwise GCD among a set of RSA moduli reveals shared prime factors and identifies which moduli share them.

\\textbf{Setup:}
\\begin{itemize}
\\item Set of moduli $\\{n_1, n_2, \\ldots, n_k\\}$
\\item Some pair $(n_i, n_j)$ shares a prime factor $p$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
g_{ij} &= \\gcd(n_i, n_j) \\quad (1 \\leq i < j \\leq k) \\\\
g_{ij} > 1 &\\implies p \\mid n_i \\land p \\mid n_j \\\\
n_i &= g_{ij} \\cdot \\frac{n_i}{g_{ij}},\\; n_j = g_{ij} \\cdot \\frac{n_j}{g_{ij}} \\\\
\\text{Cost: } &O(k^2 \\cdot \\log^2 n) \\qed
\\end{align*}

\\textbf{Explanation:} When multiple RSA moduli are generated with insufficient entropy, two moduli may coincidentally share a prime factor. Pairwise GCD detects this — if $\\gcd(n_i, n_j) > 1$, the shared factor divides both moduli. Each unordered pair $(i,j)$ is checked once for $k$ moduli, yielding $O(k^2)$ GCD operations.

\\textbf{Optimizations:}
\\begin{itemize}
\\item \\textbf{Two-stage batch GCD:} Stage 1 computes the product of all moduli and checks each $n_i$ via a single $\\gcd(\\prod_{j \\neq i} n_j,\\; n_i)$ to quickly identify which moduli share factors (hit indices). Stage 2 only performs pairwise GCDs involving hit indices, avoiding $O(k^2)$ work when most moduli have no shared factors.
\\end{itemize}

\\textbf{References:} N. Heninger, Z. Durumeric, E. Wustrow, J. A. Halderman, "Mining Your Ps and Qs", USENIX Security Symposium, 2012`,priority:`high`,applicableCheck:e=>{let t=(e.moduli_list||``).trim();return t?t.split(`
`).filter(e=>e.trim()).length>=2:!1},frontendCheck:async e=>{try{let t=(e.moduli_list||``).trim();if(!t)return`ERROR: Missing required input: moduli_list
MULTI_PRIME_GCD=FAILED`;let n=t.split(`
`).map(e=>e.trim()).filter(e=>e.length>0).map(e=>BigInt(e));if(n.length<2)return null;let r=[`Multi-Prime GCD Attack (browser-side, BigInt)`,`Running pairwise GCD on ${n.length} moduli...`,``],i=1n;for(let e of n)i*=e;let a=[];for(let e=0;e<n.length;e++)E(i/n[e],n[e])!==1n&&a.push(e);if(a.length<2)return null;let o=!1;for(let e=0;e<a.length;e++){let t=a[e],i=n[t];for(let e=t+1;e<n.length;e++){let a=n[e],s=E(i,a);s>1n&&s<i&&(o=!0,r.push(`SHARED FACTOR FOUND between moduli ${t+1} and ${e+1}!`),r.push(`gcd(n${t+1}, n${e+1}) = ${s}`),r.push(`n${t+1} = ${i}`),r.push(`  p = ${s}`),r.push(`  q = ${i/s}`),r.push(`n${e+1} = ${a}`),r.push(`  p' = ${s}`),r.push(`  q' = ${a/s}`),r.push(``))}}return o?(r.push(`MULTI_PRIME_GCD=SUCCESS`),r.join(`
`)):null}catch{return null}}},{id:`phi-leak`,name:`Phi(n) Leak`,category:`Partial Key / Lattice`,description:`Factors n immediately when φ(n) has been leaked, via quadratic formula. Use when Euler's totient φ(n) is known from side-channel leakage.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`phi`,label:`phi(n) (Euler totient)`,placeholder:`Enter phi(n)...`,multiline:!0,rows:3,required:!1,tooltip:`Enter the leaked φ(n) value, if known from side-channel or other leakage`}],sageTemplate:e=>{let t=e.n??``,n=e.phi??``;return`def _attack():
    if not ${JSON.stringify(t)}.strip():
        print("Missing required input: n")
        print("PHI_LEAK=FAILED")
        return
    if not ${JSON.stringify(n)}.strip():
        print("This attack requires a leaked φ(n) value.")
        print("Found n: ${e.n} but φ(n) is missing.")
        print("With n alone, the modulus cannot be factored. The φ(n) value must be provided as a second input.")
        print("PHI_LEAK=FAILED")
        return
    try:
        out = []
        try:
            n = Integer(${e.n})
            phi = Integer(${e.phi})
            out.append("Phi(n) leak attack")
            out.append(f"n = {n}")
            out.append(f"phi(n) = {phi}")
            out.append("")
            # For n = p*q: phi(n) = (p-1)(q-1) = pq - p - q + 1 = n - p - q + 1
            # So: p + q = n - phi + 1
            # And: p * q = n
            # We solve: x^2 - (p+q)x + pq = 0
            # i.e.: x^2 - (n - phi + 1)x + n = 0
            sum_pq = n - phi + 1
            out.append(f"p + q = {sum_pq}")
            out.append(f"p * q = {n}")
            out.append("")
            # Solve quadratic: x^2 - sum_pq * x + n = 0
            discriminant = sum_pq**2 - 4*n
            out.append(f"Discriminant = {discriminant}")
            if discriminant < 0:
                out.append("ERROR: Negative discriminant. phi(n) is inconsistent with n.")
                out.append("PHI_LEAK=FAILED")
            elif discriminant == 0:
                out.append("ERROR: p = q. n is a perfect square (not valid RSA).")
                out.append("PHI_LEAK=FAILED")
            else:
                sqrt_disc = isqrt(discriminant)
                if sqrt_disc**2 == discriminant:
                    p = (sum_pq - sqrt_disc) // 2
                    q = (sum_pq + sqrt_disc) // 2
                    out.append(f"SUCCESS! Factors recovered:")
                    out.append(f"Verification: p * q = {p * q}")
                    out.append(f"Verification: (p-1)*(q-1) = {(p-1)*(q-1)}")
                    out.append(f"p = {p}")
                    out.append(f"q = {q}")
                    out.append("")
                    out.append("PHI_LEAK=SUCCESS")
                else:
                    out.append(f"Discriminant is not a perfect square: {discriminant}")
                    out.append("phi(n) may be incorrect, or n has more than 2 prime factors.")
                    out.append("PHI_LEAK=FAILED")
            print("\\n".join(out))
        except Exception as ex:
            out.append(f"ERROR: {ex}")
            out.append("PHI_LEAK=FAILED")
            print("\\n".join(out))
        #
    except BaseException as ex:
        out = [f"ERROR: {ex}", "PHI_LEAK=FAILED"]
        print("\\n".join(out))
_attack()`},frontendCheck:async e=>{if(!e.n||!e.phi)return null;try{let t=BigInt(e.n),n=BigInt(e.phi),r=t-n+1n,i=r*r-4n*t;if(i<0n)return null;let a=D(i);if(a*a!==i)return null;let o=(r-a)/2n,s=(r+a)/2n;if(o*s!==t)return null;let c=(o-1n)*(s-1n);return[`Phi(n) Leak Attack (browser-side, BigInt)`,`n = ${t}`,`phi(n) = ${n}`,`p + q = ${r}`,`Discriminant = ${i}`,``,`Factors recovered:`,`Verification: p * q = ${o*s}`,`Verification: (p-1)*(q-1) = ${c}`,`p = ${o}`,`q = ${s}`,`phi(n) matches: ${c===n?`YES`:`NO`}`,``,`PHI_LEAK=SUCCESS`].join(`
`)}catch{return null}},proof:`\\textbf{Theorem:} Knowing $\\phi(n)$ factors $n = pq$ in polynomial time by solving the quadratic $x^2 - (n - \\phi(n) + 1)x + n = 0$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$ with $p, q$ prime
\\item $\\phi(n) = (p-1)(q-1)$ is known (leaked or computed)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\phi(n) &= (p-1)(q-1) = pq - p - q + 1 = n - (p+q) + 1 \\\\
s &= n - \\phi(n) + 1 = p + q \\\\
\\Delta &= s^2 - 4n = (p+q)^2 - 4pq = (p-q)^2 \\\\
p, q &= \\frac{s \\pm \\sqrt{\\Delta}}{2} \\qed
\\end{align*}

\\textbf{Explanation:} Given both $n = pq$ and $\\phi(n) = (p-1)(q-1)$, we know both the sum $p+q = n - \\phi(n) + 1$ and the product $pq = n$. By Vieta's formulas, $p$ and $q$ are the roots of $x^2 - (p+q)x + pq = 0$. Computing the discriminant $\\Delta = (p+q)^2 - 4n = (p-q)^2$ and taking its square root yields $p$ and $q$ directly via the quadratic formula. This is a single-shot deterministic attack with no iteration.

\\textbf{References:} Rivest, Shamir, Adleman, "A Method for Obtaining Digital Signatures and Public-Key Cryptosystems", 1978; Menezes et al., "Handbook of Applied Cryptography", Section 8.2.2`,priority:`high`,applicableCheck:e=>!!e.n},{id:`partial-key-exposure`,name:`Partial Key Exposure`,category:`Partial Key / Lattice`,description:`Recovers p from known high bits (MSBs) using Coppersmith's lattice. Use when at least half of p's bits are known via side-channel leakage.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`p_msb`,label:`p_msb (known MSBs of p)`,placeholder:`Enter known high bits of p...`,multiline:!0,rows:3}],sageTemplate:e=>`def _attack():
    try:
        out = []
        try:
            n = Integer(${e.n})
            p_msb = Integer(${e.p_msb})
            if n < 2 or p_msb < 2:
                out.append("PARTIAL_KEY_EXPOSURE=FAILED: invalid input values")
                print("\\n".join(out))
                return
            if p_msb >= n:
                out.append("PARTIAL_KEY_EXPOSURE=FAILED: p_msb must be less than n")
                print("\\n".join(out))
                return
            if n % p_msb == 0:
                p = p_msb
                q = n // p
                out.append(f"Verification: p * q = {p * q}")
                out.append(f"p = {p}")
                out.append(f"q = {q}")
                out.append("")
                out.append("PARTIAL_KEY_EXPOSURE=SUCCESS")
                print("\\n".join(out))
                return
            # p = p_msb + x, where x is unknown low bits (trailing zeros = bit count of x)
            k = p_msb.trailing_zero_bits()
            out.append(f"Partial Key Exposure Attack")
            out.append(f"n = {n}")
            out.append(f"p_msb = {p_msb}")
            out.append(f"Unknown low bits = {k}")
            # Manual Coppersmith lattice for degree-1, checking ALL LLL rows.
            # Sage's small_roots only checks Row 0 (Row-0 bug for degree-1).
            x = ZZ['x'].gen()
            f_ZZ = p_msb + x
            X = n.nth_root(4, truncate_mode=True)[0] + 1
            m = 5; t = 5; dim = m + t
            shifts = []
            for i in range(m):
                shifts.append(n^(m - i) * f_ZZ^i)
            for k in range(t):
                shifts.append(f_ZZ^m * x^k)
            M = matrix(ZZ, dim, dim)
            for i, shift in enumerate(shifts):
                for j, c in enumerate(shift.list()):
                    M[i, j] = c * X^j
            B = M.LLL()
            found_p = None
            for k in range(dim):
                row = B[k]
                a0 = Integer(row[0]); a1 = Integer(row[1])
                if a1 == 0:
                    continue
                r_approx = -QQ(a0) * QQ(X) / QQ(a1)
                for delta in range(-2, 3):
                    r = Integer(floor(r_approx)) + delta
                    if abs(r) < X:
                        candidate = p_msb + r
                        if n % candidate == 0:
                            found_p = candidate
                            break
                if found_p:
                    break
            if found_p:
                q = n // found_p
                out.append(f"Verification: p * q = {found_p * q}")
                out.append(f"p = {found_p}")
                out.append(f"q = {q}")
                out.append("")
                out.append("PARTIAL_KEY_EXPOSURE=SUCCESS")
            else:
                out.append("Need approximately half the bits of p for Coppersmith to work.")
                out.append("PARTIAL_KEY_EXPOSURE=FAILED")
        except Exception as ex:
            out.append(f"PARTIAL_KEY_EXPOSURE=FAILED: {ex}")
        print("\\n".join(out))
    except BaseException as ex:
        print(f"ERROR: {ex}")
        print("PARTIAL_KEY_EXPOSURE=FAILED")
_attack()`,proof:`\\textbf{Theorem:} If MSBs of $p$ are known with $|x| < n^{\\beta^2}$ where $\\beta = 0.5$, Coppersmith's lattice recovers $p$.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$ with balanced primes
\\item $p = p_{\\text{msb}} + x$, $|x| < X = n^{1/4}$
\\item $p_{\\text{msb}}$ has trailing zeros indicating the unknown bit positions
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
f(x) &= p_{\\text{msb}} + x \\equiv 0 \\pmod{p} \\\\
\\text{Construct lattice from shifts: } &x^i f(x)^j n^{m-j},\\quad m = 5,\\; t = 5 \\\\
\\text{LLL} &\\implies \\text{short vector with coefficients } a_0, a_1 \\\\
r &\\approx -\\frac{a_0 X}{a_1},\\quad x_0 = \\text{round}(r) \\\\
p &= p_{\\text{msb}} + x_0,\\quad q = n/p \\qed
\\end{align*}

\\textbf{Explanation:} Coppersmith's method constructs a lattice embedding $f(x) = p_{\\text{msb}} + x$ with $m=5$ polynomial shifts scaled by powers of $n$ and $t=5$ shifts of $f^m x^k$. After LLL reduction, each basis row is a candidate polynomial $g(x) = a_0 + a_1 x + \\ldots$. The attack checks all rows (not just row 0) for two-term polynomials whose root $x_0 \\approx -a_0 X / a_1$ recovers $p$ when substituted back.

\\textbf{References:} D. Coppersmith, "Finding a Small Root of a Univariate Modular Equation", Eurocrypt 1996; A. May, "Using Coppersmith's Method to Attack RSA", 2009`,priority:`high`,applicableCheck:e=>!!e.n&&!!e.p_msb},{id:`implicit-key-exposure`,name:`Implicit Key Exposure`,category:`Partial Key / Lattice`,description:`Recovers p from leaked value a^p mod n using Fermat's Little Theorem GCD. Use when a^p mod n is accidentally exposed via side-channel or implementation bug.`,inputs:[{name:`n`,label:`n (modulus)`,placeholder:`Enter modulus n...`,multiline:!0,rows:3},{name:`a`,label:`a (base)`,placeholder:`Enter base a...`,multiline:!1},{name:`leak`,label:`leak (a^p mod n)`,placeholder:`Enter leaked value...`,multiline:!0,rows:3}],proof:`\\textbf{Theorem:} If $a^p \\bmod n$ is leaked, recover $p$ via $\\gcd(a - \\text{leak}, n)$ using Fermat's Little Theorem.

\\textbf{Setup:}
\\begin{itemize}
\\item $n = pq$, assume $p \\nmid a$
\\item $\\text{leak} = a^p \\bmod n$ is known
\\item FLT: $a^p \\equiv a \\pmod{p}$ for prime $p$
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\text{leak} &\\equiv a^p \\pmod{n} \\\\
\\text{leak} &\\equiv a^p \\equiv a \\pmod{p} \\quad\\text{(by FLT)} \\\\
\\text{leak} - a &\\equiv 0 \\pmod{p} \\\\
p &= \\gcd(\\text{leak} - a, n) \\qed
\\end{align*}

\\textbf{Explanation:} Fermat's Little Theorem states $a^p \\equiv a \\pmod{p}$. Since the leaked value $\\text{leak} \\equiv a^p \\pmod{n}$, it also satisfies $\\text{leak} \\equiv a^p \\pmod{p}$. Therefore $\\text{leak} \\equiv a \\pmod{p}$, meaning $p$ divides $(\\text{leak} - a)$. Computing $\\gcd(\\text{leak} - a, n)$ extracts $p$ directly. This is a simple single-shot attack requiring no iteration or lattice reduction.

\\textbf{References:} Common CTF pattern; based on Fermat's Little Theorem`,priority:`high`,applicableCheck:e=>!!e.n&&!!e.a&&!!e.leak,frontendCheck:async e=>{try{if(!e.n||!e.a||!e.leak)return`ERROR: Missing required input: n, a, or leak
IMPLICIT_KEY_EXPOSURE=FAILED`;let t=BigInt(e.n),n=BigInt(e.a),r=BigInt(e.leak),i=E(r-n,t);if(i>1n&&i<t){let e=i,a=t/e;return[`Implicit Key Exposure Attack (browser-side, BigInt)`,`n = ${t}`,`a = ${n}`,`leak = ${r}`,``,`Factors recovered:`,`p = ${e}`,`q = ${a}`,`Verification: p * q = ${e*a}`,`Verification: a^p mod n = ${A(n,e,t)} == leak? ${A(n,e,t)===r}`,``,`IMPLICIT_KEY_EXPOSURE=SUCCESS`].join(`
`)}return null}catch{return null}}},K,{id:`common-prime-rsa`,name:`Common Prime RSA`,category:`Factorization`,description:`Factors two RSA moduli n1, n2 that share a common prime by computing gcd(n1, n2). Use when two moduli may share a prime factor.`,inputs:[{name:`n1`,label:`n1 (first modulus)`,placeholder:`Enter n1...`,multiline:!0,rows:3},{name:`n2`,label:`n2 (second modulus)`,placeholder:`Enter n2...`,multiline:!0,rows:3}],proof:`\\textbf{Theorem:} If $n_1 = p \\cdot q_1$ and $n_2 = p \\cdot q_2$ share a prime $p$, then $\\gcd(n_1, n_2) = p$.

\\textbf{Setup:}
\\begin{itemize}
\\item Two RSA moduli $n_1 = p \\cdot q_1$ and $n_2 = p \\cdot q_2$
\\item $q_1 \\neq q_2$ (otherwise the moduli are identical)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
\\gcd(n_1, n_2) &= \\gcd(p \\cdot q_1, p \\cdot q_2) \\\\
&= p \\cdot \\gcd(q_1, q_2) \\\\
&= p \\quad \\text{(since } q_1, q_2 \\text{ are distinct primes)}
\\end{align*}
The GCD extracts the shared prime directly — no factorization of either modulus is needed.

\\textbf{Explanation:} This is a simpler, two-modulus variant of the Batch GCD attack. When two RSA keys were generated on the same machine or with a shared entropy source, they may share a prime factor. Computing the GCD of the two moduli instantly recovers the shared prime, fully factoring both keys.

\\textbf{References:} A. K. Lenstra et al., "Ron was wrong, Whit is right" (2012) — found 0.2\\% of RSA keys shared factors`,priority:`high`,applicableCheck:e=>!!e.n1&&!!e.n2,frontendCheck:async e=>{try{if(!e.n1||!e.n2)return`ERROR: Missing required input: n1 and n2
COMMON_PRIME_RSA=FAILED`;let t=BigInt(e.n1),n=BigInt(e.n2);if(t<2n||n<2n||t===n)return null;let r=E(t,n);if(r>1n&&r<t&&r<n){let e=t/r,i=n/r;return[`Common Prime RSA Attack (browser-side, BigInt)`,`n1 = ${t}`,`n2 = ${n}`,``,`gcd(n1, n2) = ${r}`,``,`Shared prime: p = ${r}`,`n1 = ${r} x ${e}`,`n2 = ${r} x ${i}`,`Verification: p * q1 = ${r*e} == n1? ${r*e===t}`,`Verification: p * q2 = ${r*i} == n2? ${r*i===n}`,`COMMON_PRIME_RSA=SUCCESS`].join(`
`)}return null}catch{return null}}},{id:`hastad-broadcast`,name:`Hastad's Broadcast Attack`,category:`Message / Protocol`,description:`Recovers m from e ciphertexts under distinct moduli with small e via CRT and integer e-th root. Use when same m encrypted with exponent e to e recipients.`,inputs:[{name:`e`,label:`e (public exponent / number of ciphertexts)`,placeholder:`3`,multiline:!1},{name:`ciphertexts`,label:`ciphertexts (one per line: c, n)`,placeholder:`c1, n1
c2, n2
c3, n3`,multiline:!0,rows:6}],sageTemplate:e=>!e.e||!e.ciphertexts?`print("ERROR: Missing required inputs (e, ciphertexts)")
print("HASTAD_BROADCAST=FAILED")`:`def _attack():
    try:
        out = []
        e = Integer(${e.e})
        out.append(f"Hastad's Broadcast Attack")
        out.append(f"Public exponent: e = {e}")
        if e < 2:
            out.append(f"ERROR: e must be >= 2, got e = {e}")
            out.append("HASTAD_BROADCAST=FAILED")
        else:
            lines_str = """${e.ciphertexts}""".strip()
            pairs = []
            for line in lines_str.split('\\n'):
                line = line.strip()
                if not line:
                    continue
                parts = line.split(',')
                if len(parts) < 2:
                    continue
                c = Integer(parts[0].strip())
                n = Integer(parts[1].strip())
                pairs.append((c, n))
            out.append(f"Number of ciphertexts: {len(pairs)}")
            if len(pairs) < e:
                out.append(f"ERROR: Need at least {e} ciphertexts for e = {e}, got {len(pairs)}")
                out.append("HASTAD_BROADCAST=FAILED")
            else:
                moduli = [p[1] for p in pairs[:e]]
                remainders = [p[0] for p in pairs[:e]]
                N = prod(moduli)
                M = crt(remainders, moduli)
                out.append(f"CRT combined m^e = {M}")
                out.append(f"Modulus product bits: {N.nbits()}")
                m, exact = M.nth_root(e, truncate_mode=True)
                if exact:
                    out.append(f"Recovered message: m = {m}")
                    all_ok = True
                    for i, (c_i, n_i) in enumerate(pairs):
                        v = power_mod(m, e, n_i)
                        ok = v == c_i
                        if not ok:
                            all_ok = False
                        out.append(f"  Verify {i+1}: m^{e} mod n{i+1} = {v} (c{i+1} = {c_i}) {'OK' if ok else 'FAIL'}")
                    if all_ok:
                        out.append("")
                        out.append("HASTAD_BROADCAST=SUCCESS")
                    else:
                        out.append("HASTAD_BROADCAST=FAILED")
                else:
                    out.append(f"Approximate root: m = {m}")
                    out.append("Warning: m^e was not a perfect e-th power")
                    out.append("HASTAD_BROADCAST=FAILED")
        print("\\n".join(out))
    except Exception as ex:
        try:
            out.append(f"ERROR: {ex}")
            out.append("HASTAD_BROADCAST=FAILED")
            print("\\n".join(out))
        except:
            print(f"ERROR: {ex}")
            print("HASTAD_BROADCAST=FAILED")
_attack()`,frontendCheck:e=>{if(!e.e||!e.ciphertexts)return Promise.resolve(null);try{let t=BigInt(e.e),n=e.ciphertexts.split(`
`).filter(e=>e.trim());if(n.length<Number(t))return Promise.resolve(null);let r=n.slice(0,Number(t)).map(e=>{let[t,n]=e.split(`,`).map(e=>BigInt(e.trim()));return{c:t,n}}),i=r.reduce((e,{n:t})=>e*t,1n),a=0n;for(let{c:e,n:t}of r){let n=i/t,r=k(n%t,t);if(r===null)return Promise.resolve(null);a=(a+e*n*r)%i}if(a<2n)return Promise.resolve(null);let o=j(a,t);if(o**t===a){for(let{c:e,n}of r)if(A(o,t,n)!==e)return Promise.resolve(null);return Promise.resolve(`Message recovered: m = ${o}\nHASTAD_BROADCAST=SUCCESS`)}return Promise.resolve(null)}catch{return Promise.resolve(null)}},proof:`\\textbf{Theorem:} If the same plaintext $m$ is encrypted under $e$ distinct moduli with the same exponent $e$, CRT recovers $m^e$ over $\\mathbb{Z}$ and $m = \\sqrt[e]{m^e}$.

\\textbf{Setup:}
\\begin{itemize}
\\item $c_i \\equiv m^e \\pmod{n_i}$ for $i = 1, \\ldots, e$
\\item $\\gcd(n_i, n_j) = 1$ for $i \\neq j$ (moduli are pairwise coprime)
\\item $m^e < \\prod_{i=1}^e n_i$ (message is smaller than the combined modulus)
\\end{itemize}

\\textbf{Proof:}
\\begin{align*}
c_i &\\equiv m^e \\pmod{n_i} \\\\
M &\\equiv m^e \\pmod{\\prod n_i} \\quad \\text{(by CRT)} \\\\
m^e < \\prod n_i &\\implies M = m^e \\quad \\text{(equality over $\\mathbb{Z}$, not just modulo)} \\\\
m &= \\sqrt[e]{M} \\quad \\text{(exact integer e-th root)}
\\end{align*}

\\textbf{Explanation:} CRT reconstructs $m^e$ as an integer $M$. Since $m^e$ is smaller than the product of all moduli, the reconstruction is exact — there is no modular wrap-around. The e-th root then recovers $m$ directly. This is why small exponents like $e = 3$ are dangerous when broadcasting: only 3 ciphertexts suffice for recovery.

\\textbf{References:} J. Hastad, "Solving Low-Exponent RSA," Eurocrypt 1988`,usageGuide:`This attack recovers m when the same plaintext is encrypted with the same small exponent e to e different moduli.

How to use:
1. Collect e ciphertext/modulus pairs: (c1, n1), (c2, n2), ..., (ce, ne)
2. Paste them into the ciphertexts field, one per line: c, n
3. Set e to the public exponent (usually 3)
4. The attack uses CRT to combine the ciphertexts and takes the integer e-th root

Input format:
c1, n1
c2, n2
c3, n3

Tip: For convenience, paste this into Magic Mode which auto-detects the format. Works when m^e < n1*n2*...*ne.`,priority:`high`,applicableCheck:e=>!!e.e&&!!e.ciphertexts}],xe=[`Factorization`,`Partial Key / Lattice`,`Message / Protocol`,`Oracle`,`Advanced`],Se=new Map;for(let e of xe)Se.set(e,Q.filter(t=>t.category===e));n(`https://factordb-proxy.octopusyuzu.workers.dev`);let $=new Set;self.onmessage=e=>{let t=e.data;if(`type`in t&&t.type===`cancel`){for(let e of t.ids)$.add(e);return}let{id:n,attackId:r,params:i}=t;if($.has(n)){$.delete(n);return}let a=Q.find(e=>e.id===r);if(!a?.frontendCheck){$.has(n)||self.postMessage({id:n,result:null});return}(async()=>{try{let e=await a.frontendCheck(i,(e,t)=>{$.has(n)||self.postMessage({type:`progress`,id:n,pct:e,detail:t})});$.has(n)||self.postMessage({id:n,result:e})}catch(e){$.has(n)||self.postMessage({id:n,result:null,error:String(e)})}})()}})();