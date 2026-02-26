import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.VERCEL ? path.join('/tmp', 'assets.db') : "assets.db";
console.log(`Using database at: ${dbPath}`);
const db = new Database(dbPath);

// Initialize Database & Migrations
const initDb = () => {
  console.log("Initializing database schema...");
  db.exec(`
    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS config_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'country' or 'currency'
      value TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS fx_rates (
      base_currency TEXT NOT NULL,
      target_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (base_currency, target_currency)
    );
  `);

  // Migration: Handle transition from single-account banks to multi-account banks
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    const accountsExists = tables.find(t => t.name === 'accounts') !== undefined;
    
    if (accountsExists) {
      const accountCols = db.prepare("PRAGMA table_info(accounts)").all() as any[];
      const isOldSchema = accountCols.find(c => c.name === 'owner_id') !== undefined;

      if (isOldSchema) {
        console.log("Migrating to multi-account schema...");
        
        // 1. Rename old accounts to a temporary name
        db.exec("ALTER TABLE accounts RENAME TO old_accounts_migration");
        
        // 2. Create new tables
        db.exec(`
          CREATE TABLE banks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            bank_name TEXT,
            logo_color TEXT DEFAULT '#3b82f6',
            country TEXT DEFAULT 'USA',
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
          );

          CREATE TABLE accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'Bank',
            account_number TEXT,
            FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS balance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            balance REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            comment TEXT,
            recorded_at DATETIME NOT NULL,
            FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
          );
        `);

        // 3. Migrate data
        const oldData = db.prepare("SELECT * FROM old_accounts_migration").all() as any[];
        for (const row of oldData) {
          // Insert into banks
          const bankResult = db.prepare(`
            INSERT INTO banks (owner_id, name, bank_name, logo_color, country, last_updated)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(row.owner_id, row.name, row.bank_name, row.logo_color, row.country, row.last_updated);
          
          const bankId = bankResult.lastInsertRowid;
          
          // Create a default account for this bank
          const accountResult = db.prepare(`
            INSERT INTO accounts (bank_id, name, type, account_number)
            VALUES (?, ?, ?, ?)
          `).run(bankId, "Default Account", row.type || 'Bank', row.account_number);
          
          const newAccountId = accountResult.lastInsertRowid;
          
          // Update logs to point to the new account
          db.prepare("UPDATE balance_logs SET account_id = ? WHERE account_id = ?").run(newAccountId, row.id);
        }
        
        // 4. Drop temporary table
        db.exec("DROP TABLE old_accounts_migration");
        
        console.log("Migration completed successfully.");
      }
    }

    // Ensure all tables exist for fresh installs
    db.exec(`
      CREATE TABLE IF NOT EXISTS banks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        bank_name TEXT,
        logo_color TEXT DEFAULT '#3b82f6',
        country TEXT DEFAULT 'USA',
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'Bank',
        account_number TEXT,
        FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS balance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        balance REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        comment TEXT,
        recorded_at DATETIME NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );
    `);

    // Ensure comment column exists (from previous migration)
    const logCols = db.prepare("PRAGMA table_info(balance_logs)").all() as any[];
    if (!logCols.find(c => c.name === 'comment')) {
      db.exec("ALTER TABLE balance_logs ADD COLUMN comment TEXT");
    }
  } catch (e) {
    console.error("Migration error:", e);
  }

  // Seed initial data
  const ownerCount = db.prepare("SELECT COUNT(*) as count FROM owners").get() as { count: number };
  if (ownerCount.count === 0) {
    console.log("Seeding default owner...");
    db.prepare("INSERT INTO owners (name) VALUES (?)").run("Me");
  }

  const configCount = db.prepare("SELECT COUNT(*) as count FROM config_options").get() as { count: number };
  if (configCount.count === 0) {
    console.log("Seeding default config options...");
    ['USA', 'China', 'Hong Kong'].forEach(c => db.prepare("INSERT INTO config_options (type, value) VALUES ('country', ?)").run(c));
    ['USD', 'CNY', 'HKD'].forEach(c => db.prepare("INSERT INTO config_options (type, value) VALUES ('currency', ?)").run(c));
  }

  // Demo Data Seeding
  const bankCount = db.prepare("SELECT COUNT(*) as count FROM banks").get() as { count: number };
  if (bankCount.count === 0) {
    console.log("Seeding demo data...");
    const owner = db.prepare("SELECT id FROM owners LIMIT 1").get() as { id: number };
    if (owner) {
      // Bank 1: Chase
      const chaseResult = db.prepare(`
        INSERT INTO banks (owner_id, name, bank_name, logo_color, country)
        VALUES (?, 'Chase Main', 'Chase Bank', '#117aca', 'USA')
      `).run(owner.id);
      const chaseId = chaseResult.lastInsertRowid;

      const chaseAcc1 = db.prepare(`
        INSERT INTO accounts (bank_id, name, type, account_number)
        VALUES (?, 'Checking', 'Bank', '**** 1234')
      `).run(chaseId).lastInsertRowid;

      const chaseAcc2 = db.prepare(`
        INSERT INTO accounts (bank_id, name, type, account_number)
        VALUES (?, 'Savings', 'Bank', '**** 5678')
      `).run(chaseId).lastInsertRowid;

      // Logs for Chase
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      db.prepare("INSERT INTO balance_logs (account_id, balance, currency, comment, recorded_at) VALUES (?, ?, 'USD', 'Initial deposit', ?)").run(chaseAcc1, 5000, twoMonthsAgo);
      db.prepare("INSERT INTO balance_logs (account_id, balance, currency, comment, recorded_at) VALUES (?, ?, 'USD', 'Salary', ?)").run(chaseAcc1, 7500, oneMonthAgo);
      db.prepare("INSERT INTO balance_logs (account_id, balance, currency, comment, recorded_at) VALUES (?, ?, 'USD', 'Current balance', ?)").run(chaseAcc1, 8200, now.toISOString());

      db.prepare("INSERT INTO balance_logs (account_id, balance, currency, comment, recorded_at) VALUES (?, ?, 'USD', 'Initial savings', ?)").run(chaseAcc2, 10000, oneMonthAgo);
      db.prepare("INSERT INTO balance_logs (account_id, balance, currency, comment, recorded_at) VALUES (?, ?, 'USD', 'Interest', ?)").run(chaseAcc2, 10050, now.toISOString());

      // Bank 2: HSBC
      const hsbcResult = db.prepare(`
        INSERT INTO banks (owner_id, name, bank_name, logo_color, country)
        VALUES (?, 'HSBC HK', 'HSBC', '#db0011', 'Hong Kong')
      `).run(owner.id);
      const hsbcId = hsbcResult.lastInsertRowid;

      const hsbcAcc = db.prepare(`
        INSERT INTO accounts (bank_id, name, type, account_number)
        VALUES (?, 'HKD Savings', 'Bank', '**** 9999')
      `).run(hsbcId).lastInsertRowid;

      db.prepare("INSERT INTO balance_logs (account_id, balance, currency, comment, recorded_at) VALUES (?, ?, 'HKD', 'Savings', ?)").run(hsbcAcc, 50000, now.toISOString());
    }
  }
  console.log("Database initialization complete.");
};

try {
  initDb();
} catch (e) {
  console.error("Critical: Database initialization failed:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: dbPath });
  });

  // --- API Routes ---

  // Config Options
  app.get("/api/config", (req, res) => {
    const countries = db.prepare("SELECT value FROM config_options WHERE type = 'country'").all().map((r: any) => r.value);
    const currencies = db.prepare("SELECT value FROM config_options WHERE type = 'currency'").all().map((r: any) => r.value);
    res.json({ countries, currencies });
  });

  app.post("/api/config", (req, res) => {
    const { type, value } = req.body;
    try {
      db.prepare("INSERT INTO config_options (type, value) VALUES (?, ?)").run(type, value);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Option already exists" });
    }
  });

  app.delete("/api/config", (req, res) => {
    const { type, value } = req.body;
    db.prepare("DELETE FROM config_options WHERE type = ? AND value = ?").run(type, value);
    res.json({ success: true });
  });

  // FX Rates
  app.get("/api/fx-rates", (req, res) => {
    const rates = db.prepare("SELECT * FROM fx_rates").all();
    res.json(rates);
  });

  app.post("/api/fx-rates", (req, res) => {
    const { rates } = req.body; // Array of { base, target, rate }
    const insert = db.prepare("INSERT OR REPLACE INTO fx_rates (base_currency, target_currency, rate, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)");
    const transaction = db.transaction((ratesList) => {
      for (const r of ratesList) insert.run(r.base, r.target, r.rate);
    });
    transaction(rates);
    res.json({ success: true });
  });

  // Owners
  app.get("/api/owners", (req, res) => {
    const owners = db.prepare("SELECT * FROM owners").all();
    res.json(owners);
  });

  app.post("/api/owners", (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO owners (name) VALUES (?)").run(name);
      res.json({ id: result.lastInsertRowid, name });
    } catch (e) {
      res.status(400).json({ error: "Owner already exists" });
    }
  });

  app.delete("/api/owners/:id", (req, res) => {
    db.prepare("DELETE FROM owners WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Banks (Main Entities)
  app.get("/api/accounts", (req, res) => {
    const banks = db.prepare(`
      SELECT b.*, o.name as owner_name,
      (SELECT SUM(last_balances.balance) FROM (
        SELECT bl.balance FROM balance_logs bl
        JOIN accounts a ON bl.account_id = a.id
        WHERE a.bank_id = b.id
        AND bl.recorded_at = (SELECT MAX(recorded_at) FROM balance_logs WHERE account_id = a.id)
      ) as last_balances) as total_balance
      FROM banks b
      JOIN owners o ON b.owner_id = o.id
      ORDER BY b.last_updated DESC
    `).all();
    res.json(banks);
  });

  app.get("/api/accounts/:id", (req, res) => {
    const bank = db.prepare(`
      SELECT b.*, o.name as owner_name
      FROM banks b
      JOIN owners o ON b.owner_id = o.id
      WHERE b.id = ?
    `).get(req.params.id) as any;
    
    if (!bank) return res.status(404).json({ error: "Bank not found" });
    
    const accounts = db.prepare("SELECT * FROM accounts WHERE bank_id = ?").all(req.params.id) as any[];
    
    for (const acc of accounts) {
      acc.logs = db.prepare("SELECT * FROM balance_logs WHERE account_id = ? ORDER BY recorded_at DESC").all(acc.id);
    }
    
    res.json({ ...bank, accounts });
  });

  app.post("/api/accounts", (req, res) => {
    const { owner_id, name, bank_name, logo_color, country } = req.body;
    const result = db.prepare(`
      INSERT INTO banks (owner_id, name, bank_name, logo_color, country)
      VALUES (?, ?, ?, ?, ?)
    `).run(owner_id, name, bank_name, logo_color, country || 'USA');
    
    const bankId = result.lastInsertRowid;
    
    // Create a default account for the new bank
    db.prepare(`
      INSERT INTO accounts (bank_id, name, type)
      VALUES (?, ?, ?)
    `).run(bankId, "Default Account", "Bank");

    res.json({ id: bankId });
  });

  app.put("/api/accounts/:id", (req, res) => {
    const { name, bank_name, logo_color, owner_id, country } = req.body;
    db.prepare(`
      UPDATE banks 
      SET name = ?, bank_name = ?, logo_color = ?, owner_id = ?, country = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, bank_name, logo_color, owner_id, country, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/accounts/:id", (req, res) => {
    db.prepare("DELETE FROM banks WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Sub-Accounts
  app.post("/api/sub-accounts", (req, res) => {
    const { bank_id, name, type, account_number } = req.body;
    const result = db.prepare(`
      INSERT INTO accounts (bank_id, name, type, account_number)
      VALUES (?, ?, ?, ?)
    `).run(bank_id, name, type || 'Bank', account_number);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/sub-accounts/:id", (req, res) => {
    const { name, type, account_number } = req.body;
    db.prepare(`
      UPDATE accounts SET name = ?, type = ?, account_number = ?
      WHERE id = ?
    `).run(name, type, account_number, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/sub-accounts/:id", (req, res) => {
    db.prepare("DELETE FROM accounts WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Logs
  app.post("/api/logs", (req, res) => {
    const { account_id, balance, currency, comment, recorded_at } = req.body;
    const result = db.prepare(`
      INSERT INTO balance_logs (account_id, balance, currency, comment, recorded_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(account_id, balance, currency || 'USD', comment, recorded_at);
    
    // Update bank last_updated
    db.prepare(`
      UPDATE banks SET last_updated = CURRENT_TIMESTAMP 
      WHERE id = (SELECT bank_id FROM accounts WHERE id = ?)
    `).run(account_id);
    
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/logs/:id", (req, res) => {
    const { balance, currency, comment, recorded_at } = req.body;
    const log = db.prepare("SELECT account_id FROM balance_logs WHERE id = ?").get(req.params.id) as { account_id: number };
    
    db.prepare(`
      UPDATE balance_logs 
      SET balance = ?, currency = ?, comment = ?, recorded_at = ?
      WHERE id = ?
    `).run(balance, currency, comment, recorded_at, req.params.id);
    
    if (log) {
      db.prepare(`
        UPDATE banks SET last_updated = CURRENT_TIMESTAMP 
        WHERE id = (SELECT bank_id FROM accounts WHERE id = ?)
      `).run(log.account_id);
    }
    
    res.json({ success: true });
  });

  app.delete("/api/logs/:id", (req, res) => {
    const log = db.prepare("SELECT account_id FROM balance_logs WHERE id = ?").get(req.params.id) as { account_id: number };
    db.prepare("DELETE FROM balance_logs WHERE id = ?").run(req.params.id);
    if (log) {
       db.prepare(`
         UPDATE banks SET last_updated = CURRENT_TIMESTAMP 
         WHERE id = (SELECT bank_id FROM accounts WHERE id = ?)
       `).run(log.account_id);
    }
    res.json({ success: true });
  });

  // Bulk Import/Export
  app.get("/api/export", (req, res) => {
    const owners = db.prepare("SELECT * FROM owners").all();
    const banks = db.prepare("SELECT * FROM banks").all();
    const accounts = db.prepare("SELECT * FROM accounts").all();
    const logs = db.prepare("SELECT * FROM balance_logs").all();
    res.json({ owners, banks, accounts, logs });
  });

  app.post("/api/import", (req, res) => {
    const { owners, banks, accounts, logs } = req.body;
    
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM balance_logs").run();
      db.prepare("DELETE FROM accounts").run();
      db.prepare("DELETE FROM banks").run();
      db.prepare("DELETE FROM owners").run();

      for (const owner of owners) {
        db.prepare("INSERT INTO owners (id, name) VALUES (?, ?)").run(owner.id, owner.name);
      }

      for (const bank of banks) {
        db.prepare(`
          INSERT INTO banks (id, owner_id, name, bank_name, logo_color, country, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(bank.id, bank.owner_id, bank.name, bank.bank_name, bank.logo_color, bank.country, bank.last_updated);
      }

      for (const acc of accounts) {
        db.prepare(`
          INSERT INTO accounts (id, bank_id, name, type, account_number)
          VALUES (?, ?, ?, ?, ?)
        `).run(acc.id, acc.bank_id, acc.name, acc.type, acc.account_number);
      }

      for (const log of logs) {
        db.prepare(`
          INSERT INTO balance_logs (id, account_id, balance, currency, comment, recorded_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(log.id, log.account_id, log.balance, log.currency, log.comment, log.recorded_at);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Import failed" });
    }
  });

  app.post("/api/reset", (req, res) => {
    try {
      const transaction = db.transaction(() => {
        db.prepare("DELETE FROM balance_logs").run();
        db.prepare("DELETE FROM accounts").run();
        db.prepare("DELETE FROM banks").run();
        db.prepare("DELETE FROM fx_rates").run();
        db.prepare("DELETE FROM owners").run();
        db.prepare("DELETE FROM config_options").run();

        // Re-seed basic config
        db.prepare("INSERT INTO owners (name) VALUES (?)").run("Me");
        ['USA', 'China', 'Hong Kong'].forEach(c => db.prepare("INSERT INTO config_options (type, value) VALUES ('country', ?)").run(c));
        ['USD', 'CNY', 'HKD'].forEach(c => db.prepare("INSERT INTO config_options (type, value) VALUES ('currency', ?)").run(c));
      });
      transaction();
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Reset failed" });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const app = await startServer();
export default app;
