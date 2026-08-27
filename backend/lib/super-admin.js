// Correo del super administrador fijo (Víctor, dueño de Bukea). No vive en
// la base de datos como configuración editable a propósito: cualquier
// cuenta con este correo se promueve/repara a role='admin' en cada
// arranque del servidor (ensureSuperAdmin en db/init.js), puede entrar al
// panel con Google aunque todavía no exista su cuenta (ver /login-google en
// routes/admin.js) y queda blindada contra desactivación o degradación
// desde el propio panel (routes/admin.js).
const SUPER_ADMIN_EMAIL = 'vmdventura@gmail.com';

module.exports = { SUPER_ADMIN_EMAIL };
