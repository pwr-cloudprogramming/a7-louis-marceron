<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let squares: (string | null)[][];
	export let currentPlayer: string;
	export let gameIsOver = false;

	const handleButtonClicked = (row: number, column: number) => {
		console.log('row:', row, 'column:', column);
		dispatch('playTurn', {
			row: row,
			column: column
		});
	};
</script>

<div class="board">
	{#each squares as row, i}
		{#each row as square, j}
			<button
				class="square"
				on:click={() => handleButtonClicked(i, j)}
				disabled={square !== null || gameIsOver}
			>
				{#if currentPlayer === square}
					<bold>{square}</bold>
				{:else if square}
					{square}
				{/if}
			</button>
		{/each}
	{/each}
</div>

<style>
	bold {
		font-weight: bold;
		color: black;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(3, 5rem);
		grid-template-rows: repeat(3, 5rem);
		grid-gap: 0.5rem;
	}

	.square {
		display: flex;
		justify-content: center;
		align-items: center;
		border: 1px solid grey;
		border-radius: 0.5rem;
	}

	.square:hover {
		border: 2px solid red;
	}

	.square:disabled {
		background-color: lightgrey;
	}
</style>
