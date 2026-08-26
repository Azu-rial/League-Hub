require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Make sure storage folder exists
if (!fs.existsSync('./storage')) {
    fs.mkdirSync('./storage');
}

const adminData = {
    id: 'admin-001',
    username: process.env.BOOTSTRAP_OWNER_USERNAME || 'HbeHbe1414',
    displayName: 'Admin',
    passwordHash: bcrypt.hashSync(process.env.BOOTSTRAP_OWNER_PASSWORD || 'AHBE1414', 10),
    role: 'owner',
    createdAt: new Date().toISOString()
};

const dbPath = './storage/db.json';
let db = { admins: [], teams: [], matches: [], news: [], settings: {} };

if (fs.existsSync(dbPath)) {
    const content = fs.readFileSync(dbPath, 'utf8');
    try {
        db = JSON.parse(content);
    } catch (e) {
        console.log('Creating new database...');
    }
}

// Add admin (replace any existing)
db.admins = [adminData];

// Make sure settings exist
if (!db.settings) {
    db.settings = {
        leagueName: 'UEFA Champions League',
        seasonName: '2025/2026 Season',
        tagline: 'The Beautiful Game',
        logoUrl: '',
        primaryColor: '#8b5cf6',
        accentColor: '#22d3ee',
        pointsWin: 3,
        pointsDraw: 1,
        pointsLoss: 0
    };
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('✅ Admin created successfully!');
console.log('Username:', adminData.username);
console.log('Password:', process.env.BOOTSTRAP_OWNER_PASSWORD || 'AHBE1414');
console.log('Now restart your server and login!');
