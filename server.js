const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const auth = require('./auth');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Track connected users
const onlineUsers = new Map();

// Initialize database
db.initialize();

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, codename, password } = req.body;
        const user = await db.createUser(username, codename, password);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await auth.authenticateUser(username, password);
        res.json(user);
    } catch (error) {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// WebSocket handling
wss.on('connection', (ws) => {
    let currentUser = null;
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'authenticate':
                    // Verify token and set user
                    auth.verifyToken(data.token).then(user => {
                        currentUser = user;
                        onlineUsers.set(user.id, ws);
                        broadcastOnlineUsers();
                        ws.send(JSON.stringify({
                            type: 'system',
                            text: `Authenticated as ${user.codename}`
                        }));
                    }).catch(() => {
                        ws.close();
                    });
                    break;
                    
                case 'private-message':
                    if (!currentUser) break;
                    
                    const messageData = {
                        type: 'private-message',
                        from: currentUser.id,
                        to: data.to,
                        text: data.text,
                        timestamp: Date.now()
                    };
                    
                    // Save to database
                    db.saveMessage(messageData);
                    
                    // Send to recipient if online
                    if (onlineUsers.has(data.to)) {
                        onlineUsers.get(data.to).send(JSON.stringify({
                            ...messageData,
                            from: currentUser.codename
                        }));
                    }
                    
                    // Send confirmation to sender
                    ws.send(JSON.stringify({
                        type: 'message-sent',
                        to: data.to,
                        timestamp: messageData.timestamp
                    }));
                    break;
                    
                case 'get-messages':
                    if (!currentUser) break;
                    db.getMessages(currentUser.id, data.with)
                        .then(messages => {
                            ws.send(JSON.stringify({
                                type: 'message-history',
                                with: data.with,
                                messages
                            }));
                        });
                    break;
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });
    
    ws.on('close', () => {
        if (currentUser) {
            onlineUsers.delete(currentUser.id);
            broadcastOnlineUsers();
        }
    });
});

function broadcastOnlineUsers() {
    const onlineList = Array.from(onlineUsers.keys());
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'online-users',
                users: onlineList
            }));
        }
    });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`FSOCIETY server running on port ${PORT}`);
    console.log(`- Database initialized`);
    console.log(`- Authentication module active`);
    console.log(`- Secure messaging protocol enabled`);
});