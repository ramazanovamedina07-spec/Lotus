const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "lotus.sqlite");
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      gender TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      is_blocked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      UNIQUE(user_id, product_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      city TEXT NOT NULL,
      street TEXT NOT NULL,
      apartment TEXT DEFAULT '',
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
  await ensureColumn("orders", "gift_card_code", "TEXT DEFAULT ''");
  await ensureColumn("orders", "gift_card_amount", "INTEGER NOT NULL DEFAULT 0");

  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS return_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER,
      contact_email TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      slot TEXT NOT NULL,
      goal TEXT NOT NULL,
      consultation_type TEXT NOT NULL,
      is_first_free INTEGER NOT NULL DEFAULT 0,
      price INTEGER NOT NULL DEFAULT 0,
      platform TEXT NOT NULL DEFAULT 'zoom',
      status TEXT NOT NULL DEFAULT 'booked',
      zoom_link TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_consult_free_user
    ON consultations(user_id)
    WHERE is_first_free = 1 AND user_id IS NOT NULL
  `);

  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_consult_free_email
    ON consultations(contact_email)
    WHERE is_first_free = 1
  `);

  await ensureColumn("users", "gender", "TEXT DEFAULT ''");
  await ensureColumn("users", "phone", "TEXT DEFAULT ''");
  await ensureColumn("users", "role", "TEXT NOT NULL DEFAULT 'user'");
  await ensureColumn("users", "is_blocked", "INTEGER NOT NULL DEFAULT 0");

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT DEFAULT '',
      ingredients TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await ensureColumn("products", "composition", "TEXT DEFAULT ''");

  await run(`
    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      test_type TEXT NOT NULL,
      result_key TEXT NOT NULL,
      result_title TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
  await ensureColumn("test_results", "answers_json", "TEXT DEFAULT ''");

  await run(`
    CREATE TABLE IF NOT EXISTS ai_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query_text TEXT NOT NULL,
      top_ingredients TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_percent INTEGER NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      max_uses INTEGER NOT NULL DEFAULT 0,
      used_count INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      initial_amount INTEGER NOT NULL,
      balance INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      purchaser_user_id INTEGER,
      recipient_name TEXT DEFAULT '',
      recipient_email TEXT DEFAULT '',
      message TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      expires_at TEXT DEFAULT '',
      last_used_at TEXT DEFAULT '',
      FOREIGN KEY(purchaser_user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS gift_card_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gift_card_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      user_id INTEGER,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(gift_card_id) REFERENCES gift_cards(id),
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_key TEXT NOT NULL UNIQUE,
      content_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS ingredient_knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_name TEXT NOT NULL UNIQUE,
      notes TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      user_id INTEGER,
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      rating INTEGER NOT NULL,
      review_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_reply TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  await ensureColumn("reviews", "product_id", "INTEGER");

}

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
