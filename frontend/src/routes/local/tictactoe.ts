enum GameStatus {
	inProgress,
	player1Wins,
	player2Wins,
	player1Forfeits,
	player2Forfeits,
	draw,
}

class Player {
	private static numberOfPlayer: number = 0;
	private _id: number;
	private _name: string;

	public get name() {
		return this._name;
	}

	public get id() {
		return this._id;
	}

	public constructor(name: string) {
		Player.numberOfPlayer++;
		this._id = Player.numberOfPlayer;
		this._name = name;
	}
}

export class TicTacToe {
	private board: (Player | null)[][];
	private player1: Player;
	private player2: Player;
	private _currentPlayer: Player;

	public constructor(player1Name: string = "Player 1", player2Name: string = "Player 2") {
		this.board = [
			[null, null, null],
			[null, null, null],
			[null, null, null]
		];

		this.player1 = new Player(player1Name);
		this.player2 = new Player(player2Name);

		this._currentPlayer = this.selectRandomPlayer();
	}

	public get currentPlayer(): Player {
		return this._currentPlayer;
	}

	public get gameStatus(): GameStatus {
		// Check rows
		for (let i = 0; i < 3; i++) {
			if (this.board[i][0] !== null &&
				this.board[i][0] === this.board[i][1] &&
				this.board[i][0] === this.board[i][2]) {
				return this.board[i][0] === this.player1 ? GameStatus.player1Wins : GameStatus.player2Wins;
			}
		}

		// Check columns
		for (let i = 0; i < 3; i++) {
			if (this.board[0][i] !== null &&
				this.board[0][i] === this.board[1][i] &&
				this.board[0][i] === this.board[2][i]) {
				return this.board[0][i] === this.player1 ? GameStatus.player1Wins : GameStatus.player2Wins;
			}
		}

		// Check diagonals
		if (this.board[0][0] !== null &&
			this.board[0][0] === this.board[1][1] &&
			this.board[0][0] === this.board[2][2]) {
			return this.board[0][0] === this.player1 ? GameStatus.player1Wins : GameStatus.player2Wins;
		}

		if (this.board[0][2] !== null &&
			this.board[0][2] === this.board[1][1] &&
			this.board[0][2] === this.board[2][0]) {
			return this.board[0][2] === this.player1 ? GameStatus.player1Wins : GameStatus.player2Wins;
		}

		// Check if the board is full
		let isBoardFull = true;
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				if (this.board[i][j] === null) {
					isBoardFull = false;
					break;
				}
			}
			if (!isBoardFull) {
				break;
			}
		}

		if (isBoardFull) {
			return GameStatus.draw;
		}

		return GameStatus.inProgress;
	}

	public playTurn(x: number, y: number): GameStatus {
		const isOutsideTheBoard = x < 0 || x > 2 || y < 0 || y > 2;
		const squareNotEmpty = this.board[x][y] !== null;
		const gameIsOver = this.gameStatus !== GameStatus.inProgress;

		if (gameIsOver) {
			throw new Error('The game is over');
		}

		if (isOutsideTheBoard || squareNotEmpty) {
			throw new Error('Invalid position');
		}

		this.board[x][y] = this.currentPlayer
		this._currentPlayer = this.currentPlayer === this.player1 ?
			this.player2 : this.player1;

		return this.gameStatus;
	}

	private selectRandomPlayer(): Player {
		const randomNumber = Math.random();
		return randomNumber < 0.5 ? this.player1 : this.player2
	}
}
