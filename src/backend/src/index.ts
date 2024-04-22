import { Server, ServerWebSocket } from 'bun';
import { TicTacToe } from "./tictactoe";
import {
  ClientMessageType,
  PlayTurnMessageData,
  ClientMessage,
  ServerMessageType,
  GameUpdateMessageData,
  ErrorMessageData,
  Mark,
  GameStatus,
} from '../../api';

const PORT: number = 8080;
const MAX_USERNAME_LENGTH = 16;
const MIN_USERNAME_LENGTH = 2;

type User = {
  id: string;
  createdAt: Date;
  username: string;
  room?: {
    opponent: User;
    myMark: Mark;
    game: TicTacToe;
    wantsReplay?: boolean;
  };
};

const queue: User[] = [];

const server = Bun.serve<User>({
  port: PORT,

  fetch: (req, server) => {
    const url = new URL(req.url);
    if (url.pathname === '/tictactoe') {
      return handleTicTacToeRequest(req, server);
    }
  },

  websocket: {
    open(ws) {
      console.log('Client connected');
      ws.subscribe(ws.data.id);
    },

    message(ws, message) {
      const data: ClientMessage = JSON.parse(message as string);
      if (!data.type) {
        return sendError(ws, ErrorMessageData.InvalidMessage);
      }

      switch (data.type) {
        case ClientMessageType.JoinQueue:
          enqueuePlayer(ws);
          break;
        case ClientMessageType.PlayTurn:
          const playTurnData = data.data as PlayTurnMessageData;
          handlePlayTurn(ws, playTurnData, server);
          break;
        case ClientMessageType.LeaveGame:
          handleLeaveGame(ws, server);
          break;
        case ClientMessageType.ReplayGame:
          handleReplayGame(ws, server);
          break;
      }
    },

    close(ws) {
      handlePlayerDisconnection(ws);
    },
  }
});

function enqueuePlayer(ws: ServerWebSocket<User>) {
  queue.push(ws.data);
  console.log('Player enqueued: ', queue.length);
  tryPairingPlayers(server);
}

function handleLeaveGame(ws: ServerWebSocket<User>, server: Server) {
  if (ws.data.room) {
    const opponent = ws.data.room.opponent;
    server.publish(opponent.id, JSON.stringify({ type: ServerMessageType.OpponentDisconnected }));
    delete ws.data.room;
    delete opponent.room;
  }
}

function handleReplayGame(ws: ServerWebSocket<User>, server: Server) {
  const user = ws.data;
  if (user.room) {
    user.room.wantsReplay = true; // Assuming replay request means they want to replay

    const opponent = user.room.opponent;
    if (opponent.room && opponent.room.wantsReplay) {
      initializeGame(user, opponent, server);
    }
  }
}

function handleTicTacToeRequest(req: Request, server: Server) {
  const url = new URL(req.url);
  const clientId = crypto.randomUUID();
  const username: string | null = url.searchParams.get('username');

  if (!isValidUsername(username)) {
    return new Response("Invalid username", { status: 400 });
  }

  const upgraded = server.upgrade(req, {
    data: {
      id: clientId,
      createdAt: new Date(),
      username: username,
    },
  });

  if (!upgraded) {
    return new Response("Upgrade failed", { status: 500 });
  }
}

function isValidUsername(username: string | null): boolean {
  return username !== null && username.length >= MIN_USERNAME_LENGTH && username.length <= MAX_USERNAME_LENGTH;
}

function tryPairingPlayers(server: Server) {
  while (queue.length >= 2) {
    let [player1, player2] = [queue.shift()!, queue.shift()!];
    if (Math.random() < 0.5) [player1, player2] = [player2, player1];
    initializeGame(player1, player2, server);
  }
}

function initializeGame(player1: User, player2: User, server: Server) {
  const game = new TicTacToe();

  player1.room = {
    opponent: player2,
    myMark: Mark.X,
    game,
  };

  player2.room = {
    opponent: player1,
    myMark: Mark.O,
    game,
  };

  notifyPlayersOfGameStart(player1, player2, server);
}

function notifyPlayersOfGameStart(player1: User, player2: User, server: Server) {
  if (!player1.room) {
    return;
  }

  const board = player1.room.game.board;

  const gameUpdateForPlayer1: GameUpdateMessageData = {
    type: GameStatus.InProgress,
    opponentName: player2.username,
    myMark: Mark.X,
    isCurrentPlayer: true,
    squares: board
  };

  const gameUpdateForPlayer2: GameUpdateMessageData = {
    type: GameStatus.InProgress,
    opponentName: player1.username,
    myMark: Mark.O,
    isCurrentPlayer: false,
    squares: board
  };

  server.publish(player1.id, JSON.stringify({ type: ServerMessageType.GameUpdate, data: gameUpdateForPlayer1 }));
  server.publish(player2.id, JSON.stringify({ type: ServerMessageType.GameUpdate, data: gameUpdateForPlayer2 }));
}

function handlePlayTurn(ws: ServerWebSocket<User>, playTurnData: PlayTurnMessageData, server: Server) {
  if (!ws.data.room) {
    return sendError(ws, ErrorMessageData.InvalidMessage);
  }

  const { x, y } = playTurnData;
  const game = ws.data.room.game;

  if (game.currentMark !== ws.data.room.myMark) {
    return sendError(ws, ErrorMessageData.NotYourTurn);
  }

  try {
    game.playTurn(x, y);
    updatePlayersAfterTurn(ws, server);
  } catch (error) {
    sendError(ws, ErrorMessageData.InvalidCoordinates);
  }
}

function updatePlayersAfterTurn(ws: ServerWebSocket<User>, server: Server) {
  const user = ws.data;
  if (!user.room) {
    return sendError(ws, ErrorMessageData.ServerError);
  }

  const game = user.room.game;
  const gameStatus = game.gameStatus;
  const board = game.board;

  const opponent = user.room.opponent;
  if (!opponent.room) {
    return sendError(ws, ErrorMessageData.ServerError);
  }

  // Prepare the game update messages for both players
  const gameUpdateForUser: GameUpdateMessageData = {
    type: gameStatus as unknown as GameStatus,
    opponentName: opponent.username,
    myMark: user.room.myMark,
    isCurrentPlayer: game.currentMark === user.room.myMark,
    squares: board,
  };

  const gameUpdateForOpponent: GameUpdateMessageData = {
    type: gameStatus as unknown as GameStatus,
    opponentName: user.username,
    myMark: opponent.room.myMark,
    isCurrentPlayer: game.currentMark === opponent.room.myMark,
    squares: board,
  };

  // Send the game state updates to both players
  server.publish(user.id, JSON.stringify({ type: ServerMessageType.GameUpdate, data: gameUpdateForUser }));
  server.publish(opponent.id, JSON.stringify({ type: ServerMessageType.GameUpdate, data: gameUpdateForOpponent }));
}

function sendError(ws: ServerWebSocket<User>, error: ErrorMessageData) {
  ws.send(JSON.stringify({ type: ServerMessageType.Error, data: error }));
}

function handlePlayerDisconnection(ws: ServerWebSocket<User>) {
  if (ws.data.room) {
    const opponent = ws.data.room.opponent;
    server.publish(opponent.id, JSON.stringify({ type: ServerMessageType.OpponentDisconnected }));
    delete ws.data.room;
    delete opponent.room;
  }

  const index = queue.findIndex(user => user.id === ws.data.id);
  if (index !== -1) {
    queue.splice(index, 1);
  }
}

console.log(`Listening on ${server.url}`);

