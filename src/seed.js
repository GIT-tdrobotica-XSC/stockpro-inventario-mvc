// Datos de demostración (se cargan solo si la base está vacía)
const db = require('./models/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Movement = require('./models/Movement');

function ensure() {
  if (User.count() > 0) return;

  const admin = User.create({ name: 'Administrador', email: 'admin@stockpro.com', password: 'admin123', role: 'admin' });
  const user = User.create({ name: 'Laura Gómez', email: 'user@stockpro.com', password: 'user123' });

  const cats = {};
  [
    ['Computación', 'bi-laptop', '#6366f1'],
    ['Periféricos', 'bi-mouse', '#06b6d4'],
    ['Redes', 'bi-router', '#10b981'],
    ['Robótica', 'bi-cpu', '#f59e0b'],
    ['Oficina', 'bi-printer', '#ec4899'],
  ].forEach(([name, icon, color]) => { cats[name] = Category.create({ name, icon, color }); });

  const items = [
    ['LAP-001', 'Portátil Lenovo ThinkPad E14', 'Intel i5, 16GB RAM, SSD 512GB', 'Computación', 3200000, 12, 4],
    ['LAP-002', 'Portátil HP ProBook 450', 'Intel i7, 16GB RAM, SSD 1TB', 'Computación', 4100000, 3, 4],
    ['MON-001', 'Monitor Samsung 24" Full HD', 'Panel IPS 75Hz, HDMI', 'Periféricos', 520000, 25, 6],
    ['TEC-001', 'Teclado mecánico Redragon', 'Switch azul, retroiluminado', 'Periféricos', 135000, 40, 10],
    ['MOU-001', 'Mouse inalámbrico Logitech M185', 'Receptor USB, 12 meses de batería', 'Periféricos', 55000, 4, 8],
    ['CAM-001', 'Cámara web Logitech C920', '1080p con micrófono estéreo', 'Periféricos', 290000, 15, 5],
    ['RED-001', 'Router TP-Link Archer AX10', 'Wi-Fi 6, doble banda', 'Redes', 240000, 18, 5],
    ['RED-002', 'Switch 8 puertos Gigabit', 'No administrable, metálico', 'Redes', 95000, 2, 5],
    ['ROB-001', 'Arduino UNO R3', 'Placa original con cable USB', 'Robótica', 85000, 30, 10],
    ['ROB-002', 'Raspberry Pi 5 (8GB)', 'Incluye fuente oficial', 'Robótica', 540000, 8, 3],
    ['ROB-003', 'Kit de sensores 37 en 1', 'Compatible con Arduino y Pi', 'Robótica', 120000, 14, 4],
    ['OFI-001', 'Impresora Epson EcoTank L3250', 'Multifuncional con sistema continuo', 'Oficina', 780000, 6, 3],
    ['OFI-002', 'Resma de papel carta (500 hojas)', 'Papel 75g blanco', 'Oficina', 18000, 120, 30],
  ];
  for (const [sku, name, description, cat, price, stock, min_stock] of items) {
    const id = Product.create({ sku, name, description, category_id: cats[cat], price, stock: 0, min_stock });
    Movement.register({ productId: id, userId: admin, type: 'entrada', quantity: stock + 6, note: 'Stock inicial' });
    Movement.register({ productId: id, userId: user, type: 'salida', quantity: 6, note: 'Retiro de ejemplo' });
  }
  // Reparte los movimientos en los últimos 7 días para que la gráfica se vea bien
  db.exec("UPDATE movements SET created_at = datetime('now','localtime', '-' || (id % 7) || ' days')");
  console.log('Datos de demostración cargados.');
}

module.exports = { ensure };
if (require.main === module) ensure();
