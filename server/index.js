import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { transcribe } from '../azure.js';

const app = express();
// Creates a local recordings folder path by the folder name defined in the environment variables
const recordingsDir = path.join(process.cwd(), process.env.RECORDINGS_FOLDER_NAME);

// Ensure the recordings directory exists
if (!fs.existsSync(recordingsDir)) {
	fs.mkdirSync(recordingsDir, { recursive: true });
	console.log(`Created ${process.env.RECORDINGS_FOLDER_NAME} folder`);
}

/**
 * Configure storage settings for multer (file upload middleware)
 * - Stores uploaded audio files in the designated recordings directory
 * - Generates unique filenames based on the current timestamp
 */
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, recordingsDir);
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});

/**
 * Initialize multer with storage and file filter settings
 * - Only allows WAV and WebM audio file formats
 */
const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/webm') {
			cb(null, true);
		} else {
			cb(new Error('Invalid file type, only WAV and WebM allowed!'), false);
		}
	},
});

app.use(cors());
app.use(express.json());

/**
 * Handles audio file upload and transcription.
 *
 * @route POST /transcribe
 * @param {Object} req - Express request object containing the uploaded file
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing the transcribed text or an error message
 */
app.post('/transcribe', upload.single('audio'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No file received' });
	}

	const file = req.file.path;

	// Verify that the file was successfully saved
	if (!fs.existsSync(file)) {
		console.error('File was not saved:', file);
		return res.status(500).json({ error: 'File was not saved on the server' });
	}

	try {
		const text = await transcribe(file);
		res.json({ text });
	} catch (error) {
		res.json({ error });
	} finally {
		fs.unlinkSync(file); // Delete the file after processing
	}
});

/**
 * Starts the Express server and listens on the specified port defined in the environment variables
 */
app.listen(process.env.SERVER_PORT, () => {
	console.log(`Server running on http://localhost:${process.env.SERVER_PORT}`);
});
