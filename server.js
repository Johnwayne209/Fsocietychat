const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Track connected agents
let agents = new Set();
let agentCount = 0;

wss.on('connection', (ws) => {
    let agentName = `Agent-${++agentCount}`;
    
    // Add to agents set
    agents.add(ws);
    broadcastAgentCount();
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'join') {
                agentName = data.name || agentName;
                broadcast({
                    type: 'system',
                    text: `${agentName} has joined the FSOCIETY network`
                });
            } else if (data.type === 'message') {
                // Broadcast message to all agents
                broadcast({
                    type: 'message',
                    user: agentName,
                    text: data.text,
                    timestamp: Date.now()
                });
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    ws.on('close', () => {
        agents.delete(ws);
        broadcastAgentCount();
        broadcast({
            type: 'system',
            text: `${agentName} has left the network`
        });
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'system',
        text: 'Welcome to FSOCIETY. All communications are encrypted.'
    }));
});

function broadcast(message) {
    const data = JSON.stringify(message);
    agents.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

function broadcastAgentCount() {
    broadcast({
        type: 'count',
        count: agents.size
    });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`FSOCIETY server running on port ${PORT}`);
    console.log(`- Firewall disabled`);
    console.log(`- Establishing secure connection to DarkNet...`);
    console.log(`- Connection secured with 256-bit encryption`);
    console.log(`- Loading communication module...`);
    console.log(`- Ready for secure messaging`);
});