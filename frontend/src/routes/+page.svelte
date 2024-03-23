<script lang="ts">
	import { onMount } from 'svelte';

	let socket: WebSocket;

	onMount(() => {
		socket = new WebSocket('ws://localhost:8080/online');

		socket.onopen = (_event) => {
			console.log('Socket opened!');
			socket.send('Hello server!');
			socket.send(JSON.stringify({ message: 'after it is open' }));
		};

		socket.onerror = (_event) => {
			console.log("Couldn't connect to the socket");
		};

		console.log('Before it is open');
		// socket.send(JSON.stringify({ message: 'before it is open' }));
	});

	const handleOnPress = () => {
		console.log('sending messagr....');
		socket.send(JSON.stringify({ message: 'haahhahah' }));
	};
</script>

<svelte:head>
	<title>Home | tictactoe</title>
	<meta name="description" content="Tic tac toe game" />
</svelte:head>

<section>
	<h1>My tic-tac-toe game</h1>
	<nav class="mode-selection">
		<a href="/local">Offline</a>
		<a href="/multiplayer">Online</a>
	</nav>
</section>
<button on:click={handleOnPress}>WS request</button>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}
</style>
