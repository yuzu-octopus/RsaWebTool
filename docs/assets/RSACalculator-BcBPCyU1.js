import{A as e,At as t,E as n,J as r,L as i,Mt as a,Q as o,R as s,S as c,Y as l,b as u,c as d,d as f,ht as p,j as m,jt as h,l as g,n as _,r as v,u as y}from"./index.js";import{t as b}from"./CalculatorHeader-OuQcZofk.js";import{t as x}from"./useCalculatorOutput-bT-g7myW.js";var S=t(),C=p((0,S.jsx)(`path`,{d:`m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25z`}),`AutoAwesome`),w=p((0,S.jsx)(`path`,{d:`M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m0 12H6V10h12z`}),`LockOpen`),T=a(h(),1);function E(e){let t=e.replace(/\s/g,``);if(!t)return null;try{let e=g(t);if(e===`hex`)return BigInt(`0x`+t.replace(/^0x/,``));if(e===`base64`){let e=atob(t),n=Array.from(e).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+n)}if(e===`ascii`){let e=Array.from(t).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+e)}return BigInt(t)}catch{return null}}function D(e){let t=e.toString(16);return t.length%2!=0&&(t=`0`+t),`0x`+t}function O(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);let n=``;for(let e=0;e<t.length;e+=2){let r=parseInt(t.slice(e,e+2),16);n+=r>=32&&r<=126?String.fromCharCode(r):`.`}return n}function k(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);for(let e=0;e<t.length;e+=2){let n=parseInt(t.slice(e,e+2),16);if(n<32||n>126)return!1}return!0}function A(){let[e,t]=(0,T.useState)(``),[n,a]=(0,T.useState)(``),[d,f]=(0,T.useState)(`65537`),p=x({category:`calculator-rsa`}),m=()=>{p.clear();let t=E(e),r=E(n),i=E(d)||65537n;if(t===null||r===null){p.dispatchError(`p and q must be valid numbers`);return}if(t<=1n||r<=1n){p.dispatchError(`p and q must be > 1`);return}if(i<=0n){p.dispatchError(`e must be positive`);return}let a=t*r,o=(t-1n)*(r-1n),s=y(i,o),c=`n  = ${a}\n`;c+=`phi = ${o}\n`,c+=s===null?`d  = undefined (e and phi not coprime)`:`d  = ${s}`,p.dispatch(c,`RSA Key Gen`)};return(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(s,{fullWidth:!0,label:`p (prime)`,value:e,onChange:e=>t(e.target.value),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsx)(s,{fullWidth:!0,label:`q (prime)`,value:n,onChange:e=>a(e.target.value),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsx)(s,{fullWidth:!0,label:`e (public exponent)`,value:d,onChange:e=>f(e.target.value),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsx)(r,{fullWidth:!0,variant:`contained`,onClick:m,disabled:!e.trim()||!n.trim(),sx:c,children:`Compute`}),p.result&&(0,S.jsx)(l,{sx:u,children:p.result}),p.error&&(0,S.jsx)(o,{sx:{color:i.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:p.error})]})}function j(){let[e,t]=(0,T.useState)(``),[n,a]=(0,T.useState)(``),[d,p]=(0,T.useState)(``),m=x({category:`calculator-rsa`}),h=()=>{m.clear();let t=E(e),r=E(n),i=E(d)||65537n;if(t===null||r===null){m.dispatchError(`m and n must be valid numbers (e defaults to 65537)`);return}if(r<=1n){m.dispatchError(`n must be > 1`);return}if(i<=0n){m.dispatchError(`e must be positive`);return}if(t>=r){m.dispatchError(`m must be < n`);return}let a=f(t,i,r),o=`c = ${a}\n`;o+=`c (hex) = ${D(a)}\n`,k(a)&&(o+=`c (ascii) = ${O(a)}`),m.dispatch(o,`RSA Encrypt`)};return(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(s,{fullWidth:!0,label:`m (message)`,value:e,onChange:e=>t(e.target.value),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsx)(s,{fullWidth:!0,label:`n (modulus)`,value:n,onChange:e=>a(e.target.value),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsx)(s,{fullWidth:!0,label:`e (public exponent)`,value:d,onChange:e=>p(e.target.value),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsx)(r,{fullWidth:!0,variant:`contained`,onClick:h,disabled:!e.trim()||!n.trim(),sx:c,children:`Encrypt`}),m.result&&(0,S.jsx)(l,{sx:u,children:m.result}),m.error&&(0,S.jsx)(o,{sx:{color:i.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:m.error})]})}function M(){let[e,t]=(0,T.useState)({c:``,n:``,d:``,p:``,q:``,e:``}),n=x({category:`calculator-rsa`}),a=()=>{n.clear();let t=E(e.c),r=E(e.n),i=E(e.p),a=E(e.q),o=E(e.e),s=E(e.d);if(t===null){n.dispatchError(`c must be a valid number`);return}if(r===null&&i!==null&&a!==null?r=i*a:a===null&&r!==null&&i!==null&&r%i===0n?a=r/i:i===null&&r!==null&&a!==null&&r%a===0n&&(i=r/a),r===null){n.dispatchError(`Provide n, or p+q (any 2 of p, q, n)`);return}if(r<=1n){n.dispatchError(`n must be > 1`);return}if(t>=r){n.dispatchError(`c must be < n`);return}let c=null;if(s!==null&&s>0n&&(c=f(t,s,r)),c===null&&i!==null&&a!==null&&o!==null&&o>0n){let e=y(o,(i-1n)*(a-1n));e!==null&&(c=f(t,e,r))}if(c===null){n.dispatchError(`Provide d, or at least 2 of (p, q, n) + e`);return}let l=`m = ${c}\n`;l+=`m (hex) = ${D(c)}\n`,k(c)&&(l+=`m (ascii) = ${O(c)}`),n.dispatch(l,`RSA Decrypt`)};return(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(s,{fullWidth:!0,label:`c (ciphertext)`,value:e.c,onChange:e=>t(t=>({...t,c:e.target.value})),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsx)(s,{fullWidth:!0,label:`n (modulus)`,value:e.n,onChange:e=>t(t=>({...t,n:e.target.value})),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsx)(s,{fullWidth:!0,label:`d (private exponent, optional)`,value:e.d,onChange:e=>t(t=>({...t,d:e.target.value})),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsxs)(l,{sx:{display:`flex`,gap:2,mb:2},children:[(0,S.jsx)(s,{fullWidth:!0,label:`p (optional)`,value:e.p,onChange:e=>t(t=>({...t,p:e.target.value})),variant:`outlined`,sx:_}),(0,S.jsx)(s,{fullWidth:!0,label:`q (optional)`,value:e.q,onChange:e=>t(t=>({...t,q:e.target.value})),variant:`outlined`,sx:_})]}),(0,S.jsx)(s,{fullWidth:!0,label:`e (optional)`,value:e.e,onChange:e=>t(t=>({...t,e:e.target.value})),variant:`outlined`,sx:{..._,mb:2}}),(0,S.jsx)(r,{fullWidth:!0,variant:`contained`,onClick:a,disabled:!e.c.trim()||!e.n.trim()&&(!e.p.trim()||!e.q.trim()),sx:c,children:`Decrypt`}),n.result&&(0,S.jsx)(l,{sx:u,children:n.result}),n.error&&(0,S.jsx)(o,{sx:{color:i.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:n.error})]})}var N=[{id:`explanation`,label:`Explanation`,icon:(0,S.jsx)(e,{fontSize:`small`})},{id:`key-gen`,label:`Key Gen`,icon:(0,S.jsx)(C,{fontSize:`small`})},{id:`encrypt`,label:`Encrypt`,icon:(0,S.jsx)(m,{fontSize:`small`})},{id:`decrypt`,label:`Decrypt`,icon:(0,S.jsx)(w,{fontSize:`small`})}],P=`\\textbf{RSA Key Generation:}

Choose two large primes $p$ and $q$, then compute:

$n = p \\cdot q$
$\\varphi(n) = (p-1)(q-1)$

Select public exponent $e$ where $\\gcd(e, \\varphi(n)) = 1$ (commonly $65537$).
The private exponent is:

$d \\equiv e^{-1} \\pmod{\\varphi(n)}$

Public key: $(e, n)$ \xA0 Private key: $(d, n)$.

\\textbf{Encryption:}

$c \\equiv m^e \\pmod{n}$

$m$ is the plaintext as an integer $0 < m < n$.

\\textbf{Decryption:}

$m \\equiv c^d \\pmod{n}$

This works because $e \\cdot d \\equiv 1 \\pmod{\\varphi(n)}$, so $m^{e \\cdot d} \\equiv m \\pmod{n}$ by Euler's theorem.

\\textbf{CRT Optimization:}

Chinese Remainder Theorem speeds up decryption ~4x. Precompute:

$d_p = d \\bmod (p-1)$
$d_q = d \\bmod (q-1)$
$q_{\\text{inv}} = q^{-1} \\pmod{p}$

Decrypt: $m_p = c^{d_p} \\bmod p$, $m_q = c^{d_q} \\bmod q$, then $m = m_q + q \\cdot ((q_{\\text{inv}} \\cdot (m_p - m_q)) \\bmod p)$.

\\textbf{PKCS\\#1 v1.5 Padding:}

$\\text{EM} = \\texttt{0x00} \\parallel \\texttt{0x02} \\parallel \\text{PS} \\parallel \\texttt{0x00} \\parallel M$

PS is $k-3-|M|$ random non-zero bytes. The leading $	exttt{0x00}$ ensures the padded message is less than $n$.

\\textbf{OAEP Padding:}

Optimal Asymmetric Encryption Padding uses a Feistel network with a hash function $G$ and $H$ (MGF1):

$\\text{EM} = \\text{mask\\_seed} \\parallel \\text{masked\\_DB}$

Provides semantic security: same plaintext produces different ciphertexts each time. Recommended over PKCS\\#1 v1.5.

\\textbf{Common CTF Attacks:}

\\begin{itemize}
\\item \\textbf{Small $e$:} When $e=3$ and $m^3 < n$, ciphertext decryption is simply $m = \\sqrt[3]{c}$ (integer cube root).
\\item \\textbf{Common Modulus:} Same $n$, different $e_1, e_2$. If $\\gcd(e_1, e_2) = 1$, find $a e_1 + b e_2 = 1$ via extended GCD, then $m = c_1^a \\cdot c_2^b \\bmod n$.
\\item \\textbf{Wiener's Attack:} When $d < \\frac{1}{3} n^{1/4}$, continued fractions on $e/n$ recover $d$ directly.
\\item \\textbf{Hastad's Broadcast:} Same $m$ encrypted to $k \\geq e$ recipients with the same $e$ — CRT recovers $m^e$, then take $e$th root.
\\item \\textbf{Coppersmith:} Partial knowledge of $p$ or small roots of $f(x) \\equiv 0 \\pmod{p}$ using LLL/Howgrave-Graham.
\\end{itemize}`;function F(){return(0,S.jsxs)(l,{children:[(0,S.jsx)(o,{variant:`h6`,sx:{color:i.cyan,mb:1},children:`RSA Reference`}),(0,S.jsx)(l,{sx:{maxHeight:`60vh`,overflow:`auto`,pr:1,"&::-webkit-scrollbar":{width:`8px`},"&::-webkit-scrollbar-thumb":{background:i.currentLine,borderRadius:`4px`}},children:(0,S.jsx)(v,{latex:P})})]})}function I(){let[e,t]=(0,T.useState)(`explanation`),{setOutputResult:r,setOutputError:i,setOutputSource:a}=d();return(0,S.jsxs)(b,{icon:n,title:`RSA Calculator`,subtitle:`RSA encryption, decryption, and key generation reference`,tabs:N,activeTab:e,onTabChange:(0,T.useCallback)(e=>{t(e),r(null),i(null),a(null)},[r,i,a]),children:[e===`explanation`&&(0,S.jsx)(F,{}),e===`key-gen`&&(0,S.jsx)(A,{}),e===`encrypt`&&(0,S.jsx)(j,{}),e===`decrypt`&&(0,S.jsx)(M,{})]})}export{I as default};