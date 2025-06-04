document.addEventListener('DOMContentLoaded', () => {
    const { db, auth, firebase } = window.fsocietyApp;
    
    const chatArea = document.getElementById('chat-area');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const connectionStatus = document.getElementById('connection-status');
    
    // Set codename from URL parameter or generate random
    const urlParams = new URLSearchParams(window.location.search);
    let codename = urlParams.get('codename') || `Agent-${Math.floor(Math.random() * 1000)}`;
    
    // Firebase realtime listener
    let messagesListener = null;
    
    // Connection status monitoring
    const setConnectionStatus = (connected) => {
        connectionStatus.textContent = connected ? 'Secured' : 'Disconnected';
        connectionStatus.className = connected ? 'connection-status' : 'connection-status disconnected';
    };
    
    // Initialize Firestore connection
    const initChat = () => {
        // Listen for connection status
        db.enableNetwork().then(() => {
            setConnectionStatus(true);
            
            // Listen for new messages
            messagesListener = db.collection("messages")
                .orderBy("timestamp", "asc")
                .onSnapshot(snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === "added") {
                            displayMessage(change.doc.data());
                        }
                    });
                    // Scroll to bottom
                    chatArea.scrollTop = chatArea.scrollHeight;
                }, error => {
                    console.error("Message listener error:", error);
                });
        });
        
        // Handle offline/online status
        const updateNetworkStatus = () => {
            if (navigator.onLine) {
                db.enableNetwork().then(() => setConnectionStatus(true));
            } else {
                setConnectionStatus(false);
            }
        };

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus();
    };
    
    // Display message in chat
    const displayMessage = (message) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        const date = message.timestamp ? message.timestamp.toDate() : new Date();
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="username">${message.user}</span>
                <span class="timestamp">${timeString}</span>
            </div>
            <div class="message-text">${message.text}</div>
        `;
        
        chatArea.appendChild(messageElement);
    };
    
    // Send message to Firestore
    const sendMessage = () => {
        const text = messageInput.value.trim();
        if (text === '') return;
        
        const message = {
            user: codename,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        db.collection("messages").add(message)
            .then(() => {
                messageInput.value = '';
            })
            .catch(error => {
                console.error("Error sending message:", error);
            });
    };
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Initialize chat after authentication
    auth.onAuthStateChanged(user => {
        if (user) {
            initChat();
        }
    });
});