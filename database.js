const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

module.exports = {
    initialize: () => {
        db = new sqlite3.Database(path.join(__dirname, 'fsociety.db'), (err) => {
            if (err) throw err;
            
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                codename TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id),
                FOREIGN KEY (receiver_id) REFERENCES users(id)
            )`);
        });
    },
    
    createUser: (username, codename, password) => {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO users (username, codename, password) VALUES (?, ?, ?)`,
                [username, codename, password],
                function(err) {
                    if (err) return reject(err);
                    resolve({ id: this.lastID, username, codename });
                }
            );
        });
    },
    
    getUserByUsername: (username) => {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT id, username, codename, password FROM users WHERE username = ?`,
                [username],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                }
            );
        });
    },
    
    getAllUsers: () => {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT id, codename FROM users`,
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                }
            );
        });
    },
    
    saveMessage: (message) => {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO messages (sender_id, receiver_id, content, timestamp) VALUES (?, ?, ?, ?)`,
                [message.from, message.to, message.text, new Date(message.timestamp)],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    },
    
    getMessages: (userId, withUserId) => {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT 
                    m.id, 
                    m.sender_id, 
                    m.receiver_id, 
                    m.content, 
                    m.timestamp,
                    u.codename as sender_codename
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE 
                    (sender_id = ? AND receiver_id = ?)
                    OR (sender_id = ? AND receiver_id = ?)
                ORDER BY m.timestamp ASC`,
                [userId, withUserId, withUserId, userId],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows.map(row => ({
                        id: row.id,
                        sender: row.sender_id,
                        receiver: row.receiver_id,
                        text: row.content,
                        timestamp: new Date(row.timestamp).getTime(),
                        codename: row.sender_codename
                    })));
                }
            );
        });
    }
};