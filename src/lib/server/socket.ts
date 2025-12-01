import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeSocketIO(server: HTTPServer) {
	if (io) return io;

	io = new SocketIOServer(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		},
		path: '/socket.io'
	});

	io.on('connection', (socket) => {
		console.log('Client connected:', socket.id);

		// Store cashier session mapping
		let cashierSessionId: string | null = null;

		// Join merchant-specific room
		socket.on('join-merchant', (merchantId: number) => {
			const room = `merchant-${merchantId}`;
			socket.join(room);
			console.log(`Socket ${socket.id} joined room ${room}`);
		});

		// Register cashier with session ID
		socket.on('register-cashier', (merchantId: number, sessionId: string) => {
			cashierSessionId = sessionId;
			socket.join(`cashier-${sessionId}`);
			console.log(`Cashier registered: ${sessionId} in merchant ${merchantId}`);
		});

		// Join frontview for specific cashier
		socket.on('join-frontview', (merchantId: number, targetCashierSessionId: string) => {
			const room = `cashier-${targetCashierSessionId}`;
			socket.join(room);
			console.log(`Frontview joined cashier room: ${room}`);
		});
		
		// Request current cart state (when frontview connects/refreshes)
		socket.on('request-cart-state', (targetCashierSessionId: string) => {
			const room = `cashier-${targetCashierSessionId}`;
			// Ask the cashier to send their current cart state
			socket.to(room).emit('send-cart-state');
			console.log(`Requested cart state from cashier: ${targetCashierSessionId}`);
		});

		// Leave merchant room
		socket.on('leave-merchant', (merchantId: number) => {
			const room = `merchant-${merchantId}`;
			socket.leave(room);
			console.log(`Socket ${socket.id} left room ${room}`);
		});

		// Handle cart updates from POS (now with cashier session and optional payment info)
		socket.on('cart-updated', (merchantId: number, sessionId: string, cartItems: any[], paymentInfo?: any) => {
			const room = `cashier-${sessionId}`;
			// Broadcast to all clients in the cashier room (frontviews watching this cashier)
			socket.to(room).emit('cart-updated', cartItems, paymentInfo);
			console.log(`Cart updated in room ${room}:`, cartItems.length, 'items', paymentInfo ? `with payment: ${paymentInfo.method}` : '');
		});
		
		// Handle cart state response from cashier
		socket.on('cart-state-response', (sessionId: string, cartItems: any[]) => {
			const room = `cashier-${sessionId}`;
			// Send cart state to the requesting frontview
			socket.to(room).emit('cart-state', cartItems);
			console.log(`Sent cart state to frontview in room ${room}:`, cartItems.length, 'items');
		});

		socket.on('disconnect', () => {
			console.log('Client disconnected:', socket.id);
		});
	});

	return io;
}

export function getSocketIO(): SocketIOServer | null {
	return io;
}

// Helper function to emit cart updates to a merchant's room
export function emitCartUpdate(merchantId: number, cartItems: any[]) {
	if (!io) {
		console.warn('Socket.IO not initialized');
		return;
	}

	const room = `merchant-${merchantId}`;
	io.to(room).emit('cart-updated', cartItems);
	console.log(`Emitted cart update to room ${room}:`, cartItems.length, 'items');
}
