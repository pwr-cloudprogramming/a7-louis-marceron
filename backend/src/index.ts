import { TicTacToe, GameStatus, Mark } from "./tictactoe";

type User = {
  id: string;
  createdAt: Date;
  username: string;
  room?: {
    opponent: User;
    mark: Mark;
    game: TicTacToe;
  };
};

const port: number = 8080;
const queue: User[] = [];


const server = Bun.serve<User>({
  port: port,

  fetch: (req, server) => {
    const url = new URL(req.url);
    const clientId = crypto.randomUUID();

    if (url.pathname === '/tictactoe') {
      const username: string | null = url.searchParams.get('username');

      if (!username || username?.length < 2 || username.length > 16) {
        return new Response("Invalid username", { status: 400 });
      }

      const upgraded = server.upgrade(req, {
        // Create a new user and inject in its ServerWebSocket
        data: {
          id: clientId,
          createdAt: Date(),
          username: username,
        },
      });

      if (!upgraded) {
        return new Response("Upgrade failed", { status: 500 });
      }
    }
  },

  websocket: {
    open(ws) {
      // The user subscribe to a room with his id. It allows the server to send 
      // him messages
      ws.subscribe(ws.data.id);

      queue.push(ws.data);

      if (queue.length >= 2) {
        let player1 = queue.pop();
        let player2 = queue.pop();

        if (!player1 || !player2) {
          // Should never happen
          return;
        }

        // Select a random player to start
        const random = Math.random();
        if (random < 0.5) {
          let temp = player1;
          player1 = player2;
          player2 = temp;
        }

        player1.room = {
          opponent: player2,
          mark: Mark.X,
          game: new TicTacToe(),
        };

        player2.room = {
          opponent: player1,
          mark: Mark.O,
          game: player1.room.game,
        };

        server.publish(player1.id, JSON.stringify({
          type: 'inProgress',
          opponentName: player2.username,
          mark: 'X',
          currentPlayer: player1.username,
          squares: player1.room.game.board
        }));

        server.publish(player2.id, JSON.stringify({
          type: 'inProgress',
          opponentName: player1.username,
          mark: 'O',
          currentPlayer: player1.username,
          squares: player2.room.game.board
        }));
      };
    },

    message(ws, message) {
      const data = JSON.parse(message as string);

      if (!data.type) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
        return;
      }

      const type: string = data.type;

      switch (type) {
        case 'playTurn':

          console.log(data);

          if (!ws.data.room) {
            ws.send(JSON.stringify({ type: 'error', message: 'You are not in a room' }));
            return;
          }

          const game = ws.data.room.game;
          const currentPlayer = game.currentMark === ws.data.room.mark ?
            ws.data : ws.data.room.opponent;

          console.log(` currentPlayer: ${currentPlayer.id} - ws.data.id: ${ws.data.id}`)

          if (currentPlayer.id !== ws.data.id) {
            ws.send(JSON.stringify({ type: 'error', message: 'It is not your turn' }));
            return;
          }

          const x = data.x;
          const y = data.y;

          if (x === undefined || y === undefined) {
            ws.send(JSON.stringify({ type: 'error', message: 'Missing coordinates' }));
            return;
          }

          if (x < 0 || x > 2 || y < 0 || y > 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid coordinates' }));
            return;
          }

          let gameStatus: GameStatus;

          try {
            gameStatus = game.playTurn(x, y)
          } catch (error: any) {
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
            return;
          }

          server.publish(ws.data.id, JSON.stringify({
            type: 'inProgress',
            opponentName: ws.data.room.opponent.username,
            mark: ws.data.room.opponent.room?.mark === Mark.X ? 'X' : 'O',
            currentPlayer: ws.data.room.opponent.username,
            squares: game.board
          }));

          server.publish(ws.data.room.opponent.id, JSON.stringify({
            type: 'inProgress',
            opponentName: ws.data.username,
            mark: ws.data.room.opponent.room?.mark === Mark.X ? 'X' : 'O',
            currentPlayer: ws.data.username,
            squares: game.board
          }));
          break;
      }
    },

    close(ws) {
      return;
    },
  }
});

console.log(`Listening on ${server.url}`);
