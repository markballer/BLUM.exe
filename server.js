const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// Initialize SQLite3 Database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT, clicks INTEGER)");

    // Seed with a default user
    const stmt = db.prepare("INSERT INTO users (nickname, clicks) VALUES (?, ?)");
    stmt.run("defaultUser", 0);
    stmt.finalize();
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Save user nickname and clicks
app.post('/save', (req, res) => {
    const { nickname, clicks } = req.body;
    console.log(`Received data to save: Nickname = ${nickname}, Clicks = ${clicks}`);
    db.run("INSERT INTO users (nickname, clicks) VALUES (?, ?)", [nickname, clicks], function(err) {
        if (err) {
            console.error(`Error saving data: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`Data saved successfully with ID: ${this.lastID}`);
        res.json({ message: 'Data saved successfully', id: this.lastID });
    });
});

// Get total clicks
app.get('/total-clicks', (req, res) => {
    db.get("SELECT SUM(clicks) AS totalClicks FROM users", [], (err, row) => {
        if (err) {
            console.error(`Error fetching total clicks: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`Total clicks fetched: ${row.totalClicks}`);
        res.json({ totalClicks: row.totalClicks });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
