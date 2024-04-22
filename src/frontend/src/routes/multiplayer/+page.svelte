<script lang="ts">
	import Board from '$lib/components/Board.svelte';
	import PlayersBar from '$lib/components/PlayersBar.svelte';
	import ReplayButtons from './ReplayButtons.svelte';
	import {
		type ServerMessage,
		type ClientMessage,
		ClientMessageType,
		ServerMessageType,
		GameStatus,
		Mark,
		type GameUpdateMessageData
	} from '../../../../api';

	import { onMount } from 'svelte';

	// We must use dynamic imports inside onMount to avoid SSR errors
	onMount(async () => {
		const module = await import('$env/dynamic/public');
		const env = module.env;
		if (!env) {
			console.error('Environment variables not found');
			return;
		}
	});

	let socket: WebSocket;
	let usernameInput: HTMLInputElement;
	let username = '';
	let backendUrl: string = '';

	let inGame = false;
	let inQueue = false;
	let awaitingReplayConfirmation = false;

	let player1Name = '';
	let player2Name = '';
	let player1Score = 0;
	let player2Score = 0;

	let squares: (Mark | null)[][] = [];
	let canPlay: boolean;
	let gameIsOver: boolean = false;
	let myMark: Mark;

	const initializeSocket = (username: string) => {
		socket = new WebSocket(`ws://${backendUrl}:8080/tictactoe?username=${username}`);
		attachSocketEventHandlers();
	};

	const attachSocketEventHandlers = () => {
		socket.onopen = () => {
			console.log('Connected to the socket');
			inQueue = true;
			socket.send(JSON.stringify({ type: ClientMessageType.JoinQueue }));
		};

		socket.onerror = () => {
			console.error("Couldn't connect to the socket");
			inQueue = false;
			inGame = false;
		};

		socket.onmessage = (event) => {
			processSocketMessage(JSON.parse(event.data));
		};
	};

	const processSocketMessage = (message: ServerMessage) => {
		console.log('Received message:', message);

		if (!message.type) {
			console.error('Invalid message');
			return;
		}

		switch (message.type) {
			case ServerMessageType.GameUpdate: {
				const gameUpdateData = message.data as GameUpdateMessageData;
				if (!gameUpdateData) break;

				inQueue = false;
				inGame = true;
				awaitingReplayConfirmation = false;
				player1Name = username;
				player2Name = gameUpdateData.opponentName;
				squares = gameUpdateData.squares;
				myMark = gameUpdateData.myMark;
				canPlay = gameUpdateData.isCurrentPlayer;
				gameIsOver = gameUpdateData.type !== GameStatus.InProgress;
				break;
			}
			case ServerMessageType.OpponentDisconnected: {
				alert('Your opponent has disconnected. The game is over.');
				resetGame();
				break;
			}
			case ServerMessageType.Error: {
				alert('An error occurred: ' + message.data);
				break;
			}
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
		if (canPlay) {
			const { row, column } = event.detail;
			socket.send(
				JSON.stringify(<ClientMessage>{
					type: ClientMessageType.PlayTurn,
					data: { x: row, y: column }
				})
			);
		}
	};

	const handleReplay = () => {
		socket.send(JSON.stringify(<ClientMessage>{ type: ClientMessageType.ReplayGame }));
		awaitingReplayConfirmation = true;
	};

	const handleLeave = () => {
		socket.send(JSON.stringify(<ClientMessage>{ type: ClientMessageType.LeaveGame }));
		resetGame();
	};

	const resetGame = () => {
		inGame = false;
		inQueue = false;
		awaitingReplayConfirmation = false;
		gameIsOver = false;
		player1Name = '';
		player2Name = '';
		squares = [];
	};
</script>

{#if inQueue}
	<p>Waiting for an opponent...</p>
{:else if inGame}
	<Board {squares} {canPlay} {gameIsOver} on:playTurn={handlePlayTurn} />
	<PlayersBar {player1Name} {player2Name} {player1Score} {player2Score} />
	{#if gameIsOver}
		<ReplayButtons on:replay={handleReplay} on:leave={handleLeave} />
	{/if}
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
		background-color: black;
		padding: 10px;
		margin: 5px;
	}

	form {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	p {
		color: white;
		text-align: center;
	}
</style>
