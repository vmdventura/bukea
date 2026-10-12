// Prueba de la API de acceso por correo (2026-10-11). Uso:
//   node scripts/test-auth-email.js [http://localhost:3000/bukea]
// Requiere el servidor local con EMAIL_CODE_DEBUG=1 y sin SMTP.
const BASE = process.argv[2] || 'http://localhost:3000/bukea';
const API = BASE + '/api/auth';
const stamp = Date.now();
const email = `prueba.${stamp}@example.com`;
const email2 = `dueno.${stamp}@example.com`;
const phone = '8095' + String(stamp).slice(-6);
let pass = 0, fail = 0;

async function call(path, body, token) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(body || {}),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
function check(name, ok, extra) {
  if (ok) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FALLA ' + name + (extra ? ' -> ' + JSON.stringify(extra) : '')); }
}

(async () => {
  console.log('Correo ' + email);
  let r = await call('/email/send', { email: 'no-es-correo' });
  check('send con correo inválido responde 400', r.status === 400, r);

  r = await call('/email/send', { email });
  check('send responde 200 con devCode', r.status === 200 && /^\d{6}$/.test(r.data.devCode || ''), r);
  const code1 = r.data.devCode;

  r = await call('/email/verify', { email, code: '000000' });
  check('verify con código malo responde 401', r.status === 401, r);

  r = await call('/email/verify', { email, code: 'abc' });
  check('verify con formato malo responde 400', r.status === 400, r);

  r = await call('/email/verify', { email, code: code1 });
  check('verify correcto de correo nuevo da signupToken y exists:false', r.status === 200 && r.data.exists === false && !!r.data.signupToken, r);
  const signup = r.data.signupToken;

  r = await call('/email/register', { signupToken: 'falso', name: 'X', accountType: 'client' });
  check('register con pase falso responde 400', r.status === 400, r);

  r = await call('/email/register', { signupToken: signup, name: '', accountType: 'client' });
  check('register sin nombre responde 400', r.status === 400, r);

  r = await call('/email/register', { signupToken: signup, name: 'Cliente Prueba', accountType: 'client' });
  check('register de cliente sin teléfono responde 201 con token', r.status === 201 && !!r.data.token && r.data.accountType === 'client', r);
  const clientToken = r.data.token;
  check('el correo queda verificado', r.data.emailVerified === true, r.data);

  r = await call('/email/register', { signupToken: signup, name: 'Otra vez', accountType: 'client' });
  check('reusar el pase responde 400', r.status === 400, r);

  r = await call('/email/send', { email });
  const code2 = r.data.devCode;
  r = await call('/email/verify', { email, code: code2 });
  check('verify de correo existente inicia sesión (exists:true + token)', r.status === 200 && r.data.exists === true && !!r.data.token, r);

  const s = await (await fetch(API + '/session', { headers: { Authorization: 'Bearer ' + (r.data.token || clientToken) } })).json().catch(() => ({}));
  check('GET /session con el token nuevo funciona', !!s && (s.email === email || (s.user && s.user.email === email)), s);

  const email4 = `limite.${stamp}@example.com`;
  r = await call('/email/send', { email: email4 });
  check('send responde de inmediato con resendIn', r.status === 200 && r.data.resendIn === 30, r);
  r = await call('/email/send', { email: email4 });
  check('reenviar antes de 30 s responde 429 con retryAfter', r.status === 429 && r.data.retryAfter > 0 && r.data.retryAfter <= 30, r);

  console.log('Dueño ' + email2);
  r = await call('/email/send', { email: email2 });
  let v = await call('/email/verify', { email: email2, code: r.data.devCode });
  const signup2 = v.data.signupToken;
  r = await call('/email/register', { signupToken: signup2, name: 'Dueño Prueba', accountType: 'owner' });
  check('dueño sin teléfono responde 400', r.status === 400, r);
  r = await call('/email/register', { signupToken: signup2, name: 'Dueño Prueba', phone: 'abc', accountType: 'owner' });
  check('dueño con teléfono inválido responde 400', r.status === 400, r);
  r = await call('/email/register', { signupToken: signup2, name: 'Dueño Prueba', phone, accountType: 'owner' });
  check('dueño con teléfono responde 201 y accountType owner', r.status === 201 && r.data.accountType === 'owner', r);

  const email3 = `otro.${stamp}@example.com`;
  r = await call('/email/send', { email: email3 });
  v = await call('/email/verify', { email: email3, code: r.data.devCode });
  r = await call('/email/register', { signupToken: v.data.signupToken, name: 'Duplicado', phone, accountType: 'owner' });
  check('teléfono repetido responde 409', r.status === 409, r);

  console.log('Páginas');
  const ORIGIN = new URL(BASE).origin;
  async function page(path, opts) { return fetch(ORIGIN + path, { redirect: 'manual', ...(opts || {}) }); }
  let p = await page('/entrar');
  let html = await p.text();
  check('/entrar responde 200 con las dos opciones', p.status === 200 && html.includes('Bukea para clientes') && html.includes('Bukea para negocios'));
  p = await page('/entrar/cliente'); html = await p.text();
  check('/entrar/cliente responde 200 con el formulario de correo', p.status === 200 && html.includes('id="i-email"') && html.includes('id="b-email"'));
  check('/entrar/cliente tiene los botones de Google y Apple', html.includes('id="b-google"') && html.includes('id="b-apple"'));
  p = await page('/negocio'); html = await p.text();
  check('el quiz ya no dice "gratis para siempre"', !html.includes('Es gratis para siempre'));
  p = await page('/cuenta'); html = await p.text();
  check('/cuenta responde 200 y exige sesión en el cliente', p.status === 200 && html.includes("bukea_session") && html.includes('/entrar/cliente'));
  p = await page('/unete'); html = await p.text();
  check('/unete: "Soy cliente" lleva a /entrar/cliente', p.status === 200 && html.includes('href="/entrar/cliente"'));
  check('/unete: "Tengo un negocio" lleva al registro del portal', html.includes('registro=1'));
  p = await page('/'); html = await p.text();
  check('la barra tiene "Iniciar sesión" hacia /entrar', html.includes('href="/entrar"') && html.includes('data-session-link'));
  p = await page('/precios');
  check('/precios ya no existe (404)', p.status === 404);
  p = await page('/negocios');
  check('/negocios redirige al portal', p.status === 302);
  p = await page('/negocio'); html = await p.text();
  check('el portal tiene la pantalla de correo y código', p.status === 200 && html.includes('authEmailSend') && html.includes('auth-step-code') && html.includes('auth-step-complete'));

  console.log(`\n${pass} bien, ${fail} con falla`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
