const User = require('../models/User');

const login = (req, res) => {
  const user = User.verify(req.body.email || '', req.body.password || '');
  if (!user) return res.render('auth/login', { title: 'Ingresar', error: 'Correo o contraseña incorrectos.', email: req.body.email });
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.redirect('/');
};

const register = (req, res) => {
  const { name = '', email = '', password = '', confirm = '' } = req.body;
  const fail = (error) => res.render('auth/register', { title: 'Crear cuenta', error, form: { name, email } });
  if (name.trim().length < 2) return fail('Escribe tu nombre.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Correo no válido.');
  if (password.length < 6) return fail('La contraseña debe tener al menos 6 caracteres.');
  if (password !== confirm) return fail('Las contraseñas no coinciden.');
  if (User.findByEmail(email.toLowerCase())) return fail('Ese correo ya está registrado.');
  const id = User.create({ name: name.trim(), email, password });
  req.session.user = { id, name: name.trim(), email: email.toLowerCase(), role: 'user' };
  req.session.flash = { type: 'success', text: `¡Bienvenido, ${name.trim()}!` };
  res.redirect('/');
};

module.exports = {
  showLogin: (req, res) => res.render('auth/login', { title: 'Ingresar', error: null, email: '' }),
  login,
  showRegister: (req, res) => res.render('auth/register', { title: 'Crear cuenta', error: null, form: {} }),
  register,
  logout: (req, res) => { req.session = null; res.redirect('/login'); },
  home: (req, res) => res.redirect(req.session.user.role === 'admin' ? '/admin' : '/catalog'),
};
