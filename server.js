import { createServer } from 'http';
import { handler } from './build/handler.js';
import { Server as SocketIOServer } from 'socket.io';

const httpServer = createServer(handler);

// Initialize Socket.IO
function initializeSocketIO(server) {
	const io = new SocketIOServer(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		},
		path: '/socket.io'
	});

	io.on('connection', (socket) => {
		console.log('Client connected:', socket.id);

		let cashierSessionId = null;

		socket.on('join-merchant', (merchantId) => {
			const room = `merchant-${merchantId}`;
			socket.join(room);
			console.log(`Socket ${socket.id} joined room ${room}`);
		});

		socket.on('register-cashier', (merchantId, sessionId) => {
			cashierSessionId = sessionId;
			const room = `cashier-${sessionId}`;
			socket.join(room);
			console.log(`Cashier ${socket.id} registered with session ${sessionId} in room ${room}`);
		});

		socket.on('join-frontview', (merchantId, sessionId) => {
			const room = `cashier-${sessionId}`;
			socket.join(room);
			console.log(`Frontview ${socket.id} joined cashier room ${room}`);
		});

		socket.on('request-cart-state', (sessionId) => {
			console.log(`Frontview requesting cart state from session ${sessionId}`);
			io.to(`cashier-${sessionId}`).emit('send-cart-state');
		});

		socket.on('cart-state-response', (sessionId, items, payment) => {
			console.log(`Cashier responding with cart state for session ${sessionId}:`, items.length, 'items');
			io.to(`cashier-${sessionId}`).emit('cart-state', items, payment);
		});

		socket.on('cart-updated', (merchantId, items, payment) => {
			if (cashierSessionId) {
				const room = `cashier-${cashierSessionId}`;
				console.log(`Broadcasting cart update to room ${room}:`, items.length, 'items', payment ? 'with payment' : 'no payment');
				io.to(room).emit('cart-updated', items, payment);
			}
		});

		socket.on('disconnect', () => {
			console.log('Client disconnected:', socket.id);
		});
	});

	return io;
}

const io = initializeSocketIO(httpServer);

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
	console.log(`Server listening on port ${port}`);
	console.log(`Socket.IO enabled`);
});
