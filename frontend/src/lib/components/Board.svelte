<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import cross from '$lib/assets/cross.svg';
	import circle from '$lib/assets/circle.svg';
	const dispatch = createEventDispatcher();

	export let squares: (string | null)[][];
	export let canPlay: boolean;
	export let gameIsOver = false;
	let winningSquares: number[][];

	const checkForWinner = () => {
		// Check rows, columns, and diagonals
		for (let i = 0; i < 3; i++) {
			if (squares[i][0] && squares[i][0] === squares[i][1] && squares[i][0] === squares[i][2]) {
				winningSquares = [
					[i, 0],
					[i, 1],
					[i, 2]
				];
				return squares[i][0];
			}
			if (squares[0][i] && squares[0][i] === squares[1][i] && squares[0][i] === squares[2][i]) {
				winningSquares = [
					[0, i],
					[1, i],
					[2, i]
				];
				return squares[0][i];
			}
		}
		if (squares[0][0] && squares[0][0] === squares[1][1] && squares[0][0] === squares[2][2]) {
			winningSquares = [
				[0, 0],
				[1, 1],
				[2, 2]
			];
			return squares[0][0];
		}
		if (squares[0][2] && squares[0][2] === squares[1][1] && squares[0][2] === squares[2][0]) {
			winningSquares = [
				[0, 2],
				[1, 1],
				[2, 0]
			];
			return squares[0][2];
		}
		return null;
	};

	const handleButtonClicked = (row: number, column: number) => {
		console.log('row:', row, 'column:', column);
		dispatch('playTurn', {
			row: row,
			column: column
		});
	};

	$: if (squares) {
		checkForWinner();
	}

	// $: gameIsOver = winner != null;
</script>

<div class="board">
	{#each squares as row, i}
		{#each row as square, j}
			{#if square === null && canPlay}
				<button
					class="square"
					on:click={() => handleButtonClicked(i, j)}
					disabled={square !== null || gameIsOver}
				>
				</button>
			{:else if winningSquares && winningSquares.some(([x, y]) => x === i && y === j)}
				{#if square === 'X'}
					<img class="square mark winner" src={cross} alt="Cross icon" />
				{:else if square === 'O'}
					<img class="square mark winner" src={circle} alt="Circle icon" />
				{/if}
			{:else if square === null}
				<div class="square"></div>
			{:else if square === 'X'}
				<img class="square mark" src={cross} alt="Cross icon" />
			{:else if square === 'O'}
				<img class="square mark" src={circle} alt="Circle icon" />
			{/if}
		{/each}
	{/each}
</div>

<style>
	.mark {
		width: 100%;
		height: 100%;
		box-shadow: 7px -7px 14px rgba(213, 213, 213, 0.2);
	}

	.board {
		width: clamp(300px, 30vw, 900px);
		height: clamp(300px, 30vw, 900px);
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		grid-gap: 0.5rem;
	}

	.square {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.21);
		border-radius: 5px;
		border: 1px rgba(255, 255, 255, 0.24) solid;
		backdrop-filter: blur(16.2px);
	}

	.square.winner {
		background: rgba(255, 255, 255, 0.5);
	}

	button.square:hover {
		outline: 2px solid white;
	}
</style>
