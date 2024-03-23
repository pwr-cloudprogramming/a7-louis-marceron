<script lang="ts">
	import Board from '$lib/Board.svelte';
	import PlayersBar from '$lib/PlayersBar.svelte';

	let socket: WebSocket;
	let usernameInput: HTMLInputElement;
	let username = '';

	let inGame = false;
	let inQueue = false;
	let awaitingReplayConfirmation = false;

	let player1Name = '';
	let player2Name = '';
	let player1Score = 0;
	let player2Score = 0;

	let squares: (string | null)[][] = [];
	let currentPlayer: string = '';
	let gameIsOver = false;

	const initializeSocket = (username: string) => {
		socket = new WebSocket(`ws://localhost:8080/tictactoe?username=${username}`);
		attachSocketEventHandlers();
	};

	const attachSocketEventHandlers = () => {
		socket.onopen = () => {
			console.log('Connected to the socket');
			inQueue = true;
		};

		socket.onerror = () => {
			console.error("Couldn't connect to the socket");
			inQueue = false;
			inGame = false;
		};

		socket.onmessage = (event) => {
			processSocketMessage(event);
		};
	};

	const processSocketMessage = (event: MessageEvent) => {
		const message = JSON.parse(event.data);
		const { type } = message;

		console.log('Message:', message);

		if (!type) {
			console.error('Invalid message');
			return;
		}

		switch (type) {
			case 'error':
				console.error('Error:', message.message);
				break;
			case 'opponentDisconnected':
				alert('Your opponent has disconnected. The game is over.');
				resetGame();
				break;
			case 'opponentLeft':
				alert('Your opponent has left the game.');
				resetGame();
				break;
			case 'inProgress':
			case 'gameStart':
				inQueue = false;
				inGame = true;
				awaitingReplayConfirmation = false;
				player1Name = username;
				player2Name = message.opponentName;
				squares = message.squares;
				currentPlayer = message.currentPlayer;
				gameIsOver = false;
				break;
			case 'xPlayerWin':
				gameIsOver = true;
				if (username === player1Name) player1Score++;
				else player2Score++;
				alert('X wins!');
				break;
			case 'oPlayerWin':
				gameIsOver = true;
				if (username === player2Name) player1Score++;
				else player2Score++;
				alert('O wins!');
				break;
			case 'draw':
				gameIsOver = true;
				alert("It's a draw!");
				break;
			default:
				console.warn(`${type} is not a valid message type`);
		}
	};

	const handleJoinQueue = (event: Event) => {
		event.preventDefault();
		username = usernameInput.value.trim();
		if (username) {
			initializeSocket(username);
		}
	};

	const handlePlayTurn = (event: CustomEvent) => {
		if (gameIsOver && !awaitingReplayConfirmation) {
			const wantToReplay = confirm('Game over. Do you want to play again?');
			if (wantToReplay) {
				socket.send(JSON.stringify({ type: 'replayGame', wantsReplay: true }));
				awaitingReplayConfirmation = true;
			} else {
				socket.send(JSON.stringify({ type: 'leaveGame' }));
				resetGame();
			}
		} else if (!gameIsOver) {
			const { row, column } = event.detail;
			socket.send(JSON.stringify({ type: 'playTurn', x: row, y: column }));
		}
	};

	const resetGame = () => {
		inGame = false;
		inQueue = false;
		awaitingReplayConfirmation = false;
		gameIsOver = false;
		player1Name = '';
		player2Name = '';
		squares = [];
		currentPlayer = '';
	};
</script>

{#if inQueue}
	<p>Waiting for an opponent...</p>
{:else if inGame}
	<Board {squares} {currentPlayer} {gameIsOver} on:playTurn={handlePlayTurn} />
	<PlayersBar {player1Name} {player2Name} {player1Score} {player2Score} />
{:else}
	<form>
		<label for="username">Username:</label>
		<input bind:this={usernameInput} type="text" id="username" name="username" required />
		<button type="submit" on:click={handleJoinQueue}>Join queue</button>
	</form>
{/if}

<style>
	input,
	button {
		color: white;
		border: 1px solid white;
	}
</style>

