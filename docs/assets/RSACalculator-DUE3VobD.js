import{C as e,F as t,P as n,R as r,_t as i,c as a,d as o,f as s,h as c,ht as l,i as u,m as d,o as f,p,r as m,t as h,vt as g,w as _}from"./index.js";import{t as v}from"./CalculatorSubTabs-BpRui4cM.js";var y=g(i(),1);function b(e){let t=e.replace(/\s/g,``);if(!t)return null;try{let e=s(t);if(e===`hex`)return BigInt(`0x`+t.replace(/^0x/,``));if(e===`base64`){let e=atob(t),n=Array.from(e).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+n)}if(e===`ascii`){let e=Array.from(t).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+e)}return BigInt(t)}catch{return null}}function x(e){let t=e.toString(16);return t.length%2!=0&&(t=`0`+t),`0x`+t}function S(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);let n=``;for(let e=0;e<t.length;e+=2){let r=parseInt(t.slice(e,e+2),16);n+=r>=32&&r<=126?String.fromCharCode(r):`.`}return n}function C(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);for(let e=0;e<t.length;e+=2){let n=parseInt(t.slice(e,e+2),16);if(n<32||n>126)return!1}return!0}var w=l();function T(){let[i,a]=(0,y.useState)(``),[s,c]=(0,y.useState)(``),[l,u]=(0,y.useState)(`65537`),[d,m]=(0,y.useState)({output:null,error:null}),{setOutputResult:g,setOutputError:v,setOutputSource:x,addToHistory:S}=o(),C=()=>{m({output:null,error:null}),g(null),v(null);let e=b(i),t=b(s),n=b(l)||65537n;if(e===null||t===null){m({output:null,error:`p and q must be valid numbers`}),v(`p and q must be valid numbers`),x(`calculator`);return}if(e<=1n||t<=1n){m({output:null,error:`p and q must be > 1`}),v(`p and q must be > 1`),x(`calculator`);return}if(n<=0n){m({output:null,error:`e must be positive`}),v(`e must be positive`),x(`calculator`);return}let r=e*t,a=(e-1n)*(t-1n),o=p(n,a),c=`n  = ${r}\n`;c+=`phi = ${a}\n`,c+=o===null?`d  = undefined (e and phi not coprime)`:`d  = ${o}`,m({output:c,error:null}),g(c),x(`calculator`),S(`calculator-rsa`,`RSA Key Gen`,c,!0)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(_,{fullWidth:!0,label:`p (prime)`,value:i,onChange:e=>a(e.target.value),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsx)(_,{fullWidth:!0,label:`q (prime)`,value:s,onChange:e=>c(e.target.value),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsx)(_,{fullWidth:!0,label:`e (public exponent)`,value:l,onChange:e=>u(e.target.value),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsx)(n,{fullWidth:!0,variant:`contained`,onClick:C,disabled:!i.trim()||!s.trim(),sx:{backgroundColor:e.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:e.comment}},children:`Compute`}),d.output&&(0,w.jsx)(t,{sx:f,children:d.output}),d.error&&(0,w.jsx)(r,{sx:{color:e.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:d.error})]})}function E(){let[i,a]=(0,y.useState)(``),[s,c]=(0,y.useState)(``),[l,u]=(0,y.useState)(``),[p,m]=(0,y.useState)({output:null,error:null}),{setOutputResult:g,setOutputError:v,setOutputSource:T,addToHistory:E}=o(),D=()=>{m({output:null,error:null}),g(null),v(null);let e=b(i),t=b(s),n=b(l)||65537n;if(e===null||t===null){m({output:null,error:`m and n must be valid numbers (e defaults to 65537)`}),v(`m and n must be valid numbers (e defaults to 65537)`),T(`calculator`);return}if(t<=1n){m({output:null,error:`n must be > 1`}),v(`n must be > 1`),T(`calculator`);return}if(n<=0n){m({output:null,error:`e must be positive`}),v(`e must be positive`),T(`calculator`);return}if(e>=t){m({output:null,error:`m must be < n`}),v(`m must be < n`),T(`calculator`);return}let r=d(e,n,t),a=`c = ${r}\n`;a+=`c (hex) = ${x(r)}\n`,C(r)&&(a+=`c (ascii) = ${S(r)}`),m({output:a,error:null}),g(a),T(`calculator`),E(`calculator-rsa`,`RSA Encrypt`,a,!0)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(_,{fullWidth:!0,label:`m (message)`,value:i,onChange:e=>a(e.target.value),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsx)(_,{fullWidth:!0,label:`n (modulus)`,value:s,onChange:e=>c(e.target.value),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsx)(_,{fullWidth:!0,label:`e (public exponent)`,value:l,onChange:e=>u(e.target.value),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsx)(n,{fullWidth:!0,variant:`contained`,onClick:D,disabled:!i.trim()||!s.trim(),sx:{backgroundColor:e.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:e.comment}},children:`Encrypt`}),p.output&&(0,w.jsx)(t,{sx:f,children:p.output}),p.error&&(0,w.jsx)(r,{sx:{color:e.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:p.error})]})}function D(){let[i,a]=(0,y.useState)({c:``,n:``,d:``,p:``,q:``,e:``}),[s,c]=(0,y.useState)({output:null,error:null}),{setOutputResult:l,setOutputError:u,setOutputSource:m,addToHistory:g}=o(),v=()=>{c({output:null,error:null}),l(null),u(null);let e=b(i.c),t=b(i.n),n=b(i.p),r=b(i.q),a=b(i.e),o=b(i.d);if(e===null){c({output:null,error:`c must be a valid number`}),u(`c must be a valid number`),m(`calculator`);return}if(t===null&&n!==null&&r!==null?t=n*r:r===null&&t!==null&&n!==null&&t%n===0n?r=t/n:n===null&&t!==null&&r!==null&&t%r===0n&&(n=t/r),t===null){c({output:null,error:`Provide n, or p+q (any 2 of p, q, n)`}),u(`Provide n, or p+q (any 2 of p, q, n)`),m(`calculator`);return}if(t<=1n){c({output:null,error:`n must be > 1`}),u(`n must be > 1`),m(`calculator`);return}if(e>=t){c({output:null,error:`c must be < n`}),u(`c must be < n`),m(`calculator`);return}let s=null;if(o!==null&&o>0n&&(s=d(e,o,t)),s===null&&n!==null&&r!==null&&a!==null&&a>0n){let i=p(a,(n-1n)*(r-1n));i!==null&&(s=d(e,i,t))}if(s===null){c({output:null,error:`Provide d, or at least 2 of (p, q, n) + e`}),u(`Provide d, or at least 2 of (p, q, n) + e`),m(`calculator`);return}let f=`m = ${s}\n`;f+=`m (hex) = ${x(s)}\n`,C(s)&&(f+=`m (ascii) = ${S(s)}`),c({output:f,error:null}),l(f),m(`calculator`),g(`calculator-rsa`,`RSA Decrypt`,f,!0)};return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(_,{fullWidth:!0,label:`c (ciphertext)`,value:i.c,onChange:e=>a(t=>({...t,c:e.target.value})),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsx)(_,{fullWidth:!0,label:`n (modulus)`,value:i.n,onChange:e=>a(t=>({...t,n:e.target.value})),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsx)(_,{fullWidth:!0,label:`d (private exponent, optional)`,value:i.d,onChange:e=>a(t=>({...t,d:e.target.value})),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsxs)(t,{sx:{display:`flex`,gap:2,mb:2},children:[(0,w.jsx)(_,{fullWidth:!0,label:`p (optional)`,value:i.p,onChange:e=>a(t=>({...t,p:e.target.value})),variant:`outlined`,sx:h}),(0,w.jsx)(_,{fullWidth:!0,label:`q (optional)`,value:i.q,onChange:e=>a(t=>({...t,q:e.target.value})),variant:`outlined`,sx:h})]}),(0,w.jsx)(_,{fullWidth:!0,label:`e (optional)`,value:i.e,onChange:e=>a(t=>({...t,e:e.target.value})),variant:`outlined`,sx:{...h,mb:2}}),(0,w.jsx)(n,{fullWidth:!0,variant:`contained`,onClick:v,disabled:!i.c.trim()||!i.n.trim()&&(!i.p.trim()||!i.q.trim()),sx:{backgroundColor:e.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:e.comment}},children:`Decrypt`}),s.output&&(0,w.jsx)(t,{sx:f,children:s.output}),s.error&&(0,w.jsx)(r,{sx:{color:e.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:s.error})]})}var O=[{id:`explanation`,label:`Explanation`},{id:`key-gen`,label:`Key Gen`},{id:`encrypt`,label:`Encrypt`},{id:`decrypt`,label:`Decrypt`}],k=`\\textbf{RSA Key Generation:}

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
\\end{itemize}`;function A(){return(0,w.jsxs)(t,{children:[(0,w.jsx)(r,{variant:`h6`,sx:{color:e.cyan,mb:1},children:`RSA Reference`}),(0,w.jsx)(t,{sx:{maxHeight:`60vh`,overflow:`auto`,pr:1,pb:`20vh`,"&::-webkit-scrollbar":{width:`8px`},"&::-webkit-scrollbar-thumb":{background:e.currentLine,borderRadius:`4px`}},children:(0,w.jsx)(a,{latex:k})})]})}function j(){let[n,i]=(0,y.useState)(`explanation`),{setOutputResult:a,setOutputError:s,setOutputSource:l}=o(),d=(0,y.useCallback)(e=>{i(e),a(null),s(null),l(null)},[a,s,l]);return(0,w.jsx)(t,{sx:u,children:(0,w.jsx)(t,{sx:{...m,p:2},children:(0,w.jsxs)(t,{sx:{width:`100%`,maxWidth:640},children:[(0,w.jsxs)(r,{variant:`h3`,sx:{color:e.purple,mb:1,display:`flex`,alignItems:`center`,gap:1},children:[(0,w.jsx)(c,{sx:{fontSize:`inherit`}}),` RSA Calculator`]}),(0,w.jsx)(r,{variant:`body2`,sx:{color:e.comment,mb:2},children:`RSA encryption, decryption, and key generation reference`}),(0,w.jsx)(v,{tabs:O,activeTab:n,onChange:d}),(0,w.jsxs)(t,{sx:{flex:1,overflow:`auto`,px:.5,pt:1},children:[n===`explanation`&&(0,w.jsx)(A,{}),n===`key-gen`&&(0,w.jsx)(T,{}),n===`encrypt`&&(0,w.jsx)(E,{}),n===`decrypt`&&(0,w.jsx)(D,{})]})]})})})}export{j as default};