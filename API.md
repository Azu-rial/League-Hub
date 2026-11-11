# League Hub API

Base URL: `/api`

Public:
- `GET /site`, `/dashboard`, `/standings`, `/teams`, `/teams/:id` (includes squad + team top performers), `/matches`, `/news`
- `GET /players`, `/players/:id`
- `GET /stats?limit=10` – leaderboards (`goals`, `assists`, `cleanSheets`, `tackles`, `saves`), all player totals, per-team tops
- `GET /stats/export.csv`

Admin / bot authenticated:
- `POST /auth/login`, `GET /auth/me`
- `GET|POST|DELETE /admins` (owner)
- `POST /teams`, `PATCH /teams/:id`, `DELETE /teams/:id` – team fields: name, shortName, tag, logoUrl, color, description, owner, ownerDiscordId, roleId, rosterMax
- `POST /matches`, `PATCH /matches/:id`, `POST /matches/:id/result`, `DELETE /matches/:id`
- `PUT /matches/:id/stats` – `{ "entries": [{ "playerId": "...", "goals": 2, "assists": 1, "cleanSheets": 0, "tackles": 3, "saves": 0 }] }` (match must be completed; replaces that match's stat lines)
- `POST /players`, `PATCH /players/:id`, `DELETE /players/:id` – roster cap enforced per team (`rosterMax`, default 20)
- `POST /players/sign` – `{ "name": "...", "team": "BVB" | "Borussia Dortmund" | "<role id>", "discordId": "..." }` finds or creates the player and signs them (made for the Discord bot)
- `POST /players/release` – `{ "player": "name | discordId | id" }`
- `POST /stats/add` – `{ "player": "name | discordId | id", "stat": "goals", "amount": 1 }` (negative subtracts)
- `POST /stats/import` – `{ "csv": "player,team,goals,assists\nRafa,BVB,5,2", "mode": "set" | "add" }` (`set` = season totals, `add` = add on top; missing players are created)
- `POST|PATCH /news`, `DELETE /news/:id`
- `PATCH /settings` (owner)
- `POST /admin/reset-season` (owner) – `{ "confirm": "RESET" }` wipes teams, players, fixtures, results, news and seeds the 8 franchises

For Discord bot requests send `x-api-key: YOUR_BOT_API_KEY` (treated as owner).

## How stats are counted
Player total = manual stats (set in admin / quick add / bot / CSV) + per-match stat lines from completed matches.
