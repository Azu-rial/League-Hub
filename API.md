# League Hub API

Base URL: `/api`

Public:
- `GET /site`
- `GET /dashboard`
- `GET /standings`
- `GET /teams`
- `GET /teams/:id`
- `GET /matches`
- `GET /news`

Admin / bot authenticated:
- `POST /auth/login`
- `GET /auth/me`
- `GET /admins` (owner)
- `POST /admins` (owner)
- `DELETE /admins/:id` (owner)
- `POST /teams`
- `PATCH /teams/:id`
- `DELETE /teams/:id`
- `POST /matches`
- `PATCH /matches/:id`
- `POST /matches/:id/result`
- `DELETE /matches/:id`
- `POST /news`
- `PATCH /news/:id`
- `DELETE /news/:id`
- `PATCH /settings` (owner)

For Discord bot requests, send:

`x-api-key: YOUR_BOT_API_KEY`

The bot is treated as an owner-level actor.

## Result example

```json
POST /api/matches/MATCH_ID/result
{
  "homeScore": 3,
  "awayScore": 1
}
```

The standings are then recalculated automatically.
