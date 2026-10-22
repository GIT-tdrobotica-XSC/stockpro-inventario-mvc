const bcrypt = require('bcryptjs');
const db = require('./db');

const User = {
  findByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
  findById: (id) => db.prepare('SELECT id,name,email,role,created_at FROM users WHERE id = ?').get(id),
  all: () => db.prepare(`
    SELECT u.id,u.name,u.email,u.role,u.created_at,
      (SELECT COUNT(*) FROM movements m WHERE m.user_id = u.id) AS movements
    FROM users u ORDER BY u.id`).all(),
  count: () => db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
  create({ name, email, password, role = 'user' }) {
    const hash = bcrypt.hashSync(password, 10);
    return db.prepare('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)')
      .run(name, email.toLowerCase(), hash, role).lastInsertRowid;
  },
  verify(email, password) {
    const u = User.findByEmail(String(email).toLowerCase());
    return u && bcrypt.compareSync(password, u.password) ? u : null;
  },
  setRole: (id, role) => db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id),
  remove: (id) => db.prepare('DELETE FROM users WHERE id = ?').run(id),
  adminCount: () => db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='admin'").get().n,
};

module.exports = User;
