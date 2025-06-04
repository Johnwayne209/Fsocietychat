const jwt = require('jsonwebtoken');
const db = require('./database');

const SECRET_KEY = 'fsociety-revolution-256bit-secret';

module.exports = {
    authenticateUser: async (username, password) => {
        const user = await db.getUserByUsername(username);
        if (!user) throw new Error('User not found');
        if (user.password !== password) throw new Error('Invalid password');
        
        // Create token
        const token = jwt.sign(
            { id: user.id, codename: user.codename },
            SECRET_KEY,
            { expiresIn: '1h' }
        );
        
        return { token, codename: user.codename, id: user.id };
    },
    
    verifyToken: (token) => {
        return new Promise((resolve, reject) => {
            jwt.verify(token, SECRET_KEY, (err, decoded) => {
                if (err) return reject('Invalid token');
                resolve(decoded);
            });
        });
    }
};