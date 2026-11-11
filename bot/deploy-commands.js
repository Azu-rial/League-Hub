require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ADMIN = PermissionFlagsBits.ManageGuild; // only members with Manage Server see/use management commands

const commands = [
    // Standings
    new SlashCommandBuilder()
        .setName('standings')
        .setDescription('Show current league standings'),

    // Team commands
    new SlashCommandBuilder()
        .setName('team')
        .setDefaultMemberPermissions(ADMIN)
        .setDescription('Manage teams')
        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Add a team')
            // REQUIRED options FIRST
            .addStringOption(opt => opt.setName('name').setDescription('Full name').setRequired(true))
            // THEN optional options
            .addStringOption(opt => opt.setName('short_name').setDescription('Short name'))
            .addStringOption(opt => opt.setName('tag').setDescription('Tag (max 6 chars)'))
            .addStringOption(opt => opt.setName('logo_url').setDescription('Logo URL'))
            .addStringOption(opt => opt.setName('description').setDescription('Team description'))
        )
        .addSubcommand(sub => sub
            .setName('remove')
            .setDescription('Retire a team')
            .addStringOption(opt => opt.setName('team_id').setDescription('Team ID').setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName('info')
            .setDescription('Get team info')
            .addStringOption(opt => opt.setName('name').setDescription('Team name or ID').setRequired(true))
        ),

    // Fixture commands
    new SlashCommandBuilder()
        .setName('fixture')
        .setDefaultMemberPermissions(ADMIN)
        .setDescription('Manage fixtures')
        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Schedule a match')
            // REQUIRED options FIRST
            .addStringOption(opt => opt.setName('home_team_id').setDescription('Home team ID').setRequired(true))
            .addStringOption(opt => opt.setName('away_team_id').setDescription('Away team ID').setRequired(true))
            .addStringOption(opt => opt.setName('date').setDescription('ISO date (e.g. 2026-09-01T19:00:00)').setRequired(true))
            // THEN optional options
            .addStringOption(opt => opt.setName('venue').setDescription('Venue'))
            .addStringOption(opt => opt.setName('round').setDescription('Round/Matchday'))
        ),

    // Result commands
    new SlashCommandBuilder()
        .setName('result')
        .setDefaultMemberPermissions(ADMIN)
        .setDescription('Manage results')
        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Publish a result')
            // REQUIRED options FIRST
            .addStringOption(opt => opt.setName('match_id').setDescription('Match ID').setRequired(true))
            .addIntegerOption(opt => opt.setName('home_score').setDescription('Home score').setRequired(true).setMinValue(0))
            .addIntegerOption(opt => opt.setName('away_score').setDescription('Away score').setRequired(true).setMinValue(0))
        ),

    // News commands
    new SlashCommandBuilder()
        .setName('news')
        .setDefaultMemberPermissions(ADMIN)
        .setDescription('Publish news')
        .addSubcommand(sub => sub
            .setName('post')
            .setDescription('Create news article')
            // REQUIRED options FIRST
            .addStringOption(opt => opt.setName('title').setDescription('Headline').setRequired(true))
            .addStringOption(opt => opt.setName('body').setDescription('Article body').setRequired(true))
            // THEN optional options
            .addStringOption(opt => opt.setName('excerpt').setDescription('Short summary'))
            .addStringOption(opt => opt.setName('category').setDescription('Category'))
            .addStringOption(opt => opt.setName('image_url').setDescription('Image URL'))
        ),


    // Players & signings
    new SlashCommandBuilder()
        .setName('player')
        .setDescription('Manage players and signings')
        .setDefaultMemberPermissions(ADMIN)
        .addSubcommand(sub => sub
            .setName('sign')
            .setDescription('Sign a player to a team (creates the player if new)')
            .addStringOption(opt => opt.setName('player').setDescription('Player name').setRequired(true))
            .addStringOption(opt => opt.setName('team').setDescription('Team name or tag').setRequired(true))
            .addUserOption(opt => opt.setName('user').setDescription('Discord user (links their ID)'))
        )
        .addSubcommand(sub => sub
            .setName('release')
            .setDescription('Release a player to free agency')
            .addStringOption(opt => opt.setName('player').setDescription('Player name or Discord ID').setRequired(true))
        ),

    // Stats
    new SlashCommandBuilder()
        .setName('stat')
        .setDescription('Add stats to a player')
        .setDefaultMemberPermissions(ADMIN)
        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Add (or subtract) a stat')
            .addStringOption(opt => opt.setName('player').setDescription('Player name or Discord ID').setRequired(true))
            .addStringOption(opt => opt.setName('stat').setDescription('Stat').setRequired(true).addChoices(
                { name: 'Goals', value: 'goals' }, { name: 'Assists', value: 'assists' },
                { name: 'Clean sheets', value: 'cleanSheets' }, { name: 'Tackles', value: 'tackles' }, { name: 'Saves', value: 'saves' }))
            .addIntegerOption(opt => opt.setName('amount').setDescription('Amount (default 1, negative to subtract)'))
        ),

    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show a stats leaderboard')
        .addStringOption(opt => opt.setName('category').setDescription('Category (default goals)').addChoices(
            { name: 'Top scorers', value: 'goals' }, { name: 'Most assists', value: 'assists' },
            { name: 'Most clean sheets', value: 'cleanSheets' }, { name: 'Most tackles', value: 'tackles' }, { name: 'Most saves', value: 'saves' })),

    // Help
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands')
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('🔄 Registering commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        console.log('✅ Commands registered successfully!');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
})();