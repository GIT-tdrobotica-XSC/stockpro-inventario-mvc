const db = require('./db');

const SELECT = `
  SELECT m.*, p.name AS product, p.sku, u.name AS user
  FROM movements m
  JOIN products p ON p.id = m.product_id
  LEFT JOIN users u ON u.id = m.user_id`;

const Movement = {
  // Registra el movimiento y actualiza el stock de forma atómica
  register({ productId, userId, type, quantity, note }) {
    return db.transaction(() => {
      const p = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
      if (!p) throw new Error('El producto no existe.');
      if (type === 'salida' && quantity > p.stock) {
        throw new Error(`Stock insuficiente: solo hay ${p.stock} unidades disponibles.`);
      }
      const delta = type === 'entrada' ? quantity : -quantity;
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(delta, productId);
      return db.prepare('INSERT INTO movements (product_id,user_id,type,quantity,note) VALUES (?,?,?,?,?)')
        .run(productId, userId, type, quantity, note || '').lastInsertRowid;
    });
  },
  recent: (limit = 8) => db.prepare(`${SELECT} ORDER BY m.created_at DESC, m.id DESC LIMIT ?`).all(limit),
  all: (type = '') => db.prepare(`${SELECT}${type ? ' WHERE m.type = ?' : ''} ORDER BY m.created_at DESC, m.id DESC LIMIT 200`)
    .all(...(type ? [type] : [])),
  byUser: (userId) => db.prepare(`${SELECT} WHERE m.user_id = ? ORDER BY m.created_at DESC, m.id DESC`).all(userId),
  // Últimos 7 días (para la gráfica del dashboard)
  last7days: () => db.prepare(`
    SELECT date(created_at) AS day,
      SUM(CASE WHEN type='entrada' THEN quantity ELSE 0 END) AS entradas,
      SUM(CASE WHEN type='salida' THEN quantity ELSE 0 END) AS salidas
    FROM movements WHERE date(created_at) >= date('now','localtime','-6 days')
    GROUP BY day ORDER BY day`).all(),
};

module.exports = Movement;
