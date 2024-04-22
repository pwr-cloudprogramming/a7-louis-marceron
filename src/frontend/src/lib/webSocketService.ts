import { gameState, initialGameState } from './gameStore';

let socket: WebSocket | null = null;

export const initializeSocket = (username: string) => {
	socket = new WebSocket(`ws://localhost:8080/tictactoe?username=${username}`);
	attachSocketEventHandlers();
};

const attachSocketEventHandlers = () => {
	if (!socket) return;

	socket.onopen = () => {
		gameState.update(state => ({ ...state, inQueue: true }));
	};

	socket.onerror = () => {
		console.error("Couldn't connect to the socket");
		gameState.update(state => ({ ...state, inQueue: false, inGame: false }));
	};

	socket.onmessage = (event) => {
		const message: WebSocketMessage = JSON.parse(event.data);
		processSocketMessage(message);
	};
};

interface GameStartData {
	player1Name: string;
	player2Name: string;
	mark: string;
}

interface ScoreUpdateData {
	player1Score: number;
	player2Score: number;
}

interface GameOverData {
	winner: string;
	squares: (string | null)[][];
}

type MessageData = GameStartData | ScoreUpdateData | GameOverData;

interface WebSocketMessage {
	type: string;
	data?: MessageData;
}

const processSocketMessage = (message: WebSocketMessage) => {
	const { type, data } = message;

	switch (type) {
		case 'gameStart':
			if (data && 'player1Name' in data && 'player2Name' in data && 'mark' in data) {
				gameState.set({
					...initialGameState,
					inGame: true,
					player1Name: data.player1Name,
					player2Name: data.player2Name,
					mark: data.mark
				});
			}
			break;
		case 'scoreUpdate':
			if (data && 'player1Score' in data && 'player2Score' in data) {
				gameState.update(state => ({
					...state,
					player1Score: data.player1Score,
					player2Score: data.player2Score,
				}));
			}
			break;
		case 'gameOver':
			if (data && 'winner' in data && 'squares' in data) {
				gameState.update(state => ({
					...state,
					gameIsOver: true,
					squares: data.squares,
				}));
				alert(`${data.winner} wins!`);
			}
			break;
		case 'error':
			console.error('Error received:', data);
			break;
		default:
			console.warn(`Unhandled message type: ${type}`);
			break;
	}
};

export const sendSocketMessage = (message: object) => {
	if (socket) {
		socket.send(JSON.stringify(message));
	}
};

