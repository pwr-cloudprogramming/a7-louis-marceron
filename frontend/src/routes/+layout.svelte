<script>
	import './reset.css';
</script>

<div class="app">
	<a href="/">Home</a>
	<main>
		<slot />
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: black;
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
