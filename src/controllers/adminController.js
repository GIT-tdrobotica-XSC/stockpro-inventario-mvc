// Panel de administración: dashboard, productos, categorías, usuarios y movimientos
const Product = require('../models/Product');
const Category = require('../models/Category');
const Movement = require('../models/Movement');
const User = require('../models/User');

const flash = (req, type, text) => { req.session.flash = { type, text }; };

// ---------- Dashboard ----------
exports.dashboard = (req, res) => {
  res.render('admin/dashboard', {
    title: 'Dashboard',
    stats: Product.stats(),
    users: User.count(),
    low: Product.lowStock(),
    recent: Movement.recent(8),
    byCategory: Product.byCategory(),
    week: Movement.last7days(),
  });
};

// ---------- Productos ----------
function parseProduct(body) {
  const d = {
    sku: (body.sku || '').trim().toUpperCase(),
    name: (body.name || '').trim(),
    description: (body.description || '').trim(),
    category_id: body.category_id || null,
    price: parseFloat(body.price),
    stock: parseInt(body.stock || 0, 10),
    min_stock: parseInt(body.min_stock || 0, 10),
  };
  let error = null;
  if (!d.sku) error = 'El SKU es obligatorio.';
  else if (d.name.length < 2) error = 'El nombre es obligatorio.';
  else if (!(d.price >= 0)) error = 'El precio no es válido.';
  else if (!(d.stock >= 0) || !(d.min_stock >= 0)) error = 'Stock inválido.';
  return { d, error };
}

exports.products = (req, res) => {
  const { q = '', category = '', sort = 'recent', page = 1 } = req.query;
  res.render('admin/products/index', {
    title: 'Productos', ...Product.list({ q, category, sort, page, perPage: 10 }),
    categories: Category.all(), q, category, sort,
  });
};

exports.newProduct = (req, res) =>
  res.render('admin/products/form', { title: 'Nuevo producto', product: {}, categories: Category.all(), error: null, editing: false });

exports.createProduct = (req, res) => {
  const { d, error } = parseProduct(req.body);
  const again = (msg) => res.render('admin/products/form', { title: 'Nuevo producto', product: d, categories: Category.all(), error: msg, editing: false });
  if (error) return again(error);
  try {
    const id = Product.create(d);
    if (d.stock > 0) Movement.register({ productId: id, userId: req.session.user.id, type: 'entrada', quantity: d.stock, note: 'Stock inicial' });
    flash(req, 'success', 'Producto creado.');
    res.redirect('/admin/products');
  } catch (e) {
    again(String(e.message).includes('UNIQUE') ? 'Ya existe un producto con ese SKU.' : e.message);
  }
};

exports.editProduct = (req, res) => {
  const product = Product.find(req.params.id);
  if (!product) return res.redirect('/admin/products');
  res.render('admin/products/form', { title: 'Editar producto', product, categories: Category.all(), error: null, editing: true });
};

exports.updateProduct = (req, res) => {
  const { d, error } = parseProduct(req.body);
  const again = (msg) => res.render('admin/products/form', { title: 'Editar producto', product: { ...d, id: req.params.id }, categories: Category.all(), error: msg, editing: true });
  if (error) return again(error);
  try {
    Product.update(req.params.id, d);
    flash(req, 'success', 'Producto actualizado.');
    res.redirect('/admin/products');
  } catch (e) {
    again(String(e.message).includes('UNIQUE') ? 'Ya existe un producto con ese SKU.' : e.message);
  }
};

exports.deleteProduct = (req, res) => {
  Product.remove(req.params.id);
  flash(req, 'success', 'Producto eliminado.');
  res.redirect('/admin/products');
};

exports.adjustStock = (req, res) => {
  const quantity = parseInt(req.body.quantity, 10);
  const type = req.body.type === 'salida' ? 'salida' : 'entrada';
  try {
    if (!quantity || quantity < 1) throw new Error('Cantidad no válida.');
    Movement.register({ productId: req.params.id, userId: req.session.user.id, type, quantity, note: req.body.note || 'Ajuste manual' });
    flash(req, 'success', `Se registró una ${type} de ${quantity} unidad(es).`);
  } catch (e) { flash(req, 'danger', e.message); }
  res.redirect(req.body.back || '/admin/products');
};

// ---------- Categorías ----------
exports.categories = (req, res) =>
  res.render('admin/categories', { title: 'Categorías', categories: Category.all(), edit: Category.find(req.query.edit), error: null });

exports.saveCategory = (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) { flash(req, 'danger', 'El nombre es obligatorio.'); return res.redirect('/admin/categories'); }
  try {
    if (req.params.id) Category.update(req.params.id, { ...req.body, name });
    else Category.create({ ...req.body, name });
    flash(req, 'success', 'Categoría guardada.');
  } catch (e) { flash(req, 'danger', 'Ya existe una categoría con ese nombre.'); }
  res.redirect('/admin/categories');
};

exports.deleteCategory = (req, res) => {
  Category.remove(req.params.id);
  flash(req, 'success', 'Categoría eliminada.');
  res.redirect('/admin/categories');
};

// ---------- Usuarios ----------
exports.users = (req, res) => res.render('admin/users', { title: 'Usuarios', users: User.all() });

exports.setRole = (req, res) => {
  const id = +req.params.id;
  const role = req.body.role === 'admin' ? 'admin' : 'user';
  if (id === req.session.user.id) flash(req, 'danger', 'No puedes cambiar tu propio rol.');
  else { User.setRole(id, role); flash(req, 'success', 'Rol actualizado.'); }
  res.redirect('/admin/users');
};

exports.deleteUser = (req, res) => {
  const id = +req.params.id;
  if (id === req.session.user.id) flash(req, 'danger', 'No puedes eliminar tu propia cuenta.');
  else { User.remove(id); flash(req, 'success', 'Usuario eliminado.'); }
  res.redirect('/admin/users');
};

// ---------- Movimientos ----------
exports.movements = (req, res) => {
  const type = ['entrada', 'salida'].includes(req.query.type) ? req.query.type : '';
  res.render('admin/movements', { title: 'Movimientos', movements: Movement.all(type), type });
};
