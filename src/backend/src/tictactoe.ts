export enum GameStatus {
	inProgress = 'inProgress',
	xPlayerWin = 'xPlayerWin',
	oPlayerWin = 'oPlayerWin',
	draw = 'draw',
}

export enum Mark {
	X = 'X',
	O = 'O',
}

export class TicTacToe {
	private _board: (Mark | null)[][];
	private _currentMark: Mark;

	public constructor() {
		this._board = [
			[null, null, null],
			[null, null, null],
			[null, null, null],
		];
		// Start the game with player X
		this._currentMark = Mark.X;
	}

	public get currentMark(): Mark {
		return this._currentMark;
	}

	public get board() {
		return this._board;
	}

	public get gameStatus(): GameStatus {
		// Check rows
		for (let i = 0; i < 3; i++) {
			if (this._board[i][0] !== null &&
				this._board[i][0] === this._board[i][1] &&
				this._board[i][0] === this._board[i][2]) {
				return this._board[i][0] === Mark.X ? GameStatus.xPlayerWin : GameStatus.oPlayerWin;
			}
		}

		// Check columns
		for (let i = 0; i < 3; i++) {
			if (this._board[0][i] !== null &&
				this._board[0][i] === this._board[1][i] &&
				this._board[0][i] === this._board[2][i]) {
				return this._board[0][i] === Mark.X ? GameStatus.xPlayerWin : GameStatus.oPlayerWin;
			}
		}

		// Check diagonals
		if (this._board[0][0] !== null &&
			this._board[0][0] === this._board[1][1] &&
			this._board[0][0] === this._board[2][2]) {
			return this._board[0][0] === Mark.X ? GameStatus.xPlayerWin : GameStatus.oPlayerWin;
		}

		if (this._board[0][2] !== null &&
			this._board[0][2] === this._board[1][1] &&
			this._board[0][2] === this._board[2][0]) {
			return this._board[0][2] === Mark.X ? GameStatus.xPlayerWin : GameStatus.oPlayerWin;
		}

		// Check if the board is full
		let isBoardFull = true;
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				if (this._board[i][j] === null) {
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
		const squareNotEmpty = this._board[x][y] !== null;
		const gameIsOver = this.gameStatus !== GameStatus.inProgress;

		if (gameIsOver) {
			throw new Error('The game is over');
		}

		if (isOutsideTheBoard || squareNotEmpty) {
			throw new Error('Invalid position');
		}

		this._board[x][y] = this.currentMark;
		this._currentMark = this.currentMark === Mark.X ? Mark.O : Mark.X;

		return this.gameStatus;
	}
}
