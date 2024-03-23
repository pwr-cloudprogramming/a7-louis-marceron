<script>
	import Background from '$lib/Background.svelte';
	import BackgroundLightEffect from '$lib/BackgroundLightEffect.svelte';
	import './reset.css';
	import '../lib/global.css';
</script>

<div class="app">
	<Background />
	<BackgroundLightEffect />
	<a href="/">Home</a>
	<main>
		<slot />
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		/* replace vh by mobile-friendly unit */
		min-height: 100vh;
		background-color: transparent;
		overflow: hidden;
		font-family: 'Plus Jakarta Sans', 'Arial';
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-evenly;
		padding: 1rem;
		color: white;
	}
</style>
