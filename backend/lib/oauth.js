const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

const appleJwks = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 24 * 60 * 60 * 1000,
});

function getAppleSigningKey(header, callback) {
  appleJwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID);
}

function isAppleConfigured() {
  return Boolean(process.env.APPLE_CLIENT_ID);
}

async function verifyGoogleIdToken(idToken) {
  if (!googleClient) throw new Error('GOOGLE_CLIENT_ID no configurado');
  const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  const name = payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' ');
  return { sub: payload.sub, email: payload.email || null, name: name || null };
}

// Apple no manda el nombre dentro del idToken — solo lo entrega el frontend,
// y solo la primera vez que el usuario autoriza la app (AppleID.auth.signIn()).
function verifyAppleIdToken(idToken) {
  if (!isAppleConfigured()) return Promise.reject(new Error('APPLE_CLIENT_ID no configurado'));
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getAppleSigningKey,
      { algorithms: ['RS256'], issuer: 'https://appleid.apple.com', audience: process.env.APPLE_CLIENT_ID },
      (err, payload) => {
        if (err) return reject(err);
        resolve({ sub: payload.sub, email: payload.email || null, name: null });
      }
    );
  });
}

module.exports = { isGoogleConfigured, isAppleConfigured, verifyGoogleIdToken, verifyAppleIdToken };
