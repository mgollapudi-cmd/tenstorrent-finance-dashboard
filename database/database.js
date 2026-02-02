const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'tenstorrent_leads.db');
let db;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    const signalsTable = `
      CREATE TABLE IF NOT EXISTS signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        url TEXT,
        author TEXT,
        score INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        keywords TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    const responsesTable = `
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        signal_id INTEGER NOT NULL,
        response_text TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (signal_id) REFERENCES signals (id)
      )
    `;
    
    db.serialize(() => {
      db.run(signalsTable, (err) => {
        if (err) {
          console.error('Error creating signals table:', err);
          reject(err);
          return;
        }
      });
      
      db.run(responsesTable, (err) => {
        if (err) {
          console.error('Error creating responses table:', err);
          reject(err);
          return;
        }
      });
      
      console.log('Database tables created successfully');
      resolve();
    });
  });
}

function saveSignal(signal) {
  return new Promise((resolve, reject) => {
    const { platform, title, content, url, author, score, comments_count, priority, keywords } = signal;
    
    const query = `
      INSERT INTO signals (platform, title, content, url, author, score, comments_count, priority, keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [platform, title, content, url, author, score, comments_count, priority, keywords], function(err) {
      if (err) {
        console.error('Error saving signal:', err);
        reject(err);
        return;
      }
      
      resolve({ id: this.lastID, ...signal });
    });
  });
}

function saveResponse(signalId, responseText) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO responses (signal_id, response_text) VALUES (?, ?)';
    
    db.run(query, [signalId, responseText], function(err) {
      if (err) {
        console.error('Error saving response:', err);
        reject(err);
        return;
      }
      
      resolve({ id: this.lastID, signal_id: signalId, response_text: responseText });
    });
  });
}

function getSignals() {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM signals ORDER BY created_at DESC LIMIT 100';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching signals:', err);
        reject(err);
        return;
      }
      
      resolve(rows);
    });
  });
}

function getResponses() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT r.*, s.title, s.platform 
      FROM responses r 
      JOIN signals s ON r.signal_id = s.id 
      ORDER BY r.generated_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching responses:', err);
        reject(err);
        return;
      }
      
      resolve(rows);
    });
  });
}

function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

module.exports = {
  initializeDatabase,
  saveSignal,
  saveResponse,
  getSignals,
  getResponses,
  closeDatabase
};
