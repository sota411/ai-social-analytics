const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { updateActivity } = require('./scripts/updateActivity');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

// Data directory setup
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// API endpoint to get activity data
app.get('/api/activity', async (req, res) => {
    try {
        const activityPath = path.join(dataDir, 'activity.json');
        
        // ファイルが存在しない場合は新しく生成
        if (!fs.existsSync(activityPath)) {
            console.log('Activity data not found, generating new data...');
            await updateActivity();
        }
        
        const activityData = JSON.parse(fs.readFileSync(activityPath, 'utf8'));
        res.json(activityData);
    } catch (error) {
        console.error('Error loading activity data:', error);
        res.status(500).json({ 
            error: 'Failed to load activity data',
            message: error.message 
        });
    }
});

// API endpoint to manually refresh activity data
app.post('/api/refresh', async (req, res) => {
    try {
        console.log('Manual refresh requested...');
        const activityData = await updateActivity();
        res.json(activityData);
    } catch (error) {
        console.error('Error refreshing activity data:', error);
        res.status(500).json({ 
            error: 'Failed to refresh activity data',
            message: error.message 
        });
    }
});

// API endpoint to get raw data (for debugging)
app.get('/api/debug', (req, res) => {
    try {
        const activityPath = path.join(dataDir, 'activity.json');
        if (fs.existsSync(activityPath)) {
            const rawData = fs.readFileSync(activityPath, 'utf8');
            res.json({
                exists: true,
                lastModified: fs.statSync(activityPath).mtime,
                size: fs.statSync(activityPath).size,
                data: JSON.parse(rawData)
            });
        } else {
            res.json({
                exists: false,
                message: 'Activity data file not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Debug endpoint error',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`
    });
});

// Server startup
app.listen(PORT, () => {
    console.log(`🚀 AI Social Analytics Dashboard running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔍 API Health: http://localhost:${PORT}/health`);
    console.log(`🔄 Manual Refresh: POST http://localhost:${PORT}/api/refresh`);
    
    // Initial data generation on startup
    setTimeout(async () => {
        try {
            const activityPath = path.join(dataDir, 'activity.json');
            if (!fs.existsSync(activityPath)) {
                console.log('🔄 Generating initial activity data...');
                await updateActivity();
                console.log('✅ Initial activity data generated');
            } else {
                console.log('📁 Existing activity data found');
            }
        } catch (error) {
            console.error('❌ Failed to generate initial data:', error.message);
        }
    }, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 Received SIGINT, shutting down gracefully');
    process.exit(0);
});