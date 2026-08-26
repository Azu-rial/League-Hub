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
  <img src="https://via.placeholder.com/950x400/0D1117/8B5CF6?text=League+Hub+Dashboard+Preview" alt="Dashboard Preview" width="95%" />
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
