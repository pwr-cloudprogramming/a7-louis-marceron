// Client-to-Server Message Types and Data
export enum ClientMessageType {
	JoinQueue = "joinQueue",
	PlayTurn = "playTurn",
	LeaveGame = "leaveGame",
	ReplayGame = "replayGame",
}

export type PlayTurnMessageData = {
	x: number;
	y: number;
};

export type ClientMessage = {
	type: ClientMessageType;
	data?: PlayTurnMessageData;
};

// Server-to-Client Message Types and Data
export enum Mark {
	X = "X",
	O = "O",
}

export enum GameStatus {
	InProgress = "inProgress",
	XPlayerWin = "xPlayerWin",
	OPlayerWin = "oPlayerWin",
	Draw = "draw",
}

export enum ServerMessageType {
	GameUpdate = "gameUpdate",
	OpponentDisconnected = "opponentDisconnected",
	Error = "error",
}

export type ServerMessage = {
	type: ServerMessageType;
	data?: GameUpdateMessageData | ErrorMessageData;
};

export type GameUpdateMessageData = {
	type: GameStatus;
	opponentName: string;
	myMark: Mark;
	isCurrentPlayer: boolean;
	squares: (Mark | null)[][];
};

export enum ErrorMessageData {
	InvalidMessage = "invalidMessage",
	InvalidCoordinates = "invalidCoordinates",
	NotYourTurn = "notYourTurn",
	ServerError = "serverError",
}
