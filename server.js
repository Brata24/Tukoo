import { createServer } from 'http';
import { handler } from './build/handler.js';
import { initializeSocketIO } from './build/server/socket.js';

const httpServer = createServer(handler);

// Initialize Socket.IO
initializeSocketIO(httpServer);

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
	console.log(`Server listening on port ${port}`);
	console.log(`Socket.IO enabled`);
});
