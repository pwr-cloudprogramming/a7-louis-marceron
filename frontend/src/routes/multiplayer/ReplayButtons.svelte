<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function replay() {
		dispatch('replay');
	}

	function random() {
		dispatch('newGame');
	}

	function menu() {
		dispatch('menu');
	}
</script>

<button on:click={replay}>Replay against the same opponent</button>
<button on:click={random}>Play against a random opponent</button>
<button on:click={menu}>Return to menu</button>

<style>
	button {
		color: white;
		border: 1px solid white;
	}
</style>
