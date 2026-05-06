import { Capacitor } from '@capacitor/core';
import { SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'mdnotes_db';
const platform = Capacitor.getPlatform();

class DatabaseService {
  constructor() {
    this.sqlite = null;
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      this.sqlite = new SQLiteConnection(window.CapacitorSQLite);
      
      // On web, we need to handle the store
      if (platform === 'web') {
        // We'll fallback to localStorage for web to simplify the dev experience
        // since setting up jeep-sqlite requires extra assets/workers.
        console.log('Using localStorage fallback for web development');
        this.isInitialized = true;
        return;
      }

      this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
      await this.db.open();

      // Create tables
      const schema = `
        CREATE TABLE IF NOT EXISTS docs (
          id TEXT PRIMARY KEY,
          title TEXT,
          content TEXT,
          lastModified INTEGER,
          accentColor TEXT,
          type TEXT DEFAULT 'markdown'
        );
        CREATE TABLE IF NOT EXISTS preferences (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `;
      await this.db.execute(schema);
      
      // Migration for existing databases
      try {
        await this.db.execute(`ALTER TABLE docs ADD COLUMN type TEXT DEFAULT 'markdown'`);
      } catch (e) {
        // Column probably already exists
      }
      
      this.isInitialized = true;
      console.log('SQLite Database initialized successfully');
    } catch (err) {
      console.error('Database initialization failed:', err);
      // Fallback to localStorage if SQLite fails
      this.isInitialized = true;
    }
  }

  // --- Docs CRUD ---

  async getDocs() {
    if (!this.db) {
      return JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
    }

    const res = await this.db.query('SELECT * FROM docs ORDER BY lastModified DESC');
    return res.values || [];
  }

  async saveDoc(doc) {
    if (!this.db) {
      const docs = await this.getDocs();
      const existingIndex = docs.findIndex(d => d.id === doc.id);
      if (existingIndex > -1) {
        docs[existingIndex] = doc;
      } else {
        docs.push(doc);
      }
      localStorage.setItem('readmeMaker_docs', JSON.stringify(docs));
      return;
    }

    const { id, title, content, lastModified, accentColor, type = 'markdown' } = doc;
    const sql = `INSERT OR REPLACE INTO docs (id, title, content, lastModified, accentColor, type) VALUES (?, ?, ?, ?, ?, ?)`;
    await this.db.run(sql, [id, title, content, lastModified, accentColor, type]);
  }

  async deleteDocs(ids) {
    if (!this.db) {
      const docs = await this.getDocs();
      const newDocs = docs.filter(d => !ids.includes(d.id));
      localStorage.setItem('readmeMaker_docs', JSON.stringify(newDocs));
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    await this.db.run(`DELETE FROM docs WHERE id IN (${placeholders})`, ids);
  }

  async getDocById(id) {
    if (!this.db) {
      const docs = await this.getDocs();
      return docs.find(d => d.id === id);
    }

    const res = await this.db.query('SELECT * FROM docs WHERE id = ?', [id]);
    return res.values && res.values.length > 0 ? res.values[0] : null;
  }

  // --- Preferences CRUD ---

  async getPreference(key, defaultValue) {
    if (!this.db) {
      return localStorage.getItem(key) || defaultValue;
    }

    const res = await this.db.query('SELECT value FROM preferences WHERE key = ?', [key]);
    return res.values && res.values.length > 0 ? res.values[0].value : defaultValue;
  }

  async setPreference(key, value) {
    if (!this.db) {
      localStorage.setItem(key, value);
      return;
    }

    await this.db.run('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', [key, value]);
  }

  // --- Migration ---

  async migrateFromLocalStorage() {
    const hasMigrated = localStorage.getItem('mdnotes_sqlite_migrated');
    if (hasMigrated || !this.db) return;

    console.log('Starting migration from localStorage to SQLite...');
    
    // Migrate Docs
    const oldDocs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
    for (const doc of oldDocs) {
      await this.saveDoc(doc);
    }

    // Migrate Preferences
    const prefs = localStorage.getItem('mdnotes_preferences');
    if (prefs) await this.setPreference('mdnotes_preferences', prefs);

    const theme = localStorage.getItem('mdnotes_theme');
    if (theme) await this.setPreference('mdnotes_theme', theme);

    const accent = localStorage.getItem('mdnotes_global_accent');
    if (accent) await this.setPreference('mdnotes_global_accent', accent);

    const onboarded = localStorage.getItem('mdnotes_onboarded');
    if (onboarded) await this.setPreference('mdnotes_onboarded', onboarded);

    localStorage.setItem('mdnotes_sqlite_migrated', 'true');
    console.log('Migration completed');
  }
  // --- Data Management ---

  async getDatabaseSize() {
    if (!this.db) {
      const docs = JSON.parse(localStorage.getItem('readmeMaker_docs') || '[]');
      const size = JSON.stringify(docs).length;
      return this.formatBytes(size);
    }

    try {
      const res = await this.db.query('SELECT SUM(LENGTH(content) + LENGTH(title)) as total FROM docs');
      const size = res.values && res.values[0].total ? res.values[0].total : 0;
      return this.formatBytes(size);
    } catch (e) {
      return '0 KB';
    }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async resetDatabase() {
    if (!this.db) {
      localStorage.clear();
      window.location.reload();
      return;
    }

    await this.db.execute('DELETE FROM docs');
    await this.db.execute('DELETE FROM preferences');
    localStorage.clear();
    window.location.reload();
  }

  async exportData() {
    const docs = await this.getDocs();
    const theme = await this.getPreference('mdnotes_theme', 'light');
    const accent = await this.getPreference('mdnotes_global_accent', '#000000');
    const prefs = await this.getPreference('mdnotes_preferences', '{}');

    const backup = {
      docs,
      settings: {
        theme,
        accent,
        prefs: JSON.parse(prefs)
      },
      exportDate: Date.now(),
      version: '1.0'
    };

    return JSON.stringify(backup);
  }

  async importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.docs) throw new Error('Invalid backup file');

      // Import Docs
      for (const doc of data.docs) {
        await this.saveDoc(doc);
      }

      // Import Settings if present
      if (data.settings) {
        if (data.settings.theme) await this.setPreference('mdnotes_theme', data.settings.theme);
        if (data.settings.accent) await this.setPreference('mdnotes_global_accent', data.settings.accent);
        if (data.settings.prefs) await this.setPreference('mdnotes_preferences', JSON.stringify(data.settings.prefs));
      }

      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
}

const db = new DatabaseService();
export default db;
