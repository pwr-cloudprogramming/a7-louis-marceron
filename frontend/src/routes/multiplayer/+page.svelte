<script lang="ts">
	import Board from '$lib/Board.svelte';
	import PlayersBar from '$lib/PlayersBar.svelte';

	let socket: WebSocket;
	let usernameInput: HTMLInputElement;

	let username = 'to replace';

	// Game state
	let inGame = false;
	let inQueue = false;

	// PlayerBar
	let player1Name = 'to replace';
	let player2Name = 'to replace';
	let player1Score = 0;
	let player2Score = 0;

	// Board
	let squares: (string | null)[][];
	let currentPlayer: string;
	let gameIsOver: boolean;

	const handleJoinQueue = (event: Event) => {
		event.preventDefault();
		username = usernameInput.value;
		socket = new WebSocket(`ws://localhost:8080/tictactoe?username=${username}`);

		socket.onopen = () => {
			console.log('Connected to the socket');
			inQueue = true;
		};

		socket.onerror = () => {
			console.log("Couldn't connect to the socket");
			inQueue = false;
			inGame = false;
		};

		socket.onmessage = (event) => {
			// parse message
			const message = JSON.parse(event.data);
			const { type } = message;

			console.log('Message:', message);

			if (!type) {
				console.log('Invalid message');
				return;
			}

			switch (type) {
				case 'error':
					console.log('Error:', message.error);
					break;
				case 'inProgress':
					// Game state
					inQueue = false;
					inGame = true;

					// PlayerBar
					player1Name = username;
					player2Name = message.opponentName;

					// Board
					squares = message.squares;
					currentPlayer = message.currentPlayer;
					gameIsOver = false; // FIXME

					console.log('Game found');
					break;
				default:
					console.log(`${type} is not a valid message type`);
			}
		};
	};

	const handlePlayTurn = (event: CustomEvent) => {
		const { row, column } = event.detail;
		socket.send(JSON.stringify({ type: 'playTurn', x: row, y: column }));
	};
</script>

{#if inQueue}
	<p>Waiting for an opponent...</p>
	<!-- <button>Cancel</button> -->
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
	input {
		color: white;
	}

	button {
		color: white;
	}

	input {
		border: 1px solid white;
	}
</style>
