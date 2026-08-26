require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

const API_URL = (process.env.LEAGUE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const API_KEY = process.env.BOT_API_KEY;

async function call(path, method = 'GET', body = null) {
    try {
        const response = await axios({
            method,
            url: API_URL + path,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            data: body
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.error || 'API request failed');
        }
        throw new Error(error.message);
    }
}

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`📡 Connected to API: ${API_URL}`);
    client.user.setPresence({
        activities: [{ name: '⚽ UEFA Champions League', type: 3 }],
        status: 'online'
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        await interaction.deferReply({ ephemeral: false });

        switch (interaction.commandName) {
            case 'standings':
                await handleStandings(interaction);
                break;
            case 'team':
                await handleTeam(interaction);
                break;
            case 'fixture':
                await handleFixture(interaction);
                break;
            case 'result':
                await handleResult(interaction);
                break;
            case 'news':
                await handleNews(interaction);
                break;
            case 'help':
                await handleHelp(interaction);
                break;
            default:
                await interaction.editReply('❌ Unknown command');
        }
    } catch (error) {
        console.error('Command error:', error);
        const reply = interaction.deferred ? interaction.editReply : interaction.reply;
        await reply({ 
            content: `❌ Error: ${error.message}`,
            ephemeral: true 
        });
    }
});

// ============ COMMAND HANDLERS ============

async function handleStandings(interaction) {
    const data = await call('/standings');
    
    if (!data || data.length === 0) {
        return interaction.editReply('📭 No teams in the league yet.');
    }

    const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('🏆 League Standings')
        .setDescription(`**${data.length}** teams competing`)
        .setTimestamp()
        .setFooter({ text: 'UEFA Champions League • 2025/2026' });

    // Top 10 teams
    const top10 = data.slice(0, 10);
    const standingsText = top10.map((team, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} **${team.name}** — **${team.points} pts** (${team.wins}W-${team.draws}D-${team.losses}L) | GD: ${team.goalDifference}`;
    }).join('\n');

    embed.addFields({ 
        name: '📊 Current Table', 
        value: standingsText || 'No data available' 
    });

    if (data.length > 10) {
        embed.addFields({ 
            name: '📌 More teams', 
            value: `And ${data.length - 10} more teams...` 
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

async function handleTeam(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
        const name = interaction.options.getString('name');
        const shortName = interaction.options.getString('short_name') || name;
        const tag = interaction.options.getString('tag') || name.slice(0, 3).toUpperCase();
        const logoUrl = interaction.options.getString('logo_url') || '';
        const description = interaction.options.getString('description') || '';

        const team = await call('/teams', 'POST', {
            name,
            shortName,
            tag,
            logoUrl,
            description
        });

        const embed = new EmbedBuilder()
            .setColor(0x22d3ee)
            .setTitle('✅ Team Added!')
            .setDescription(`**${team.name}** has been added to the league.`)
            .addFields(
                { name: '📛 Tag', value: team.tag || 'N/A', inline: true },
                { name: '🆔 ID', value: `\`${team.id}\``, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'remove') {
        const teamId = interaction.options.getString('team_id');
        await call(`/teams/${teamId}`, 'DELETE');
        await interaction.editReply(`✅ Team \`${teamId}\` has been retired.`);
    }

    if (sub === 'info') {
        const name = interaction.options.getString('name');
        const data = await call('/teams');
        const team = data.find(t => t.name.toLowerCase().includes(name.toLowerCase()) || t.id === name);
        
        if (!team) {
            return interaction.editReply('❌ Team not found.');
        }

        const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle(`⚽ ${team.name}`)
            .setDescription(team.description || 'No description available.')
            .addFields(
                { name: '📛 Tag', value: team.tag || 'N/A', inline: true },
                { name: '🆔 ID', value: `\`${team.id}\``, inline: true },
                { name: '📊 Status', value: team.active !== false ? '✅ Active' : '❌ Inactive', inline: true }
            )
            .setTimestamp();

        if (team.logoUrl) {
            embed.setThumbnail(team.logoUrl);
        }

        await interaction.editReply({ embeds: [embed] });
    }
}

async function handleFixture(interaction) {
    const homeTeamId = interaction.options.getString('home_team_id');
    const awayTeamId = interaction.options.getString('away_team_id');
    const date = new Date(interaction.options.getString('date'));
    const venue = interaction.options.getString('venue') || 'TBD';
    const round = interaction.options.getString('round') || 'Matchday';

    const match = await call('/matches', 'POST', {
        homeTeamId,
        awayTeamId,
        scheduledAt: date.toISOString(),
        venue,
        round
    });

    const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle('📅 Fixture Scheduled!')
        .setDescription(`Match ID: \`${match.id}\``)
        .addFields(
            { name: '🏠 Home', value: match.homeTeamId, inline: true },
            { name: '✈️ Away', value: match.awayTeamId, inline: true },
            { name: '📅 Date', value: date.toLocaleString(), inline: false },
            { name: '🏟️ Venue', value: venue, inline: true },
            { name: '📋 Round', value: round, inline: true }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleResult(interaction) {
    const matchId = interaction.options.getString('match_id');
    const homeScore = interaction.options.getInteger('home_score');
    const awayScore = interaction.options.getInteger('away_score');

    const match = await call(`/matches/${matchId}/result`, 'POST', {
        homeScore,
        awayScore
    });

    const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('⚽ Result Published!')
        .setDescription(`Match ID: \`${matchId}\``)
        .addFields(
            { name: '🏠 Home', value: `${homeScore}`, inline: true },
            { name: '✈️ Away', value: `${awayScore}`, inline: true },
            { name: '📊 Result', value: homeScore > awayScore ? '🏆 Home Win!' : homeScore < awayScore ? '✈️ Away Win!' : '🤝 Draw!', inline: true }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function handleNews(interaction) {
    const title = interaction.options.getString('title');
    const excerpt = interaction.options.getString('excerpt') || '';
    const body = interaction.options.getString('body');
    const category = interaction.options.getString('category') || 'League News';
    const imageUrl = interaction.options.getString('image_url') || '';

    const news = await call('/news', 'POST', {
        title,
        excerpt,
        body,
        category,
        imageUrl
    });

    const embed = new EmbedBuilder()
        .setColor(0xec4899)
        .setTitle('📰 News Published!')
        .setDescription(`**${title}**`)
        .addFields(
            { name: '📂 Category', value: category, inline: true },
            { name: '📝 Preview', value: excerpt || body.slice(0, 100) + '...', inline: false }
        )
        .setTimestamp();

    if (imageUrl) {
        embed.setImage(imageUrl);
    }

    await interaction.editReply({ embeds: [embed] });
}

async function handleHelp(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('🤖 League Hub Bot Commands')
        .setDescription('Here are all the available commands:')
        .addFields(
            { name: '📊 /standings', value: 'Show current league table', inline: false },
            { name: '⚽ /team add', value: 'Add a new team to the league', inline: false },
            { name: '⚽ /team remove', value: 'Remove/retire a team', inline: false },
            { name: '⚽ /team info', value: 'Get team information', inline: false },
            { name: '📅 /fixture add', value: 'Schedule a new match', inline: false },
            { name: '📝 /result add', value: 'Publish a match result', inline: false },
            { name: '📰 /news post', value: 'Publish league news', inline: false }
        )
        .setFooter({ text: '🔑 Admin commands require proper permissions' });

    await interaction.editReply({ embeds: [embed] });
}

client.login(process.env.DISCORD_TOKEN);