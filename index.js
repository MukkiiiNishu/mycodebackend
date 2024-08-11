const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Mukesh@22', // Your MySQL password
    database: 'learning_assistant_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Multer setup for video file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// API endpoint to handle video uploads and transcription
app.post('/api/upload-video', upload.single('video'), (req, res) => {
    const videoPath = req.file.path;
    const audioPath = videoPath.replace(path.extname(videoPath), '.wav');

    // Step 1: Extract audio from video
    ffmpeg(videoPath)
        .output(audioPath)
        .on('end', () => {
            console.log('Audio extraction complete:', audioPath);

            // Step 2: Transcribe the audio
            const transcript = transcribeAudio(audioPath);

            // Step 3: Save transcript to the database
            const videoId = path.basename(videoPath, path.extname(videoPath));
            const query = 'INSERT INTO transcripts (video_id, transcript) VALUES (?, ?)';
            db.query(query, [videoId, transcript], (err) => {
                if (err) {
                    console.error('Error saving transcript:', err);
                    return res.status(500).send('Error saving transcript.');
                }
                console.log('Transcript saved successfully:', transcript);
                res.status(200).json({ transcript });
            });

            // Clean up: Remove audio and video files after processing
            fs.unlinkSync(videoPath);
            fs.unlinkSync(audioPath);
        })
        .on('error', (err) => {
            console.error('Error during audio extraction:', err);
            res.status(500).send('Error during audio extraction.');
        })
        .run();
});

// Function to transcribe audio using Whisper (assuming you have a Python script to handle this)
function transcribeAudio(audioPath) {
    try {
        const transcript = execSync(`python3 transcribe.py ${audioPath}`).toString();
        return transcript.trim();
    } catch (error) {
        console.error('Error during transcription:', error);
        return '';
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
