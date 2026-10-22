const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
require('./seed').ensure();

const app = express();
const root = path.join(__dirname, '..');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // detrás del proxy de Vercel

app.use(express.urlencoded({ extended: false }));

// Sesión guardada en una cookie firmada (sin estado en el servidor, apta para serverless)
app.use(cookieSession({
  name: 'stockpro',
  keys: [process.env.SESSION_SECRET || 'stockpro-feria-secret'],
  maxAge: 1000 * 60 * 60 * 8,
  sameSite: 'lax',
  httpOnly: true,
}));

// Assets locales en /public (Bootstrap, íconos y Chart.js incluidos: funciona sin internet)
app.use(express.static(path.join(root, 'public')));

// Variables disponibles en todas las vistas
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.path = req.path;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.money = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  res.locals.qs = (obj) => new URLSearchParams(Object.entries(obj).filter(([, v]) => v)).toString();
  next();
});

app.use(require('./routes'));

app.use((req, res) =>
  res.status(404).render('error', { title: 'No encontrado', code: 404, message: 'La página que buscas no existe.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Error', code: 500, message: 'Ocurrió un error inesperado.' });
});

module.exports = app;

// En local arranca el servidor; en Vercel se exporta la app (api/index.js)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`StockPro corriendo en http://localhost:${PORT}`));
}
