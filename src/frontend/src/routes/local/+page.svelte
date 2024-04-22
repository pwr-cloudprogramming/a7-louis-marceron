<script lang="ts">
	import { GameStatus, TicTacToe } from './tictactoe';
	import Board from '$lib/components/Board.svelte';
	import PlayersBar from '$lib/components/PlayersBar.svelte';

	const game = new TicTacToe();
	let player1Score = 0;
	let player2Score = 0;
	let gameIsOver = false;

	let squares = game.boardWithXandO;
	let currentPlayer = game.currentPlayer.mark;
	let gameStatus = game.gameStatus;

	const handlePlayTurn = (event: CustomEvent) => {
		// TODO handle errors
		game.playTurn(event.detail.row, event.detail.column);

		if (game.gameStatus === GameStatus.player1Wins) {
			player1Score++;
			gameIsOver = true;
		} else if (game.gameStatus === GameStatus.player2Wins) {
			player2Score++;
			gameIsOver = true;
		} else if (game.gameStatus === GameStatus.draw) {
			gameIsOver = true;
		}

		squares = game.boardWithXandO;
		currentPlayer = game.currentPlayer.mark;
		gameStatus = game.gameStatus;
	};

	const handleReset = () => {
		game.reset();
		squares = game.boardWithXandO;
		currentPlayer = game.currentPlayer.mark;
		gameStatus = game.gameStatus;
		gameIsOver = false;
	};
</script>

<svelte:head>
	<title>Local game | TicTacToe</title>
</svelte:head>

<div id="board">
	<Board {gameIsOver} {squares} canPlay={true} on:playTurn={handlePlayTurn} />
</div>

{#if gameStatus === GameStatus.inProgress}
	<p>It's {currentPlayer}'s turn</p>
{/if}

{#if gameStatus === GameStatus.player1Wins}
	<p>Player 1 wins!</p>
{/if}
{#if gameStatus === GameStatus.player2Wins}
	<p>Player 2 wins!</p>
{/if}
{#if gameStatus === GameStatus.draw}
	<p>It's a draw!</p>
{/if}
{#if gameStatus !== GameStatus.inProgress}
	<button on:click={handleReset}>Play again</button>
{/if}

<PlayersBar {player1Score} {player2Score} />

<style>
	#board {
		display: flex;
		flex-grow: 1;
		justify-content: center;
		align-items: center;
	}
</style>
