import{A as e,At as t,F as n,I as r,K as i,Ot as a,S as o,X as s,b as c,c as l,d as u,k as d,kt as f,l as p,n as m,pt as h,q as g,r as _,u as v}from"./index.js";import{t as y}from"./CalculatorHeader-BNnd_vJE.js";import{t as b}from"./useCalculatorOutput-DVNBjs3f.js";var x=a(),S=h((0,x.jsx)(`path`,{d:`m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25z`}),`AutoAwesome`),C=h((0,x.jsx)(`path`,{d:`M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m0 12H6V10h12z`}),`LockOpen`),w=t(f(),1);function T(e){let t=e.replace(/\s/g,``);if(!t)return null;try{let e=p(t);if(e===`hex`)return BigInt(`0x`+t.replace(/^0x/,``));if(e===`base64`){let e=atob(t),n=Array.from(e).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+n)}if(e===`ascii`){let e=Array.from(t).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+e)}return BigInt(t)}catch{return null}}function E(e){let t=e.toString(16);return t.length%2!=0&&(t=`0`+t),`0x`+t}function D(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);let n=``;for(let e=0;e<t.length;e+=2){let r=parseInt(t.slice(e,e+2),16);n+=r>=32&&r<=126?String.fromCharCode(r):`.`}return n}function O(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);for(let e=0;e<t.length;e+=2){let n=parseInt(t.slice(e,e+2),16);if(n<32||n>126)return!1}return!0}function k(){let[e,t]=(0,w.useState)(``),[a,l]=(0,w.useState)(``),[u,d]=(0,w.useState)(`65537`),f=b({category:`calculator-rsa`}),p=()=>{f.clear();let t=T(e),n=T(a),r=T(u)||65537n;if(t===null||n===null){f.dispatchError(`p and q must be valid numbers`);return}if(t<=1n||n<=1n){f.dispatchError(`p and q must be > 1`);return}if(r<=0n){f.dispatchError(`e must be positive`);return}let i=t*n,o=(t-1n)*(n-1n),s=v(r,o),c=`n  = ${i}\n`;c+=`phi = ${o}\n`,c+=s===null?`d  = undefined (e and phi not coprime)`:`d  = ${s}`,f.dispatch(c,`RSA Key Gen`)};return(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(r,{fullWidth:!0,label:`p (prime)`,value:e,onChange:e=>t(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsx)(r,{fullWidth:!0,label:`q (prime)`,value:a,onChange:e=>l(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsx)(r,{fullWidth:!0,label:`e (public exponent)`,value:u,onChange:e=>d(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsx)(i,{fullWidth:!0,variant:`contained`,onClick:p,disabled:!e.trim()||!a.trim(),sx:o,children:`Compute`}),f.result&&(0,x.jsx)(g,{sx:c,children:f.result}),f.error&&(0,x.jsx)(s,{sx:{color:n.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:f.error})]})}function A(){let[e,t]=(0,w.useState)(``),[a,l]=(0,w.useState)(``),[d,f]=(0,w.useState)(``),p=b({category:`calculator-rsa`}),h=()=>{p.clear();let t=T(e),n=T(a),r=T(d)||65537n;if(t===null||n===null){p.dispatchError(`m and n must be valid numbers (e defaults to 65537)`);return}if(n<=1n){p.dispatchError(`n must be > 1`);return}if(r<=0n){p.dispatchError(`e must be positive`);return}if(t>=n){p.dispatchError(`m must be < n`);return}let i=u(t,r,n),o=`c = ${i}\n`;o+=`c (hex) = ${E(i)}\n`,O(i)&&(o+=`c (ascii) = ${D(i)}`),p.dispatch(o,`RSA Encrypt`)};return(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(r,{fullWidth:!0,label:`m (message)`,value:e,onChange:e=>t(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsx)(r,{fullWidth:!0,label:`n (modulus)`,value:a,onChange:e=>l(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsx)(r,{fullWidth:!0,label:`e (public exponent)`,value:d,onChange:e=>f(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsx)(i,{fullWidth:!0,variant:`contained`,onClick:h,disabled:!e.trim()||!a.trim(),sx:o,children:`Encrypt`}),p.result&&(0,x.jsx)(g,{sx:c,children:p.result}),p.error&&(0,x.jsx)(s,{sx:{color:n.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:p.error})]})}function j(){let[e,t]=(0,w.useState)({c:``,n:``,d:``,p:``,q:``,e:``}),a=b({category:`calculator-rsa`}),l=()=>{a.clear();let t=T(e.c),n=T(e.n),r=T(e.p),i=T(e.q),o=T(e.e),s=T(e.d);if(t===null){a.dispatchError(`c must be a valid number`);return}if(n===null&&r!==null&&i!==null?n=r*i:i===null&&n!==null&&r!==null&&n%r===0n?i=n/r:r===null&&n!==null&&i!==null&&n%i===0n&&(r=n/i),n===null){a.dispatchError(`Provide n, or p+q (any 2 of p, q, n)`);return}if(n<=1n){a.dispatchError(`n must be > 1`);return}if(t>=n){a.dispatchError(`c must be < n`);return}let c=null;if(s!==null&&s>0n&&(c=u(t,s,n)),c===null&&r!==null&&i!==null&&o!==null&&o>0n){let e=v(o,(r-1n)*(i-1n));e!==null&&(c=u(t,e,n))}if(c===null){a.dispatchError(`Provide d, or at least 2 of (p, q, n) + e`);return}let l=`m = ${c}\n`;l+=`m (hex) = ${E(c)}\n`,O(c)&&(l+=`m (ascii) = ${D(c)}`),a.dispatch(l,`RSA Decrypt`)};return(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(r,{fullWidth:!0,label:`c (ciphertext)`,value:e.c,onChange:e=>t(t=>({...t,c:e.target.value})),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsx)(r,{fullWidth:!0,label:`n (modulus)`,value:e.n,onChange:e=>t(t=>({...t,n:e.target.value})),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsx)(r,{fullWidth:!0,label:`d (private exponent, optional)`,value:e.d,onChange:e=>t(t=>({...t,d:e.target.value})),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsxs)(g,{sx:{display:`flex`,gap:2,mb:2},children:[(0,x.jsx)(r,{fullWidth:!0,label:`p (optional)`,value:e.p,onChange:e=>t(t=>({...t,p:e.target.value})),variant:`outlined`,sx:m}),(0,x.jsx)(r,{fullWidth:!0,label:`q (optional)`,value:e.q,onChange:e=>t(t=>({...t,q:e.target.value})),variant:`outlined`,sx:m})]}),(0,x.jsx)(r,{fullWidth:!0,label:`e (optional)`,value:e.e,onChange:e=>t(t=>({...t,e:e.target.value})),variant:`outlined`,sx:{...m,mb:2}}),(0,x.jsx)(i,{fullWidth:!0,variant:`contained`,onClick:l,disabled:!e.c.trim()||!e.n.trim()&&(!e.p.trim()||!e.q.trim()),sx:o,children:`Decrypt`}),a.result&&(0,x.jsx)(g,{sx:c,children:a.result}),a.error&&(0,x.jsx)(s,{sx:{color:n.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:a.error})]})}var M=[{id:`explanation`,label:`Explanation`,icon:(0,x.jsx)(d,{fontSize:`small`})},{id:`key-gen`,label:`Key Gen`,icon:(0,x.jsx)(S,{fontSize:`small`})},{id:`encrypt`,label:`Encrypt`,icon:(0,x.jsx)(e,{fontSize:`small`})},{id:`decrypt`,label:`Decrypt`,icon:(0,x.jsx)(C,{fontSize:`small`})}],N=`\\textbf{RSA Key Generation:}

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
\\end{itemize}`;function P(){return(0,x.jsxs)(g,{children:[(0,x.jsx)(s,{variant:`h6`,sx:{color:n.cyan,mb:1},children:`RSA Reference`}),(0,x.jsx)(g,{sx:{maxHeight:`60vh`,overflow:`auto`,pr:1,"&::-webkit-scrollbar":{width:`8px`},"&::-webkit-scrollbar-thumb":{background:n.currentLine,borderRadius:`4px`}},children:(0,x.jsx)(_,{latex:N})})]})}function F(){let[e,t]=(0,w.useState)(`explanation`),{setOutputResult:n,setOutputError:r,setOutputSource:i}=l();return(0,x.jsxs)(y,{title:`RSA Calculator`,subtitle:`RSA encryption, decryption, and key generation reference`,tabs:M,activeTab:e,onTabChange:(0,w.useCallback)(e=>{t(e),n(null),r(null),i(null)},[n,r,i]),children:[e===`explanation`&&(0,x.jsx)(P,{}),e===`key-gen`&&(0,x.jsx)(k,{}),e===`encrypt`&&(0,x.jsx)(A,{}),e===`decrypt`&&(0,x.jsx)(j,{})]})}export{F as default};