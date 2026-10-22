const db = require('./db');

const Category = {
  all: () => db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products
    FROM categories c ORDER BY c.name`).all(),
  find: (id) => (id ? db.prepare('SELECT * FROM categories WHERE id = ?').get(id) : null),
  create: ({ name, icon, color }) =>
    db.prepare('INSERT INTO categories (name,icon,color) VALUES (?,?,?)')
      .run(name, icon || 'bi-box-seam', color || '#6366f1').lastInsertRowid,
  update: (id, { name, icon, color }) =>
    db.prepare('UPDATE categories SET name=?, icon=?, color=? WHERE id=?')
      .run(name, icon || 'bi-box-seam', color || '#6366f1', id),
  remove: (id) => db.prepare('DELETE FROM categories WHERE id = ?').run(id),
};

module.exports = Category;
