<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import cross from '$lib/assets/cross.svg';
	import circle from '$lib/assets/circle.svg';
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
				{#if square === 'X'}
					<img src={cross} alt="Cross icon" />
				{:else if square === 'O'}
					<img src={circle} alt="Circle icon" />
				{/if}
			</button>
		{/each}
	{/each}
</div>

<style>
	.square img {
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

	.square:hover {
		outline: 2px solid red;
	}

	.square:disabled {
		/* background-color: lightgrey; */
	}
</style>
