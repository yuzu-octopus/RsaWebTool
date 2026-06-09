import{I as e,M as t,N as n,S as r,a as i,b as a,d as o,f as s,gt as c,ht as l,i as u,l as d,n as f,p,pt as m,s as h,x as g}from"./index.js";import{t as _}from"./CalculatorSubTabs-BUmznr13.js";var v=c(l(),1);function y(e){let t=e.replace(/\s/g,``);if(!t)return null;try{let e=o(t);if(e===`hex`)return BigInt(`0x`+t.replace(/^0x/,``));if(e===`base64`){let e=atob(t),n=Array.from(e).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+n)}if(e===`ascii`){let e=Array.from(t).map(e=>e.charCodeAt(0).toString(16).padStart(2,`0`)).join(``);return BigInt(`0x`+e)}return BigInt(t)}catch{return null}}function b(e){let t=e.toString(16);return t.length%2!=0&&(t=`0`+t),`0x`+t}function x(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);let n=``;for(let e=0;e<t.length;e+=2){let r=parseInt(t.slice(e,e+2),16);n+=r>=32&&r<=126?String.fromCharCode(r):`.`}return n}function S(e){let t=e.toString(16);t.length%2!=0&&(t=`0`+t);for(let e=0;e<t.length;e+=2){let n=parseInt(t.slice(e,e+2),16);if(n<32||n>126)return!1}return!0}var C=m();function w(){let[i,a]=(0,v.useState)(``),[o,c]=(0,v.useState)(``),[l,u]=(0,v.useState)(`65537`),[d,p]=(0,v.useState)({output:null,error:null}),m=()=>{p({output:null,error:null});let e=y(i),t=y(o),n=y(l)||65537n;if(e===null||t===null){p({output:null,error:`p and q must be valid numbers`});return}if(e<=1n||t<=1n){p({output:null,error:`p and q must be > 1`});return}if(n<=0n){p({output:null,error:`e must be positive`});return}let r=e*t,a=(e-1n)*(t-1n),c=s(n,a),u=`n  = ${r}\n`;u+=`phi = ${a}\n`,u+=c===null?`d  = undefined (e and phi not coprime)`:`d  = ${c}`,p({output:u,error:null})};return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(r,{fullWidth:!0,label:`p (prime)`,value:i,onChange:e=>a(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsx)(r,{fullWidth:!0,label:`q (prime)`,value:o,onChange:e=>c(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsx)(r,{fullWidth:!0,label:`e (public exponent)`,value:l,onChange:e=>u(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsx)(t,{fullWidth:!0,variant:`contained`,onClick:m,disabled:!i.trim()||!o.trim(),sx:{backgroundColor:g.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:g.comment}},children:`Compute`}),d.output&&(0,C.jsx)(n,{sx:h,children:d.output}),d.error&&(0,C.jsx)(e,{sx:{color:g.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:d.error})]})}function T(){let[i,a]=(0,v.useState)(``),[o,s]=(0,v.useState)(``),[c,l]=(0,v.useState)(``),[u,d]=(0,v.useState)({output:null,error:null}),m=()=>{d({output:null,error:null});let e=y(i),t=y(o),n=y(c)||65537n;if(e===null||t===null){d({output:null,error:`m and n must be valid numbers (e defaults to 65537)`});return}if(t<=1n){d({output:null,error:`n must be > 1`});return}if(n<=0n){d({output:null,error:`e must be positive`});return}if(e>=t){d({output:null,error:`m must be < n`});return}let r=p(e,n,t),a=`c = ${r}\n`;a+=`c (hex) = ${b(r)}\n`,S(r)&&(a+=`c (ascii) = ${x(r)}`),d({output:a,error:null})};return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(r,{fullWidth:!0,label:`m (message)`,value:i,onChange:e=>a(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsx)(r,{fullWidth:!0,label:`n (modulus)`,value:o,onChange:e=>s(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsx)(r,{fullWidth:!0,label:`e (public exponent)`,value:c,onChange:e=>l(e.target.value),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsx)(t,{fullWidth:!0,variant:`contained`,onClick:m,disabled:!i.trim()||!o.trim(),sx:{backgroundColor:g.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:g.comment}},children:`Encrypt`}),u.output&&(0,C.jsx)(n,{sx:h,children:u.output}),u.error&&(0,C.jsx)(e,{sx:{color:g.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:u.error})]})}function E(){let[i,a]=(0,v.useState)({c:``,n:``,d:``,p:``,q:``,e:``}),[o,c]=(0,v.useState)({output:null,error:null}),l=()=>{c({output:null,error:null});let e=y(i.c),t=y(i.n),n=y(i.p),r=y(i.q),a=y(i.e),o=y(i.d);if(e===null){c({output:null,error:`c must be a valid number`});return}if(t===null&&n!==null&&r!==null?t=n*r:r===null&&t!==null&&n!==null&&t%n===0n?r=t/n:n===null&&t!==null&&r!==null&&t%r===0n&&(n=t/r),t===null){c({output:null,error:`Provide n, or p+q (any 2 of p, q, n)`});return}if(t<=1n){c({output:null,error:`n must be > 1`});return}if(e>=t){c({output:null,error:`c must be < n`});return}let l=null;if(o!==null&&o>0n&&(l=p(e,o,t)),l===null&&n!==null&&r!==null&&a!==null&&a>0n){let i=s(a,(n-1n)*(r-1n));i!==null&&(l=p(e,i,t))}if(l===null){c({output:null,error:`Provide d, or at least 2 of (p, q, n) + e`});return}let u=`m = ${l}\n`;u+=`m (hex) = ${b(l)}\n`,S(l)&&(u+=`m (ascii) = ${x(l)}`),c({output:u,error:null})};return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(r,{fullWidth:!0,label:`c (ciphertext)`,value:i.c,onChange:e=>a(t=>({...t,c:e.target.value})),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsx)(r,{fullWidth:!0,label:`n (modulus)`,value:i.n,onChange:e=>a(t=>({...t,n:e.target.value})),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsx)(r,{fullWidth:!0,label:`d (private exponent, optional)`,value:i.d,onChange:e=>a(t=>({...t,d:e.target.value})),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsxs)(n,{sx:{display:`flex`,gap:2,mb:2},children:[(0,C.jsx)(r,{fullWidth:!0,label:`p (optional)`,value:i.p,onChange:e=>a(t=>({...t,p:e.target.value})),variant:`outlined`,sx:f}),(0,C.jsx)(r,{fullWidth:!0,label:`q (optional)`,value:i.q,onChange:e=>a(t=>({...t,q:e.target.value})),variant:`outlined`,sx:f})]}),(0,C.jsx)(r,{fullWidth:!0,label:`e (optional)`,value:i.e,onChange:e=>a(t=>({...t,e:e.target.value})),variant:`outlined`,sx:{...f,mb:2}}),(0,C.jsx)(t,{fullWidth:!0,variant:`contained`,onClick:l,disabled:!i.c.trim()||!i.n.trim()&&(!i.p.trim()||!i.q.trim()),sx:{backgroundColor:g.purple,fontFamily:`'JetBrains Mono', monospace`,"&:hover":{backgroundColor:`#a575f6`},"&:disabled":{backgroundColor:g.comment}},children:`Decrypt`}),o.output&&(0,C.jsx)(n,{sx:h,children:o.output}),o.error&&(0,C.jsx)(e,{sx:{color:g.red,mt:2,fontFamily:`'JetBrains Mono', monospace`,fontSize:`0.85rem`},children:o.error})]})}var D=[{id:`explanation`,label:`Explanation`},{id:`key-gen`,label:`Key Gen`},{id:`encrypt`,label:`Encrypt`},{id:`decrypt`,label:`Decrypt`}],O=`\\textbf{RSA Key Generation:}

Choose two large primes $p$ and $q$, then compute:

$$n = p \\cdot q$$
$$\\varphi(n) = (p-1)(q-1)$$

Select public exponent $e$ where $\\gcd(e, \\varphi(n)) = 1$ (commonly $65537$).
The private exponent is:

$$d \\equiv e^{-1} \\pmod{\\varphi(n)}$$

Public key: $(e, n)$ \\quad Private key: $(d, n)$.

\\textbf{Encryption:}

$$c \\equiv m^e \\pmod{n}$$

$m$ is the plaintext as an integer $0 < m < n$.

\\textbf{Decryption:}

$$m \\equiv c^d \\pmod{n}$$

This works because $e \\cdot d \\equiv 1 \\pmod{\\varphi(n)}$, so $m^{e \\cdot d} \\equiv m \\pmod{n}$ by Euler\\'s theorem.

\\textbf{CRT Optimization:}

Chinese Remainder Theorem speeds up decryption ~4x. Precompute:

$$d_p = d \\bmod (p-1)$$
$$d_q = d \\bmod (q-1)$$
$$q_{\\text{inv}} = q^{-1} \\pmod{p}$$

Decrypt: $m_p = c^{d_p} \\bmod p$, $m_q = c^{d_q} \\bmod q$, then $m = m_q + q \\cdot ((q_{\\text{inv}} \\cdot (m_p - m_q)) \\bmod p)$.

\\textbf{PKCS\\#1 v1.5 Padding:}

$$\\text{EM} = \\texttt{0x00} \\parallel \\texttt{0x02} \\parallel \\text{PS} \\parallel \\texttt{0x00} \\parallel M$$

PS is $k-3-|M|$ random non-zero bytes. The leading \\texttt{0x00} ensures the padded message is less than $n$.

\\textbf{OAEP Padding:}

Optimal Asymmetric Encryption Padding uses a Feistel network with a hash function $G$ and $H$ (MGF1):

$$\\text{EM} = \\text{mask\\_seed} \\parallel \\text{masked\\_DB}$$

Provides semantic security: same plaintext produces different ciphertexts each time. Recommended over PKCS\\#1 v1.5.

\\textbf{Common CTF Attacks:}

\\begin{itemize}
\\item \\textbf{Small $e$:} When $e=3$ and $m^3 < n$, ciphertext decryption is simply $m = \\sqrt[3]{c}$ (integer cube root).
\\item \\textbf{Common Modulus:} Same $n$, different $e_1, e_2$. If $\\gcd(e_1, e_2) = 1$, find $a e_1 + b e_2 = 1$ via extended GCD, then $m = c_1^a \\cdot c_2^b \\bmod n$.
\\item \\textbf{Wiener\\'s Attack:} When $d < \\frac{1}{3} n^{1/4}$, continued fractions on $e/n$ recover $d$ directly.
\\item \\textbf{Hastad\\'s Broadcast:} Same $m$ encrypted to $k \\geq e$ recipients with the same $e$ — CRT recovers $m^e$, then take $e$th root.
\\item \\textbf{Coppersmith:} Partial knowledge of $p$ or small roots of $f(x) \\equiv 0 \\pmod{p}$ using LLL/Howgrave-Graham.
\\end{itemize}`;function k(){return(0,C.jsxs)(n,{children:[(0,C.jsx)(e,{variant:`h6`,sx:{color:g.cyan,mb:1},children:`RSA Reference`}),(0,C.jsx)(n,{sx:{maxHeight:`60vh`,overflow:`auto`,pr:1,"&::-webkit-scrollbar":{width:`8px`},"&::-webkit-scrollbar-thumb":{background:g.currentLine,borderRadius:`4px`}},children:(0,C.jsx)(d,{latex:O})})]})}function A(){let[t,r]=(0,v.useState)(`explanation`);return(0,C.jsx)(n,{sx:i,children:(0,C.jsx)(n,{sx:{...u,p:2},children:(0,C.jsxs)(n,{sx:{width:`100%`,maxWidth:640},children:[(0,C.jsxs)(e,{variant:`h3`,sx:{color:g.purple,mb:1,display:`flex`,alignItems:`center`,gap:1},children:[(0,C.jsx)(a,{sx:{fontSize:`inherit`}}),` RSA Calculator`]}),(0,C.jsx)(e,{variant:`body2`,sx:{color:g.comment,mb:2},children:`RSA encryption, decryption, and key generation reference`}),(0,C.jsx)(_,{tabs:D,activeTab:t,onChange:r}),(0,C.jsxs)(n,{sx:{flex:1,overflow:`auto`,px:.5,pt:1},children:[t===`explanation`&&(0,C.jsx)(k,{}),t===`key-gen`&&(0,C.jsx)(w,{}),t===`encrypt`&&(0,C.jsx)(T,{}),t===`decrypt`&&(0,C.jsx)(E,{})]})]})})})}export{A as default};