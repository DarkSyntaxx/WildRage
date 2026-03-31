/**
 * WebRTC P2P Abstraction mapping logical game frames explicitly over direct UDP/TCP conduits 
 * powered by a free signaling broker autonomously tracking connection scopes.
 */
export const NetworkManager = {
    peer: null,
    connection: null,
    isHost: false,
    isConnected: false,
    onDataCallback: null,
    
    initHost(onReady, onConnected) {
        // Generate a 4 character code securely mapping lobbies dynamically
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // Note: PeerJS uses a public broker by default. No server needed!
        this.peer = new Peer(`DOJOFIGHT-${code}`);
        this.isHost = true;
        
        this.peer.on('open', (id) => {
            onReady(code);
        });

        this.peer.on('connection', (conn) => {
            this.connection = conn;
            this.bindConnectionEvents(onConnected);
        });
        
        this.peer.on('error', (err) => {
            console.error("Host Error:", err);
        });
    },

    initClient(code, onConnected, onError) {
        this.peer = new Peer();
        this.isHost = false;
        
        this.peer.on('open', () => {
            this.connection = this.peer.connect(`DOJOFIGHT-${code.toUpperCase()}`);
            
            this.connection.on('open', () => {
                this.bindConnectionEvents(onConnected);
            });
            this.connection.on('error', onError);
        });
        
        this.peer.on('error', onError);
    },

    bindConnectionEvents(onConnected) {
        this.isConnected = true;
        
        // Rapid buffer proxy translating WebRTC frames straight into engine callbacks natively
        this.connection.on('data', (data) => {
            if (this.onDataCallback) this.onDataCallback(data);
        });
        
        this.connection.on('close', () => {
            this.isConnected = false;
            alert("Connection to Opponent Lost!");
            window.location.reload(); 
        });
        
        onConnected();
    },

    /**
     * Pushes generic JSON objects over the WebRTC buffer completely synchronously blocking.
     */
    send(data) {
        if (this.isConnected && this.connection) {
            this.connection.send(data);
        }
    }
};
