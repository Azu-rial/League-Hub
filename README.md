# League Hub

A complete league-table website starter built around a simple JSON database. It includes:

- Public league homepage with live standings, form, recent results, upcoming fixtures and news
- Full Teams, Results, Fixtures, News and team-profile pages
- Admin dashboard with role-based admin accounts
- Team CRUD, fixture scheduling, result publishing, news publishing and site settings
- Discord bot API authentication using `x-api-key`
- Example Discord bot with slash commands for teams, fixtures, results, news and standings
- No database server required

## Run

1. Install Node.js 18+.
2. Copy `.env.example` to `.env` and change the secrets.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:4000`.

The first boot creates the owner account from `BOOTSTRAP_OWNER_USERNAME` / `BOOTSTRAP_OWNER_PASSWORD` if no admins exist.

## Discord bot

The bot is intentionally separate from the website. See `bot/README.md`.

Inside `bot/`:

```bash
npm install
```

Set `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `LEAGUE_API_URL` and `BOT_API_KEY` in `bot/.env`, then:

```bash
node index.js
```

## Production

For a serious deployment, move the JSON store to PostgreSQL/Supabase and put the app behind HTTPS. The API design is intentionally kept simple so that migration is straightforward.
