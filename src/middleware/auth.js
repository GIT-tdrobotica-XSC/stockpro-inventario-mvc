// Protege rutas según sesión y rol
exports.requireLogin = (req, res, next) => {
  if (req.session.user) return next();
  req.session.flash = { type: 'warning', text: 'Inicia sesión para continuar.' };
  res.redirect('/login');
};

exports.requireAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.status(403).render('error', { title: 'Acceso denegado', code: 403, message: 'Necesitas permisos de administrador.' });
};

exports.guestOnly = (req, res, next) => (req.session.user ? res.redirect('/') : next());
