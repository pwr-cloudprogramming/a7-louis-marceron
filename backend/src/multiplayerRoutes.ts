import { Elysia } from "elysia";
import server from "bun";
import { TicTacToe } from "./tictactoe";
// Elysia use bun WebSockets but doesn't export export its wrapper ElysiaWS
// so we have to use the original ws package and do some hacky type casting
import ws from 'ws';

class User {
  ws: ws;
  id: string;
  username: string;
  inGame: boolean;
  room?: Room;
  constructor(ws: ws, username: string) {
    this.ws = ws;
    this.username = username;
    this.inGame = false;
    this.id = (ws as any).id;

    // ws.on('close', () => {
    //   console.log(`User ${this.username} disconnected`);
    //   if (this.inGame) {
    //     this.room?.user1.ws.send(JSON.stringify({ type: 'opponentDisconnected' }));
    //     this.room?.user2.ws.send(JSON.stringify({ type: 'opponentDisconnected' }));
    //   }
    //   const index = users.indexOf(this);
    //   if (index > -1) {
    //     users.splice(index, 1);
    //   }
    //
    // });
  }
}

class Room {
  user1: User;
  user2: User;
  game: TicTacToe;
  constructor(user1: User, user2: User) {
    this.user1 = user1;
    this.user2 = user2;
    this.game = new TicTacToe(user1.username, user2.username);
  }
}

const users: User[] = [];
const queue: User[] = [];
const rooms: Room[] = [];

export const multiplayerRoutes = new Elysia()
  .ws('/online', {
    // TODO check for empty payloads

    open(ws) {
      ws.subscribe(ws.id);
    },

    message(ws, data: any) {
      if (!data || !data.type) {
        ws.send({ error: 'Invalid data' });
        return;
      }

      const userId = ws.id;
      const type: string = data.type;
      const payload = data.payload;

      switch (type) {
        case 'createAccount':
          console.log('createAccount');
          if (!payload.username) {
            ws.send({ error: 'No username provided' });
            return;
          }
          users.push(new User(ws as unknown as ws, data.username));
          console.log(`User ${data.username} is subscribed: ${ws.isSubscribed(ws.id)}`);
          ws.send({ type: 'its working' });
          ws.publish(userId, { type: 'accountCreated' });
          const ws2 = ws.raw;
          break;

        case 'joinQueue':
          const user = getUserById(userId);

          if (!user) {
            ws.send({ error: 'User not found' });
            return;
          }

          if (user.inGame) {
            ws.send({ error: 'User is already in a game' });
            return;
          }

          queue.push(user);

          if (queue.length >= 2) {
            const user1 = queue.pop();
            const user2 = queue.pop();
            if (user1 && user2) {
              const room = new Room(user1, user2);
              // FIXME bidirectional communication is jako tako
              user1.inGame = true;
              user2.inGame = true;
              user1.room = room;
              user2.room = room;
              rooms.push(room);
              room.user1.ws.send(JSON.stringify({ type: 'gameStart', payload: { opponent: user2.username } }));
              room.user2.ws.send(JSON.stringify({ type: 'gameStart', payload: { opponent: user1.username } }));
              console.log(`User ${user1.username} and ${user2.username} are now in a game`);
            }
          }
          break;

        case 'playMove':
          // Handle playing a move here
          if (!data.move) {
            ws.send({ error: 'No move provided' });
            return;
          }
          console.log(`User ${userId} played move: ${data.move}`);
          // Add logic to update game state and notify other player(s)
          break;

        case 'restartGame':
          // Handle game restart logic here
          console.log(`User ${userId} wants to restart the game`);
          // Add logic to restart the game and notify other player(s)
          break;

        default:
          ws.send({ error: 'Unknown message type' });
      }
    }
  });



const getUserById = (id: string): User | undefined => {
  return users.find(user => user.id === id);
}
