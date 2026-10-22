// Vista de usuario: catálogo, detalle y retiro de productos
const Product = require('../models/Product');
const Category = require('../models/Category');
const Movement = require('../models/Movement');

exports.index = (req, res) => {
  const { q = '', category = '', sort = 'name', page = 1 } = req.query;
  const result = Product.list({ q, category, sort, page, perPage: 9 });
  res.render('catalog/index', {
    title: 'Catálogo', ...result, categories: Category.all(), q, category, sort,
  });
};

exports.show = (req, res) => {
  const product = Product.find(req.params.id);
  if (!product) return res.status(404).render('error', { title: 'No encontrado', code: 404, message: 'Ese producto no existe.' });
  res.render('catalog/show', { title: product.name, product });
};

exports.request = (req, res) => {
  const quantity = parseInt(req.body.quantity, 10);
  const back = `/catalog/${req.params.id}`;
  if (!quantity || quantity < 1) {
    req.session.flash = { type: 'danger', text: 'Indica una cantidad válida.' };
    return res.redirect(back);
  }
  try {
    Movement.register({
      productId: req.params.id, userId: req.session.user.id,
      type: 'salida', quantity, note: req.body.note,
    });
    req.session.flash = { type: 'success', text: `Retiraste ${quantity} unidad(es) correctamente.` };
    res.redirect('/my-movements');
  } catch (e) {
    req.session.flash = { type: 'danger', text: e.message };
    res.redirect(back);
  }
};

exports.mine = (req, res) => {
  res.render('catalog/mine', { title: 'Mis movimientos', movements: Movement.byUser(req.session.user.id) });
};
