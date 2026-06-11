import{B as e,Ct as t,O as n,U as r,_ as i,a,g as o,h as s,i as c,k as l,l as u,m as d,n as f,s as p,v as m,wt as h,xt as g,z as _}from"./index.js";import{t as v}from"./CalculatorSubTabs-CGoGWRGN.js";var y=h(t(),1);function b(e){let t=e.replace(/\s/g,``);if(!t)return null;try{let e=s(t);if(e===`hex`)return BigInt(`0x`+t.replace(/^0x/,``));if(e===`base64`){let e=atob(t),n=Array.from(e).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+n)}if(e===`ascii`){let e=Array.from(t).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+e)}return BigInt(t)}catch{return null}}function x(e){let t=e.toString(16);return t.length%2!=0&&(t=`0`+t),`0x`+t}function S(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);let n=``;for(let e=0;e<t.length;e+=2){let r=parseInt(t.slice(e,e+2),16);n+=r>=32&&r<=126?String.fromCharCode(r):`.`}return n}function C(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);for(let e=0;e<t.length;e+=2){let n=parseInt(t.slice(e,e+2),16);if(n<32||n>126)return!1}return!0}var w=g();function T(){let[t,i]=(0,y.useState)(``),[a,s]=(0,y.useState)(``),[c,u]=(0,y.useState)(`65537`),[m,h]=(0,y.useState)({output:null,error:null}),{setOutputResult:g,setOutputError:v,setOutputSource:x,addToHistory:S}=d(),C=()=>{h({output:null,error:null}),g(null),v(null);let e=b(t),n=b(a),r=b(c)||65537n;if(e===null||n===null){h({output:null,error:`p and q must be valid numbers`}),v(`p and q must be valid numbers`),x(`calculator`);return}if(e<=1n||n<=1n){h({output:null,error:`p and q must be > 1`}),v(`p and q must be > 1`),x(`calculator`);return}if(r<=0n){h({output:null,error:`e must be positive`}),v(`e must be positive`),x(`calculator`);return}let i=e*n,s=(e-1n)*(n-1n),l=o(r,s),u=`n  = ${i}\n`;u+=`phi = ${s}\n`,u+=l===null?`d  = undefined (e and phi not coprime)`:`d  = ${l}`,h({output:u,error:null}),g(u),x(`calculator`),S(`calculator-rsa`,`RSA Key Gen`,u,!0)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(l,{fullWidth:!0,label:`p (prime)`,value:t,onChange:e=>i(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsx)(l,{fullWidth:!0,label:`q (prime)`,value:a,onChange:e=>s(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsx)(l,{fullWidth:!0,label:`e (public exponent)`,value:c,onChange:e=>u(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsx)(_,{fullWidth:!0,variant:`contained`,onClick:C,disabled:!t.trim()||!a.trim(),sx:{backgroundColor:n.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:n.comment}},children:`Compute`}),m.output&&(0,w.jsx)(e,{sx:p,children:m.output}),m.error&&(0,w.jsx)(r,{sx:{color:n.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:m.error})]})}function E(){let[t,a]=(0,y.useState)(``),[o,s]=(0,y.useState)(``),[c,u]=(0,y.useState)(``),[m,h]=(0,y.useState)({output:null,error:null}),{setOutputResult:g,setOutputError:v,setOutputSource:T,addToHistory:E}=d(),D=()=>{h({output:null,error:null}),g(null),v(null);let e=b(t),n=b(o),r=b(c)||65537n;if(e===null||n===null){h({output:null,error:`m and n must be valid numbers (e defaults to 65537)`}),v(`m and n must be valid numbers (e defaults to 65537)`),T(`calculator`);return}if(n<=1n){h({output:null,error:`n must be > 1`}),v(`n must be > 1`),T(`calculator`);return}if(r<=0n){h({output:null,error:`e must be positive`}),v(`e must be positive`),T(`calculator`);return}if(e>=n){h({output:null,error:`m must be < n`}),v(`m must be < n`),T(`calculator`);return}let a=i(e,r,n),s=`c = ${a}\n`;s+=`c (hex) = ${x(a)}\n`,C(a)&&(s+=`c (ascii) = ${S(a)}`),h({output:s,error:null}),g(s),T(`calculator`),E(`calculator-rsa`,`RSA Encrypt`,s,!0)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(l,{fullWidth:!0,label:`m (message)`,value:t,onChange:e=>a(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsx)(l,{fullWidth:!0,label:`n (modulus)`,value:o,onChange:e=>s(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsx)(l,{fullWidth:!0,label:`e (public exponent)`,value:c,onChange:e=>u(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsx)(_,{fullWidth:!0,variant:`contained`,onClick:D,disabled:!t.trim()||!o.trim(),sx:{backgroundColor:n.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:n.comment}},children:`Encrypt`}),m.output&&(0,w.jsx)(e,{sx:p,children:m.output}),m.error&&(0,w.jsx)(r,{sx:{color:n.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:m.error})]})}function D(){let[t,a]=(0,y.useState)({c:``,n:``,d:``,p:``,q:``,e:``}),[s,c]=(0,y.useState)({output:null,error:null}),{setOutputResult:u,setOutputError:m,setOutputSource:h,addToHistory:g}=d(),v=()=>{c({output:null,error:null}),u(null),m(null);let e=b(t.c),n=b(t.n),r=b(t.p),a=b(t.q),s=b(t.e),l=b(t.d);if(e===null){c({output:null,error:`c must be a valid number`}),m(`c must be a valid number`),h(`calculator`);return}if(n===null&&r!==null&&a!==null?n=r*a:a===null&&n!==null&&r!==null&&n%r===0n?a=n/r:r===null&&n!==null&&a!==null&&n%a===0n&&(r=n/a),n===null){c({output:null,error:`Provide n, or p+q (any 2 of p, q, n)`}),m(`Provide n, or p+q (any 2 of p, q, n)`),h(`calculator`);return}if(n<=1n){c({output:null,error:`n must be > 1`}),m(`n must be > 1`),h(`calculator`);return}if(e>=n){c({output:null,error:`c must be < n`}),m(`c must be < n`),h(`calculator`);return}let d=null;if(l!==null&&l>0n&&(d=i(e,l,n)),d===null&&r!==null&&a!==null&&s!==null&&s>0n){let t=o(s,(r-1n)*(a-1n));t!==null&&(d=i(e,t,n))}if(d===null){c({output:null,error:`Provide d, or at least 2 of (p, q, n) + e`}),m(`Provide d, or at least 2 of (p, q, n) + e`),h(`calculator`);return}let f=`m = ${d}\n`;f+=`m (hex) = ${x(d)}\n`,C(d)&&(f+=`m (ascii) = ${S(d)}`),c({output:f,error:null}),u(f),h(`calculator`),g(`calculator-rsa`,`RSA Decrypt`,f,!0)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(l,{fullWidth:!0,label:`c (ciphertext)`,value:t.c,onChange:e=>a(t=>({...t,c:e.target.value})),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsx)(l,{fullWidth:!0,label:`n (modulus)`,value:t.n,onChange:e=>a(t=>({...t,n:e.target.value})),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsx)(l,{fullWidth:!0,label:`d (private exponent, optional)`,value:t.d,onChange:e=>a(t=>({...t,d:e.target.value})),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsxs)(e,{sx:{display:`flex`,gap:2,mb:2},children:[(0,w.jsx)(l,{fullWidth:!0,label:`p (optional)`,value:t.p,onChange:e=>a(t=>({...t,p:e.target.value})),variant:`outlined`,sx:f}),(0,w.jsx)(l,{fullWidth:!0,label:`q (optional)`,value:t.q,onChange:e=>a(t=>({...t,q:e.target.value})),variant:`outlined`,sx:f})]}),(0,w.jsx)(l,{fullWidth:!0,label:`e (optional)`,value:t.e,onChange:e=>a(t=>({...t,e:e.target.value})),variant:`outlined`,sx:{...f,mb:2}}),(0,w.jsx)(_,{fullWidth:!0,variant:`contained`,onClick:v,disabled:!t.c.trim()||!t.n.trim()&&(!t.p.trim()||!t.q.trim()),sx:{backgroundColor:n.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:n.comment}},children:`Decrypt`}),s.output&&(0,w.jsx)(e,{sx:p,children:s.output}),s.error&&(0,w.jsx)(r,{sx:{color:n.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:s.error})]})}var O=[{id:`explanation`,label:`Explanation`},{id:`key-gen`,label:`Key Gen`},{id:`encrypt`,label:`Encrypt`},{id:`decrypt`,label:`Decrypt`}],k=`\\textbf{RSA Key Generation:}

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
\\end{itemize}`;function A(){return(0,w.jsxs)(e,{children:[(0,w.jsx)(r,{variant:`h6`,sx:{color:n.cyan,mb:1},children:`RSA Reference`}),(0,w.jsx)(e,{sx:{maxHeight:`60vh`,overflow:`auto`,pr:1,"&::-webkit-scrollbar":{width:`8px`},"&::-webkit-scrollbar-thumb":{background:n.currentLine,borderRadius:`4px`}},children:(0,w.jsx)(u,{latex:k})})]})}function j(){let[t,i]=(0,y.useState)(`explanation`),{setOutputResult:o,setOutputError:s,setOutputSource:l}=d(),u=(0,y.useCallback)(e=>{i(e),o(null),s(null),l(null)},[o,s,l]);return(0,w.jsx)(e,{sx:a,children:(0,w.jsx)(e,{sx:{...c,pt:2,px:2},children:(0,w.jsxs)(e,{sx:{width:`100%`,maxWidth:640},children:[(0,w.jsxs)(r,{variant:`h3`,sx:{color:n.purple,mb:1,display:`flex`,alignItems:`center`,gap:1},children:[(0,w.jsx)(m,{sx:{fontSize:`inherit`}}),` RSA Calculator`]}),(0,w.jsx)(r,{variant:`body2`,sx:{color:n.comment,mb:2},children:`RSA encryption, decryption, and key generation reference`}),(0,w.jsx)(v,{tabs:O,activeTab:t,onChange:u}),(0,w.jsxs)(e,{sx:{flex:1,overflow:`auto`,px:.5,pt:1},children:[t===`explanation`&&(0,w.jsx)(A,{}),t===`key-gen`&&(0,w.jsx)(T,{}),t===`encrypt`&&(0,w.jsx)(E,{}),t===`decrypt`&&(0,w.jsx)(D,{})]})]})})})}export{j as default};