const router = require('express').Router();
const { requireLogin, requireAdmin, guestOnly } = require('../middleware/auth');
const auth = require('../controllers/authController');
const catalog = require('../controllers/catalogController');
const admin = require('../controllers/adminController');

// Autenticación
router.get('/login', guestOnly, auth.showLogin);
router.post('/login', guestOnly, auth.login);
router.get('/register', guestOnly, auth.showRegister);
router.post('/register', guestOnly, auth.register);
router.post('/logout', auth.logout);
router.get('/', requireLogin, auth.home);

// Usuario
router.get('/catalog', requireLogin, catalog.index);
router.get('/catalog/:id', requireLogin, catalog.show);
router.post('/catalog/:id/request', requireLogin, catalog.request);
router.get('/my-movements', requireLogin, catalog.mine);

// Administrador
const a = require('express').Router();
a.use(requireLogin, requireAdmin);
a.get('/', admin.dashboard);

a.get('/products', admin.products);
a.get('/products/new', admin.newProduct);
a.post('/products', admin.createProduct);
a.get('/products/:id/edit', admin.editProduct);
a.post('/products/:id', admin.updateProduct);
a.post('/products/:id/delete', admin.deleteProduct);
a.post('/products/:id/stock', admin.adjustStock);

a.get('/categories', admin.categories);
a.post('/categories', admin.saveCategory);
a.post('/categories/:id', admin.saveCategory);
a.post('/categories/:id/delete', admin.deleteCategory);

a.get('/users', admin.users);
a.post('/users/:id/role', admin.setRole);
a.post('/users/:id/delete', admin.deleteUser);

a.get('/movements', admin.movements);

router.use('/admin', a);

module.exports = router;
