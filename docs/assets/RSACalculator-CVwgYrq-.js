import{Ct as e,D as t,H as n,O as r,R as i,St as a,_ as o,bt as s,c,g as l,h as u,i as d,m as f,o as p,p as m,r as h,t as g,z as _}from"./index.js";import{t as v}from"./CalculatorSubTabs-ByQ5uMqD.js";var y=e(a(),1);function b(e){let t=e.replace(/\s/g,``);if(!t)return null;try{let e=f(t);if(e===`hex`)return BigInt(`0x`+t.replace(/^0x/,``));if(e===`base64`){let e=atob(t),n=Array.from(e).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+n)}if(e===`ascii`){let e=Array.from(t).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+e)}return BigInt(t)}catch{return null}}function x(e){let t=e.toString(16);return t.length%2!=0&&(t=`0`+t),`0x`+t}function S(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);let n=``;for(let e=0;e<t.length;e+=2){let r=parseInt(t.slice(e,e+2),16);n+=r>=32&&r<=126?String.fromCharCode(r):`.`}return n}function C(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);for(let e=0;e<t.length;e+=2){let n=parseInt(t.slice(e,e+2),16);if(n<32||n>126)return!1}return!0}var w=s();function T(){let[e,a]=(0,y.useState)(``),[o,s]=(0,y.useState)(``),[c,l]=(0,y.useState)(`65537`),[d,f]=(0,y.useState)({output:null,error:null}),{setOutputResult:h,setOutputError:v,setOutputSource:x,addToHistory:S}=m(),C=()=>{f({output:null,error:null}),h(null),v(null);let t=b(e),n=b(o),r=b(c)||65537n;if(t===null||n===null){f({output:null,error:`p and q must be valid numbers`}),v(`p and q must be valid numbers`),x(`calculator`);return}if(t<=1n||n<=1n){f({output:null,error:`p and q must be > 1`}),v(`p and q must be > 1`),x(`calculator`);return}if(r<=0n){f({output:null,error:`e must be positive`}),v(`e must be positive`),x(`calculator`);return}let i=t*n,a=(t-1n)*(n-1n),s=u(r,a),l=`n  = ${i}\n`;l+=`phi = ${a}\n`,l+=s===null?`d  = undefined (e and phi not coprime)`:`d  = ${s}`,f({output:l,error:null}),h(l),x(`calculator`),S(`calculator-rsa`,`RSA Key Gen`,l,!0)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(r,{fullWidth:!0,label:`p (prime)`,value:e,onChange:e=>a(e.target.value),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsx)(r,{fullWidth:!0,label:`q (prime)`,value:o,onChange:e=>s(e.target.value),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsx)(r,{fullWidth:!0,label:`e (public exponent)`,value:c,onChange:e=>l(e.target.value),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsx)(i,{fullWidth:!0,variant:`contained`,onClick:C,disabled:!e.trim()||!o.trim(),sx:{backgroundColor:t.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:t.comment}},children:`Compute`}),d.output&&(0,w.jsx)(_,{sx:p,children:d.output}),d.error&&(0,w.jsx)(n,{sx:{color:t.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:d.error})]})}function E(){let[e,a]=(0,y.useState)(``),[o,s]=(0,y.useState)(``),[c,u]=(0,y.useState)(``),[d,f]=(0,y.useState)({output:null,error:null}),{setOutputResult:h,setOutputError:v,setOutputSource:T,addToHistory:E}=m(),D=()=>{f({output:null,error:null}),h(null),v(null);let t=b(e),n=b(o),r=b(c)||65537n;if(t===null||n===null){f({output:null,error:`m and n must be valid numbers (e defaults to 65537)`}),v(`m and n must be valid numbers (e defaults to 65537)`),T(`calculator`);return}if(n<=1n){f({output:null,error:`n must be > 1`}),v(`n must be > 1`),T(`calculator`);return}if(r<=0n){f({output:null,error:`e must be positive`}),v(`e must be positive`),T(`calculator`);return}if(t>=n){f({output:null,error:`m must be < n`}),v(`m must be < n`),T(`calculator`);return}let i=l(t,r,n),a=`c = ${i}\n`;a+=`c (hex) = ${x(i)}\n`,C(i)&&(a+=`c (ascii) = ${S(i)}`),f({output:a,error:null}),h(a),T(`calculator`),E(`calculator-rsa`,`RSA Encrypt`,a,!0)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(r,{fullWidth:!0,label:`m (message)`,value:e,onChange:e=>a(e.target.value),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsx)(r,{fullWidth:!0,label:`n (modulus)`,value:o,onChange:e=>s(e.target.value),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsx)(r,{fullWidth:!0,label:`e (public exponent)`,value:c,onChange:e=>u(e.target.value),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsx)(i,{fullWidth:!0,variant:`contained`,onClick:D,disabled:!e.trim()||!o.trim(),sx:{backgroundColor:t.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:t.comment}},children:`Encrypt`}),d.output&&(0,w.jsx)(_,{sx:p,children:d.output}),d.error&&(0,w.jsx)(n,{sx:{color:t.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:d.error})]})}function D(){let[e,a]=(0,y.useState)({c:``,n:``,d:``,p:``,q:``,e:``}),[o,s]=(0,y.useState)({output:null,error:null}),{setOutputResult:c,setOutputError:d,setOutputSource:f,addToHistory:h}=m(),v=()=>{s({output:null,error:null}),c(null),d(null);let t=b(e.c),n=b(e.n),r=b(e.p),i=b(e.q),a=b(e.e),o=b(e.d);if(t===null){s({output:null,error:`c must be a valid number`}),d(`c must be a valid number`),f(`calculator`);return}if(n===null&&r!==null&&i!==null?n=r*i:i===null&&n!==null&&r!==null&&n%r===0n?i=n/r:r===null&&n!==null&&i!==null&&n%i===0n&&(r=n/i),n===null){s({output:null,error:`Provide n, or p+q (any 2 of p, q, n)`}),d(`Provide n, or p+q (any 2 of p, q, n)`),f(`calculator`);return}if(n<=1n){s({output:null,error:`n must be > 1`}),d(`n must be > 1`),f(`calculator`);return}if(t>=n){s({output:null,error:`c must be < n`}),d(`c must be < n`),f(`calculator`);return}let p=null;if(o!==null&&o>0n&&(p=l(t,o,n)),p===null&&r!==null&&i!==null&&a!==null&&a>0n){let e=u(a,(r-1n)*(i-1n));e!==null&&(p=l(t,e,n))}if(p===null){s({output:null,error:`Provide d, or at least 2 of (p, q, n) + e`}),d(`Provide d, or at least 2 of (p, q, n) + e`),f(`calculator`);return}let m=`m = ${p}\n`;m+=`m (hex) = ${x(p)}\n`,C(p)&&(m+=`m (ascii) = ${S(p)}`),s({output:m,error:null}),c(m),f(`calculator`),h(`calculator-rsa`,`RSA Decrypt`,m,!0)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(r,{fullWidth:!0,label:`c (ciphertext)`,value:e.c,onChange:e=>a(t=>({...t,c:e.target.value})),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsx)(r,{fullWidth:!0,label:`n (modulus)`,value:e.n,onChange:e=>a(t=>({...t,n:e.target.value})),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsx)(r,{fullWidth:!0,label:`d (private exponent, optional)`,value:e.d,onChange:e=>a(t=>({...t,d:e.target.value})),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsxs)(_,{sx:{display:`flex`,gap:2,mb:2},children:[(0,w.jsx)(r,{fullWidth:!0,label:`p (optional)`,value:e.p,onChange:e=>a(t=>({...t,p:e.target.value})),variant:`outlined`,sx:g}),(0,w.jsx)(r,{fullWidth:!0,label:`q (optional)`,value:e.q,onChange:e=>a(t=>({...t,q:e.target.value})),variant:`outlined`,sx:g})]}),(0,w.jsx)(r,{fullWidth:!0,label:`e (optional)`,value:e.e,onChange:e=>a(t=>({...t,e:e.target.value})),variant:`outlined`,sx:{...g,mb:2}}),(0,w.jsx)(i,{fullWidth:!0,variant:`contained`,onClick:v,disabled:!e.c.trim()||!e.n.trim()&&(!e.p.trim()||!e.q.trim()),sx:{backgroundColor:t.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:t.comment}},children:`Decrypt`}),o.output&&(0,w.jsx)(_,{sx:p,children:o.output}),o.error&&(0,w.jsx)(n,{sx:{color:t.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:o.error})]})}var O=[{id:`explanation`,label:`Explanation`},{id:`key-gen`,label:`Key Gen`},{id:`encrypt`,label:`Encrypt`},{id:`decrypt`,label:`Decrypt`}],k=`\\textbf{RSA Key Generation:}

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
\\end{itemize}`;function A(){return(0,w.jsxs)(_,{children:[(0,w.jsx)(n,{variant:`h6`,sx:{color:t.cyan,mb:1},children:`RSA Reference`}),(0,w.jsx)(_,{sx:{maxHeight:`60vh`,overflow:`auto`,pr:1,pb:`20vh`,"&::-webkit-scrollbar":{width:`8px`},"&::-webkit-scrollbar-thumb":{background:t.currentLine,borderRadius:`4px`}},children:(0,w.jsx)(c,{latex:k})})]})}function j(){let[e,r]=(0,y.useState)(`explanation`),{setOutputResult:i,setOutputError:a,setOutputSource:s}=m(),c=(0,y.useCallback)(e=>{r(e),i(null),a(null),s(null)},[i,a,s]);return(0,w.jsx)(_,{sx:d,children:(0,w.jsx)(_,{sx:{...h,p:2},children:(0,w.jsxs)(_,{sx:{width:`100%`,maxWidth:640},children:[(0,w.jsxs)(n,{variant:`h3`,sx:{color:t.purple,mb:1,display:`flex`,alignItems:`center`,gap:1},children:[(0,w.jsx)(o,{sx:{fontSize:`inherit`}}),` RSA Calculator`]}),(0,w.jsx)(n,{variant:`body2`,sx:{color:t.comment,mb:2},children:`RSA encryption, decryption, and key generation reference`}),(0,w.jsx)(v,{tabs:O,activeTab:e,onChange:c}),(0,w.jsxs)(_,{sx:{flex:1,overflow:`auto`,px:.5,pt:1},children:[e===`explanation`&&(0,w.jsx)(A,{}),e===`key-gen`&&(0,w.jsx)(T,{}),e===`encrypt`&&(0,w.jsx)(E,{}),e===`decrypt`&&(0,w.jsx)(D,{})]})]})})})}export{j as default};