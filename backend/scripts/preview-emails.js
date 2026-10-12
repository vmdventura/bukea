// Genera una vista previa de todas las plantillas de correo en
// backend/tmp-email-preview/ (carpeta ignorada). Uso: node scripts/preview-emails.js
const fs = require('fs');
const path = require('path');
const T = require('../lib/email-template');

const out = path.join(__dirname, '..', 'tmp-email-preview');
fs.mkdirSync(out, { recursive: true });

const pages = {
  '1-codigo': T.loginCode('442037'),
  '2-bienvenida-cliente': T.welcomeClient('María José Pérez'),
  '3-bienvenida-negocio': T.welcomeBusiness('Yesenia Rodríguez'),
  '4-recuperar-pin': T.pinReset('918274'),
  '5-verificar-correo': T.verifyEmail('Carlos Díaz', 'carlos@correo.com', 'https://www.bukeard.com/app/api/auth/verify-email?token=abc'),
  '6-mensaje-equipo': T.message('Un saludo del equipo de Bukea', 'Hola Yesenia,\n\nGracias por abrir Studio Prueba en Bukea. Quería saludarte y saber cómo te has sentido usando la app.\n\n1. ¿Qué es lo que más te ha gustado?\n2. ¿Qué te ha costado?\n\nRespóndeme aquí mismo cuando puedas.'),
  '8-cita-confirmada': T.bookingConfirmed({ clientName: 'Carlos Díaz', serviceName: 'Corte + barba', priceCents: 60000, dayLabel: 'Mar 13 oct', timeLabel: '9:30 AM', businessName: 'Barbería El Nítido', professionalName: 'Joel Batista', collaboratorName: null, neighborhood: 'Villa Consuelo', paymentMethod: 'bank', directionsUrl: 'https://maps.google.com', profileUrl: 'https://www.bukeard.com/p/joel-el-fino' }),
  '7-aviso-negocio-nuevo': T.newBusinessAlert({ businessName: 'Studio Prueba', name: 'Yesenia Rodríguez', category: 'Uñas', neighborhood: 'Piantini', servicesCount: 4, ownerName: 'Yesenia', ownerPhone: '809 555 0177', ownerEmail: 'yes@correo.com', referral: 'instagram', foundingFree: true, adminUrl: 'https://www.bukeard.com/admin', profileUrl: 'https://www.bukeard.com/p/studio-prueba' }),
};
Object.entries(pages).forEach(([n, html]) => fs.writeFileSync(path.join(out, n + '.html'), html));
console.log(Object.keys(pages).join('\n'));
