<div align="center">

<img src="https://capsule-render.vercel.app/api?type=venom&color=0D1117&height=320&section=header&text=LEAGUE%20HUB&fontSize=56&fontColor=8B5CF6&animation=fadeIn&fontAlignY=52&desc=UEFA%20CHAMPIONS%20LEAGUE%20DASHBOARD%20%E2%80%94%20FULL%20STACK%20FOOTBALL%20MANAGEMENT&descAlignY=74&descSize=18&descColor=6E7681&stroke=8B5CF6&strokeWidth=2" width="100%" />

</div>

<div align="center">

<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=800&size=24&duration=2800&pause=1200&color=8B5CF6&background=0D111700&center=true&vCenter=true&multiline=false&repeat=true&width=950&height=70&lines=%E2%9A%BD%EF%B8%8F+LIVE+LEAGUE+STANDINGS+%26+STATS;%F0%9F%93%8A+REAL-TIME+MATCH+TRACKING;%F0%9F%8F%86+ADMIN+DASHBOARD+%2B+CRUD;%F0%9F%94%90+DISCORD+BOT+INTEGRATION;%F0%9F%8C%90+JSON+STORAGE+%7C+JWT+AUTH" alt="Typing SVG"/>
</a>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=500&size=14&duration=3800&pause=600&color=6E7681&background=0D111700&center=true&vCenter=true&multiline=false&repeat=true&width=750&height=35&lines=Node.js+%7C+Express+%7C+TailwindCSS+%7C+Discord.js;JSON+Storage+%7C+JWT+Auth+%7C+REST+API" alt="Subtitle typing"/>

</div>

<br/>

<div align="center">

