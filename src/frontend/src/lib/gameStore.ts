import { writable } from 'svelte/store';

interface GameState {
	inGame: boolean;
	inQueue: boolean;
	gameIsOver: boolean | null;
	player1Name: string | null;
	player2Name: string | null;
	player1Score: number | null;
	player2Score: number | null;
	squares: (string | null)[][] | null;
	canPlay: boolean | null;
	mark: string | null;
}

export const initialGameState: GameState = {
	inGame: false,
	inQueue: false,
	gameIsOver: null,
	player1Name: null,
	player2Name: null,
	player1Score: null,
	player2Score: null,
	squares: null,
	canPlay: null,
	mark: null,
};

export const gameState = writable(initialGameState);
