const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*' // Fallback to * for local development, strict in production
}));
app.use(express.json());

// Target Content Paths
const todayPath = path.join(__dirname, 'content/generated/today.json');
const archivePath = path.join(__dirname, 'content/user/archive.json');

// Helper function to read local JSON files safely
const readJsonFile = (filePath, defaultData) => {
    try {
        if (!fs.existsSync(filePath)) {
            return defaultData;
        }
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error(`Error reading file at ${filePath}:`, err.message);
        return defaultData;
    }
};

// Helper function to write local JSON files safely
const writeJsonFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error(`Error writing file at ${filePath}:`, err.message);
        return false;
    }
};

// --- API ENDPOINTS ---

// 1. GET /api/news - Fetch today's AI processed tech brief
app.get('/api/news', (req, res) => {
    const data = readJsonFile(todayPath, { date: "", articles: [] });
    res.status(200).json(data);
});

// 2. GET /api/archive - Fetch user saved bookmarked articles
app.get('/api/archive', (req, res) => {
    const data = readJsonFile(archivePath, { saved: [] });
    res.status(200).json(data);
});

// 3. POST /api/archive - Bookmark/Save an article
app.post('/api/archive', (req, res) => {
    const articleToSave = req.body;

    if (!articleToSave || !articleToSave.id || !articleToSave.title) {
        return res.status(400).json({ error: "Invalid article schema structure provided." });
    }

    const archiveData = readJsonFile(archivePath, { saved: [] });
    
    // Check if the article is already archived to prevent duplicates
    const alreadyExists = archiveData.saved.some(item => item.id === articleToSave.id);
    if (alreadyExists) {
        return res.status(200).json({ message: "Article is already safely archived.", saved: archiveData.saved });
    }

    // Add metadata tracking time of save
    const enrichedArticle = {
        ...articleToSave,
        archivedAt: new Date().toISOString()
    };

    archiveData.saved.push(enrichedArticle);
    
    if (writeJsonFile(archivePath, archiveData)) {
        res.status(201).json({ message: "Article saved to your brief successfully.", saved: archiveData.saved });
    } else {
        res.status(500).json({ error: "Failed to persist article save to internal file system repository." });
    }
});

// 4. DELETE /api/archive/:id - Remove a saved article from bookmarks
app.delete('/api/archive/:id', (req, res) => {
    const { id } = req.params;
    const archiveData = readJsonFile(archivePath, { saved: [] });

    const updatedList = archiveData.saved.filter(item => item.id !== id);

    if (archiveData.saved.length === updatedList.length) {
        return res.status(404).json({ error: "Article id not found in your archive." });
    }

    archiveData.saved = updatedList;

    if (writeJsonFile(archivePath, archiveData)) {
        res.status(200).json({ message: "Article removed from active archive.", saved: archiveData.saved });
    } else {
        res.status(500).json({ error: "Failed to modify internal archive file state." });
    }
});

// Start listening
app.listen(PORT, () => {
    console.log(`Express application active on endpoint server target: http://localhost:${PORT}`);
});