[![Status](https://img.shields.io/badge/%E2%9C%85%20Status-Active-8B5CF6?style=for-the-badge&logo=github&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](package.json)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)](package.json)
[![Discord](https://img.shields.io/badge/Discord.js-14.14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](package.json)
[![License](https://img.shields.io/badge/License-MIT-A371F7?style=for-the-badge)](LICENSE)

[![Live Demo](https://img.shields.io/badge/%F0%9F%8C%90%20Live%20Demo-Your-URL-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](https://your-domain.com)

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 🌌 &nbsp; PROJECT OVERVIEW

<div align="center">
  <img src="https://github.com/user-attachments/assets/6d83b3b0-f79b-4f38-9af1-9d3a0caf07f5" alt="Dashboard Preview" width="95%" />
  <br/>
  <sub><b>Figure 1:</b> League Hub Dashboard - Live standings, fixtures, and news</sub>
</div>

<br/>

**League Hub** is a complete, production-ready football league management system built for the **UEFA Champions League**. It provides:

- 📊 **Live League Standings** with automatic ELO/points calculation
- 📅 **Match Scheduling & Results** with real-time updates
- 📰 **News Management** with image support
- 🔐 **Admin Dashboard** with full CRUD operations
- 🤖 **Discord Bot Integration** for server commands
- 🎨 **Modern UI** with TailwindCSS & Glassmorphism

<table>
<tr>
<td width="55%">

### 💡 Core Objective
Provide a lightweight, self-contained football league management system that runs on a single Node.js server with JSON storage — no external database required.

### 🎯 Key Capabilities
- **League Standings**: Auto-calculated points, goal difference, and form
- **Match Management**: Schedule, update, and publish results
- **Team Management**: Add, edit, retire teams with logos
- **News System**: Publish articles with images and categories
- **Admin Panel**: Secure dashboard with role-based access
- **Discord Bot**: Slash commands for standings, matches, results

</td>
<td width="45%" align="center">

| Feature | Status | Tech |
|:---:|:---:|:---:|
| 🗄️ **Storage** | ✅ JSON | File System |
| 🔐 **Auth** | ✅ JWT | bcryptjs |
| 🤖 **Bot** | ✅ Discord.js | v14 |
| 🎨 **UI** | ✅ Tailwind | CSS |
| 📊 **Standings** | ✅ Auto | Algorithm |
| 📱 **Responsive** | ✅ Yes | CSS Grid |

</td>
</tr>
</table>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 🛡️ &nbsp; SECURITY ARCHITECTURE

```mermaid
flowchart LR
    A["🌐 Client Request"] --> B{"1. JWT Token Check"}
    B -- No Token --> C["🔴 401 Unauthorized"]
    B -- Valid Token --> D{"2. Role Check"}
    D -- Admin --> E["🟢 API Access"]
    D -- Owner --> F["🟢 Full Access"]
    D -- Bot API Key --> G["🟢 Bot Access"]
    E --> H["📊 Data Response"]
    F --> H
    G --> H
```

<br/>

**Security Layers:**

1. **JWT Authentication** - 7-day expiration, bcrypt password hashing
2. **Role-Based Access** - Admin vs Owner permissions
3. **Bot API Key** - Separate authentication for Discord bot
4. **CORS Protection** - Restrict to allowed origins
5. **Input Sanitization** - XSS prevention via escaping

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 🏗️ &nbsp; SYSTEM ARCHITECTURE

```mermaid
graph TD
    classDef frontend fill:#0D1117,stroke:#8B5CF6,stroke-width:2px,color:#fff;
    classDef backend fill:#161B22,stroke:#22D3EE,stroke-width:2px,color:#fff;
    classDef db fill:#1F2937,stroke:#F59E0B,stroke-width:2px,color:#fff;

    Browser["🌐 Browser (User)"] -->|HTTP| Server["⚡ Express Server"]
    Discord["🤖 Discord Bot"] -->|API Key| Server
    Server -->|JWT Auth| Auth["🔐 Auth Middleware"]
    Server -->|Routes| API["📡 REST API"]
    API -->|Read/Write| JSON["💾 storage/db.json"]
    API -->|Static| Public["📁 Public Files"]
```

<br/>

<div align="center">

| Layer | Component | Technology |
|:---:|:---|:---:|
| `01` | **Frontend** | HTML + TailwindCSS + Vanilla JS |
| `02` | **Backend** | Node.js + Express.js |
| `03` | **Auth** | JWT + bcryptjs |
| `04` | **Storage** | JSON File System |
| `05` | **Bot** | Discord.js v14 |
| `06` | **Deployment** | Render / Railway / VPS |

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 🎨 &nbsp; UI FEATURES

<!-- 🖼️ ADMIN PANEL SCREENSHOT -->
<div align="center">
  <img src="ADMIN_PANEL_IMAGE_URL_HERE" alt="Admin Panel" width="95%" />
  <br/>
  <sub><b>Figure 2:</b> League Hub Admin Panel - Manage teams, fixtures, results, and news</sub>
</div>

<br/>

<!-- 🖼️ DISCORD BOT SCREENSHOT -->
<div align="center">
  <img src="DISCORD_BOT_IMAGE_URL_HERE" alt="Discord Bot" width="70%" />
  <br/>
  <sub><b>Figure 3:</b> League Hub Discord Bot - Manage league data directly through Discord</sub>
</div>

<br/>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 📡 &nbsp; API REFERENCE

<details open>
<summary>
  <b>&nbsp;🔐 &nbsp;<code>POST</code>&nbsp; /api/auth/login &nbsp;—&nbsp; Admin Login</b>
</summary>

<br/>

```javascript
// Request
POST /api/auth/login
{
  "username": "username",
  "password": "password"
}

// Response
{
  "token": "xxxxxxxxxxxx...",
  "admin": {
    "id": "admin-001",
    "username": "username",
    "role": "owner"
  }
}
```

</details>

<details>
<summary>
  <b>&nbsp;📊 &nbsp;<code>GET</code>&nbsp; /api/standings &nbsp;—&nbsp; Get League Table</b>
</summary>

<br/>

```javascript
// Response
[
  {
    "position": 1,
    "teamId": "abc123",
    "name": "Real Madrid",
    "played": 6,
    "wins": 5,
    "draws": 1,
    "losses": 0,
    "goalsFor": 15,
    "goalsAgainst": 4,
    "goalDifference": 11,
    "points": 16,
    "form": ["W", "W", "W", "D", "W"]
  }
]
```

</details>

<details>
<summary>
  <b>&nbsp;⚽ &nbsp;<code>POST</code>&nbsp; /api/teams &nbsp;—&nbsp; Add Team (Admin)</b>
</summary>

<br/>

```javascript
// Request (requires JWT)
POST /api/teams
{
  "name": "Real Madrid",
  "shortName": "RMA",
  "tag": "RM",
  "logoUrl": "https://example.com/logo.png",
  "description": "Spanish giants"
}
```

</details>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 🤖 &nbsp; DISCORD BOT COMMANDS

<div align="center">

| Command | Description | Example |
|:---|:---|:---|
| `/standings` | Show current league table | `/standings` |
| `/team add` | Add a new team | `/team add name:Real Madrid` |
| `/team remove` | Retire a team | `/team remove team_id:abc123` |
| `/team info` | Get team details | `/team info name:Real Madrid` |
| `/fixture add` | Schedule a match | `/fixture add home_team_id:abc123 away_team_id:def456 date:2026-09-15T20:00:00` |
| `/result add` | Post match result | `/result add match_id:abc123 home_score:3 away_score:1` |
| `/news post` | Publish news | `/news post title:El Clásico! body:Full article...` |
| `/help` | Show all commands | `/help` |

</div>

<br/>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 🚀 &nbsp; QUICK START

### 📦 Installation

```bash
# 1. Clone the repository
git clone https://github.com/Azu-rial/League-Hub.git
cd League-Hub

# 2. Install dependencies
npm install

# 3. Install bot dependencies
cd bot
npm install
cd ..

# 4. Configure environment
cp .env.example .env
# Edit .env with your values

# 5. Start the server
node server/index.js

# 6. Start the bot (optional - in new terminal)
cd bot
node index.js
```

### 🐳 Docker Deployment

```bash
# Build and run with Docker
docker build -t league-hub .
docker run -p 4000:4000 --env-file .env league-hub
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 🔑 &nbsp; ENVIRONMENT VARIABLES

<div align="center">

| Variable | Description | Example | Required |
|:---|:---|:---|:---:|
| `PORT` | Server port | `4000` | ✅ |
| `JWT_SECRET` | JWT signing key | `your-secret-here` | ✅ |
| `BOT_API_KEY` | Bot authentication key | `xxxxxxx...` | ✅ |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:4000` | ✅ |
| `BOOTSTRAP_OWNER_USERNAME` | Admin username | `username` | ✅ |
| `BOOTSTRAP_OWNER_PASSWORD` | Admin password | `password` | ✅ |
| `NODE_ENV` | Environment | `development` / `production` | ❌ |

</div>

<br/>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 📁 &nbsp; PROJECT STRUCTURE

```
league-hub/
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file
├── package.json          # Dependencies
├── README.md             # Documentation
├── server/               # Backend API
│   ├── index.js          # Server entry point
│   ├── lib/              # Libraries
│   │   ├── auth.js       # JWT authentication
│   │   ├── db.js         # Database functions
│   │   └── standings.js  # Standings calculator
│   └── routes/
│       └── api.js        # API routes
├── bot/                  # Discord Bot
│   ├── index.js          # Bot entry point
│   └── deploy-commands.js # Slash command registration
├── public/               # Frontend
│   ├── index.html        # Main page
│   ├── app.js            # Frontend JavaScript
│   ├── style.css         # Styling
│   └── logo.png          # Logo
└── storage/              # Data storage
    └── db.json           # Database (teams, matches, news)
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 🛠️ &nbsp; TECH STACK

<div align="center">

<img src="https://skillicons.dev/icons?i=nodejs,express,js,html,css,tailwind,discord,git,github,docker&perline=5&theme=dark" />

</div>

<br/>

| Category | Technology |
|:---|:---|
| **Backend** | Node.js + Express.js |
| **Authentication** | JWT + bcryptjs |
| **Storage** | JSON File System |
| **Frontend** | HTML + TailwindCSS + Vanilla JS |
| **Bot** | Discord.js v14 |
| **Deployment** | Render / Railway / Docker |

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 🤝 &nbsp; CONTRIBUTING

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

## 📄 &nbsp; LICENSE

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

<br/>

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=150&section=footer&text=AZU%20PROJECTS&fontSize=28&fontColor=8B5CF6&animation=twinkling&fontAlignY=65" width="100%" />

<br/>

**Built with ❤️ by [Azu-rial](https://github.com/Azu-rial)**

</div>
