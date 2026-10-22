const db = require('./db');

const BASE = `
  SELECT p.*, c.name AS category, c.icon AS icon, c.color AS color
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

const Product = {
  // Listado con búsqueda, filtro por categoría, orden y paginación
  list({ q = '', category = '', sort = 'name', page = 1, perPage = 8 } = {}) {
    const where = [];
    const params = [];
    if (q) {
      where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (category) { where.push('p.category_id = ?'); params.push(category); }
    const w = where.length ? ' WHERE ' + where.join(' AND ') : '';
    const orders = {
      name: 'p.name ASC', price_asc: 'p.price ASC', price_desc: 'p.price DESC',
      stock: 'p.stock ASC', recent: 'p.id DESC',
    };
    const total = db.prepare(`SELECT COUNT(*) AS n FROM products p${w}`).get(...params).n;
    const pages = Math.max(1, Math.ceil(total / perPage));
    page = Math.min(Math.max(1, +page || 1), pages);
    const rows = db.prepare(`${BASE}${w} ORDER BY ${orders[sort] || orders.name} LIMIT ? OFFSET ?`)
      .all(...params, perPage, (page - 1) * perPage);
    return { rows, total, page, pages };
  },
  find: (id) => db.prepare(`${BASE} WHERE p.id = ?`).get(id),
  create(d) {
    return db.prepare(`INSERT INTO products (sku,name,description,category_id,price,stock,min_stock)
      VALUES (?,?,?,?,?,?,?)`)
      .run(d.sku, d.name, d.description || '', d.category_id || null, d.price, d.stock, d.min_stock).lastInsertRowid;
  },
  update(id, d) {
    return db.prepare(`UPDATE products SET sku=?, name=?, description=?, category_id=?, price=?, min_stock=?
      WHERE id=?`)
      .run(d.sku, d.name, d.description || '', d.category_id || null, d.price, d.min_stock, id);
  },
  remove: (id) => db.prepare('DELETE FROM products WHERE id = ?').run(id),
  lowStock: (limit = 6) => db.prepare(`${BASE} WHERE p.stock <= p.min_stock ORDER BY p.stock ASC LIMIT ?`).all(limit),
  stats() {
    return db.prepare(`SELECT
      COUNT(*) AS products,
      COALESCE(SUM(stock),0) AS units,
      COALESCE(SUM(stock*price),0) AS value,
      COALESCE(SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END),0) AS low
      FROM products`).get();
  },
  byCategory: () => db.prepare(`
    SELECT COALESCE(c.name,'Sin categoría') AS name, COALESCE(c.color,'#94a3b8') AS color,
           COALESCE(SUM(p.stock),0) AS units
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    GROUP BY p.category_id ORDER BY units DESC`).all(),
};

module.exports = Product;
