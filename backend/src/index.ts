import { Server, ServerWebSocket } from 'bun';
import { TicTacToe, Mark } from "./tictactoe";

type User = {
  id: string;
  createdAt: Date;
  username: string;
  room?: {
    opponent: User;
    mark: Mark;
    game: TicTacToe;
    wantsReplay?: boolean;
  };
};

const PORT: number = 8080;
const MAX_USERNAME_LENGTH = 16;
const MIN_USERNAME_LENGTH = 2;

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
      ws.subscribe(ws.data.id);
      enqueuePlayer(ws);
    },

    message(ws, message) {
      const data = JSON.parse(message as string);
      if (!data.type) {
        return sendError(ws, 'Invalid message type');
      }

      switch (data.type) {
        case 'joinQueue':
          enqueuePlayer(ws);
          break;
        case 'playTurn':
          handlePlayTurn(ws, data, server);
          break;
        case 'leaveGame':
          handleLeaveGame(ws, server);
          break;
        case 'replayGame':
          handleReplayGame(ws, data, server);
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
  tryPairingPlayers(server);
}

function handleLeaveGame(ws: ServerWebSocket<User>, server: Server) {
  if (ws.data.room) {
    const opponent = ws.data.room.opponent;
    server.publish(opponent.id, JSON.stringify({ type: 'opponentLeft' }));
    delete ws.data.room;
    delete opponent.room;
  }
}

function handleReplayGame(ws: ServerWebSocket<User>, data: any, server: Server) {
  const user = ws.data;
  if (user.room) {
    user.room.wantsReplay = data.wantsReplay;

    const opponent = user.room.opponent;
    if (opponent.room && opponent.room.wantsReplay) {
      // Both players want to replay, so we start a new game.
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
    mark: Mark.X,
    game,
  };

  player2.room = {
    opponent: player1,
    mark: Mark.O,
    game,
  };

  notifyPlayersOfGameStart(player1, player2, server);
}

function notifyPlayersOfGameStart(player1: User, player2: User, server: Server) {
  server.publish(player1.id, JSON.stringify({
    // FIXME
    type: player1.room!.game.gameStatus,
    opponentName: player2.username,
    mark: 'X',
    isCurrentPlayer: true,
    // FIXME
    squares: player1.room!.game.board
  }));

  server.publish(player2.id, JSON.stringify({
    // FIXME
    type: player2.room!.game.gameStatus,
    opponentName: player1.username,
    mark: 'O',
    isCurrentPlayer: false,
    // FIXME
    squares: player2.room!.game.board
  }));
}

function handlePlayTurn(ws: ServerWebSocket<User>, data: any, server: Server) {
  if (!ws.data.room) {
    return sendError(ws, 'You are not in a room');
  }

  const { x, y } = validateCoordinates(data.x, data.y);
  if (x === null || y === null) {
    return sendError(ws, 'Invalid coordinates');
  }

  const game = ws.data.room.game;
  if (game.currentMark !== ws.data.room.mark) {
    return sendError(ws, "It's not your turn");
  }

  try {
    game.playTurn(x, y);
    updatePlayersAfterTurn(ws, server);
  } catch (error: any) {
    sendError(ws, error.message);
  }
}

function validateCoordinates(x: any, y: any): { x: number | null, y: number | null } {
  let parsedX = parseInt(x);
  let parsedY = parseInt(y);
  if (isNaN(parsedX) || isNaN(parsedY) || parsedX < 0 || parsedX > 2 || parsedY < 0 || parsedY > 2) {
    return { x: null, y: null };
  }
  return { x: parsedX, y: parsedY };
}

function updatePlayersAfterTurn(ws: ServerWebSocket<User>, server: Server) {
  const user = ws.data;

  if (!user.room) {
    console.error('Attempted to update a game for a user without a room.');
    sendError(ws, 'Server error');
    return;
  }

  const gameStatus = user.room.game.gameStatus;
  const opponent = user.room.opponent;
  const board = user.room.game.board;

  // Notify the current player and the opponent about the updated game state
  server.publish(user.id, JSON.stringify({
    type: gameStatus,
    opponentName: opponent.username,
    mark: user.room.mark,
    isCurrentPlayer: false,
    squares: board,
  }));

  server.publish(opponent.id, JSON.stringify({
    type: gameStatus,
    opponentName: user.username,
    mark: user.room.mark === Mark.X ? Mark.O : Mark.X,
    isCurrentPlayer: true,
    squares: board,
  }));
}

function sendError(ws: ServerWebSocket<User>, message: string) {
  ws.send(JSON.stringify({ type: 'error', message }));
}

function handlePlayerDisconnection(ws: ServerWebSocket<User>) {
  // If a player disconnects, remove them from the queue if they're in it
  const index = queue.findIndex(user => user.id === ws.data.id);
  if (index !== -1) {
    queue.splice(index, 1);
  }

  // If the player was in a game, handle the disconnection appropriately
  if (ws.data.room) {
    const opponent = ws.data.room.opponent;
    server.publish(opponent.id, JSON.stringify({
      type: 'opponentDisconnected',
    }));

    // Clean up the room object for both players
    delete ws.data.room;
    delete opponent.room;
  }
}

console.log(`Listening on ${server.url}`);
