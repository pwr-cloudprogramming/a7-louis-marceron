<script>
	export let player1Name = 'Player 1';
	export let player2Name = 'Player 2';
	export let player1Score = 0;
	export let player2Score = 0;
</script>

<div id="players-bar">
	<p class="player">{player1Name} - {player1Score}</p>
	<p class="player">{player2Score} - {player2Name}</p>
</div>

<style>
	#players-bar {
		display: flex;
		justify-content: space-between;
		width: 100%;
		align-self: self-end;
	}

	.player {
		font-size: 2.5rem;
		text-transform: uppercase;
	}
</style>
