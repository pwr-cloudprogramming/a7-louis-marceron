import { Elysia, t } from 'elysia';
import { registerUser } from './auth.controllers';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/register', async ({ body }) => registerUser(body.name), {
    body: t.Object({
      name: t.String({
        minLength: 2,
        maxLength: 16,
      })
    }),
    transform({ body }) {
      body.name = body.name.trim();
    }
  })
