import{C as e,L as t,N as n,P as r,S as i,_t as a,a as o,d as s,f as c,gt as l,i as u,l as d,m as f,mt as p,n as m,p as h,s as g}from"./index.js";import{t as _}from"./CalculatorSubTabs-HRGBHDII.js";var v=a(l(),1);function y(e){let t=e.replace(/\s/g,``);if(!t)return null;try{let e=s(t);if(e===`hex`)return BigInt(`0x`+t.replace(/^0x/,``));if(e===`base64`){let e=atob(t),n=Array.from(e).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+n)}if(e===`ascii`){let e=Array.from(t).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+e)}return BigInt(t)}catch{return null}}function b(e){let t=e.toString(16);return t.length%2!=0&&(t=`0`+t),`0x`+t}function x(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);let n=``;for(let e=0;e<t.length;e+=2){let r=parseInt(t.slice(e,e+2),16);n+=r>=32&&r<=126?String.fromCharCode(r):`.`}return n}function S(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);for(let e=0;e<t.length;e+=2){let n=parseInt(t.slice(e,e+2),16);if(n<32||n>126)return!1}return!0}var C=p();function w(){let[a,o]=(0,v.useState)(``),[s,l]=(0,v.useState)(``),[u,d]=(0,v.useState)(`65537`),[f,p]=(0,v.useState)({output:null,error:null}),h=()=>{p({output:null,error:null});let e=y(a),t=y(s),n=y(u)||65537n;if(e===null||t===null){p({output:null,error:`p and q must be valid numbers`});return}if(e<=1n||t<=1n){p({output:null,error:`p and q must be > 1`});return}if(n<=0n){p({output:null,error:`e must be positive`});return}let r=e*t,i=(e-1n)*(t-1n),o=c(n,i),l=`n  = ${r}\n`;l+=`phi = ${i}\n`,l+=o===null?`d  = undefined (e and phi not coprime)`:`d  = ${o}`,p({output:l,error:null})};return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(e,{fullWidth:!0,label:`p (prime)`,value:a,onChange:e=>o(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsx)(e,{fullWidth:!0,label:`q (prime)`,value:s,onChange:e=>l(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsx)(e,{fullWidth:!0,label:`e (public exponent)`,value:u,onChange:e=>d(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsx)(n,{fullWidth:!0,variant:`contained`,onClick:h,disabled:!a.trim()||!s.trim(),sx:{backgroundColor:i.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:i.comment}},children:`Compute`}),f.output&&(0,C.jsx)(r,{sx:g,children:f.output}),f.error&&(0,C.jsx)(t,{sx:{color:i.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:f.error})]})}function T(){let[a,o]=(0,v.useState)(``),[s,c]=(0,v.useState)(``),[l,u]=(0,v.useState)(``),[d,f]=(0,v.useState)({output:null,error:null}),p=()=>{f({output:null,error:null});let e=y(a),t=y(s),n=y(l)||65537n;if(e===null||t===null){f({output:null,error:`m and n must be valid numbers (e defaults to 65537)`});return}if(t<=1n){f({output:null,error:`n must be > 1`});return}if(n<=0n){f({output:null,error:`e must be positive`});return}if(e>=t){f({output:null,error:`m must be < n`});return}let r=h(e,n,t),i=`c = ${r}\n`;i+=`c (hex) = ${b(r)}\n`,S(r)&&(i+=`c (ascii) = ${x(r)}`),f({output:i,error:null})};return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(e,{fullWidth:!0,label:`m (message)`,value:a,onChange:e=>o(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsx)(e,{fullWidth:!0,label:`n (modulus)`,value:s,onChange:e=>c(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsx)(e,{fullWidth:!0,label:`e (public exponent)`,value:l,onChange:e=>u(e.target.value),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsx)(n,{fullWidth:!0,variant:`contained`,onClick:p,disabled:!a.trim()||!s.trim(),sx:{backgroundColor:i.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:i.comment}},children:`Encrypt`}),d.output&&(0,C.jsx)(r,{sx:g,children:d.output}),d.error&&(0,C.jsx)(t,{sx:{color:i.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:d.error})]})}function E(){let[a,o]=(0,v.useState)({c:``,n:``,d:``,p:``,q:``,e:``}),[s,l]=(0,v.useState)({output:null,error:null}),u=()=>{l({output:null,error:null});let e=y(a.c),t=y(a.n),n=y(a.p),r=y(a.q),i=y(a.e),o=y(a.d);if(e===null){l({output:null,error:`c must be a valid number`});return}if(t===null&&n!==null&&r!==null?t=n*r:r===null&&t!==null&&n!==null&&t%n===0n?r=t/n:n===null&&t!==null&&r!==null&&t%r===0n&&(n=t/r),t===null){l({output:null,error:`Provide n, or p+q (any 2 of p, q, n)`});return}if(t<=1n){l({output:null,error:`n must be > 1`});return}if(e>=t){l({output:null,error:`c must be < n`});return}let s=null;if(o!==null&&o>0n&&(s=h(e,o,t)),s===null&&n!==null&&r!==null&&i!==null&&i>0n){let a=c(i,(n-1n)*(r-1n));a!==null&&(s=h(e,a,t))}if(s===null){l({output:null,error:`Provide d, or at least 2 of (p, q, n) + e`});return}let u=`m = ${s}\n`;u+=`m (hex) = ${b(s)}\n`,S(s)&&(u+=`m (ascii) = ${x(s)}`),l({output:u,error:null})};return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(e,{fullWidth:!0,label:`c (ciphertext)`,value:a.c,onChange:e=>o(t=>({...t,c:e.target.value})),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsx)(e,{fullWidth:!0,label:`n (modulus)`,value:a.n,onChange:e=>o(t=>({...t,n:e.target.value})),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsx)(e,{fullWidth:!0,label:`d (private exponent, optional)`,value:a.d,onChange:e=>o(t=>({...t,d:e.target.value})),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsxs)(r,{sx:{display:`flex`,gap:2,mb:2},children:[(0,C.jsx)(e,{fullWidth:!0,label:`p (optional)`,value:a.p,onChange:e=>o(t=>({...t,p:e.target.value})),variant:`outlined`,sx:m}),(0,C.jsx)(e,{fullWidth:!0,label:`q (optional)`,value:a.q,onChange:e=>o(t=>({...t,q:e.target.value})),variant:`outlined`,sx:m})]}),(0,C.jsx)(e,{fullWidth:!0,label:`e (optional)`,value:a.e,onChange:e=>o(t=>({...t,e:e.target.value})),variant:`outlined`,sx:{...m,mb:2}}),(0,C.jsx)(n,{fullWidth:!0,variant:`contained`,onClick:u,disabled:!a.c.trim()||!a.n.trim()&&(!a.p.trim()||!a.q.trim()),sx:{backgroundColor:i.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:i.comment}},children:`Decrypt`}),s.output&&(0,C.jsx)(r,{sx:g,children:s.output}),s.error&&(0,C.jsx)(t,{sx:{color:i.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:s.error})]})}var D=[{id:`explanation`,label:`Explanation`},{id:`key-gen`,label:`Key Gen`},{id:`encrypt`,label:`Encrypt`},{id:`decrypt`,label:`Decrypt`}],O=`\\textbf{RSA Key Generation:}

Choose two large primes $p$ and $q$, then compute:

$n = p \\cdot q$
$\\varphi(n) = (p-1)(q-1)$

Select public exponent $e$ where $\\gcd(e, \\varphi(n)) = 1$ (commonly $65537$).
The private exponent is:

$d \\equiv e^{-1} \\pmod{\\varphi(n)}$

Public key: $(e, n)$ \\quad Private key: $(d, n)$.

\\textbf{Encryption:}

$c \\equiv m^e \\pmod{n}$

$m$ is the plaintext as an integer $0 < m < n$.

\\textbf{Decryption:}

$m \\equiv c^d \\pmod{n}$

This works because $e \\cdot d \\equiv 1 \\pmod{\\varphi(n)}$, so $m^{e \\cdot d} \\equiv m \\pmod{n}$ by Euler\\'s theorem.

\\textbf{CRT Optimization:}

Chinese Remainder Theorem speeds up decryption ~4x. Precompute:

$d_p = d \\bmod (p-1)$
$d_q = d \\bmod (q-1)$
$q_{\\text{inv}} = q^{-1} \\pmod{p}$

Decrypt: $m_p = c^{d_p} \\bmod p$, $m_q = c^{d_q} \\bmod q$, then $m = m_q + q \\cdot ((q_{\\text{inv}} \\cdot (m_p - m_q)) \\bmod p)$.

\\textbf{PKCS\\#1 v1.5 Padding:}

$\\text{EM} = \\texttt{0x00} \\parallel \\texttt{0x02} \\parallel \\text{PS} \\parallel \\texttt{0x00} \\parallel M$

PS is $k-3-|M|$ random non-zero bytes. The leading \\texttt{0x00} ensures the padded message is less than $n$.

\\textbf{OAEP Padding:}

Optimal Asymmetric Encryption Padding uses a Feistel network with a hash function $G$ and $H$ (MGF1):

$\\text{EM} = \\text{mask\\_seed} \\parallel \\text{masked\\_DB}$

Provides semantic security: same plaintext produces different ciphertexts each time. Recommended over PKCS\\#1 v1.5.

\\textbf{Common CTF Attacks:}

\\begin{itemize}
\\item \\textbf{Small $e$:} When $e=3$ and $m^3 < n$, ciphertext decryption is simply $m = \\sqrt[3]{c}$ (integer cube root).
\\item \\textbf{Common Modulus:} Same $n$, different $e_1, e_2$. If $\\gcd(e_1, e_2) = 1$, find $a e_1 + b e_2 = 1$ via extended GCD, then $m = c_1^a \\cdot c_2^b \\bmod n$.
\\item \\textbf{Wiener\\'s Attack:} When $d < \\frac{1}{3} n^{1/4}$, continued fractions on $e/n$ recover $d$ directly.
\\item \\textbf{Hastad\\'s Broadcast:} Same $m$ encrypted to $k \\geq e$ recipients with the same $e$ — CRT recovers $m^e$, then take $e$th root.
\\item \\textbf{Coppersmith:} Partial knowledge of $p$ or small roots of $f(x) \\equiv 0 \\pmod{p}$ using LLL/Howgrave-Graham.
\\end{itemize}`;function k(){return(0,C.jsxs)(r,{children:[(0,C.jsx)(t,{variant:`h6`,sx:{color:i.cyan,mb:1},children:`RSA Reference`}),(0,C.jsx)(r,{sx:{maxHeight:`60vh`,overflow:`auto`,pr:1,pb:`30vh`,"&::-webkit-scrollbar":{width:`8px`},"&::-webkit-scrollbar-thumb":{background:i.currentLine,borderRadius:`4px`}},children:(0,C.jsx)(d,{latex:O})})]})}function A(){let[e,n]=(0,v.useState)(`explanation`);return(0,C.jsx)(r,{sx:o,children:(0,C.jsx)(r,{sx:{...u,p:2},children:(0,C.jsxs)(r,{sx:{width:`100%`,maxWidth:640},children:[(0,C.jsxs)(t,{variant:`h3`,sx:{color:i.purple,mb:1,display:`flex`,alignItems:`center`,gap:1},children:[(0,C.jsx)(f,{sx:{fontSize:`inherit`}}),` RSA Calculator`]}),(0,C.jsx)(t,{variant:`body2`,sx:{color:i.comment,mb:2},children:`RSA encryption, decryption, and key generation reference`}),(0,C.jsx)(_,{tabs:D,activeTab:e,onChange:n}),(0,C.jsxs)(r,{sx:{flex:1,overflow:`auto`,px:.5,pt:1},children:[e===`explanation`&&(0,C.jsx)(k,{}),e===`key-gen`&&(0,C.jsx)(w,{}),e===`encrypt`&&(0,C.jsx)(T,{}),e===`decrypt`&&(0,C.jsx)(E,{})]})]})})})}export{A as default};