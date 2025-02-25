import 'dotenv/config';
import fs from 'fs';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Azure Speech SDK with API Key and Region from environment variables
const speechConfig = sdk.SpeechConfig.fromSubscription(
	process.env.AZURE_SPEECH_KEY,
	process.env.AZURE_SPEECH_REGION
);

// Set the default speech recognition language to English (US)
speechConfig.speechRecognitionLanguage = 'en-US';

/**
 * Transcribes an audio file using Azure Speech SDK.
 *
 * @param {string} file - The path to the audio file to be transcribed.
 * @returns {Promise<string>} A promise that resolves with the transcribed text or rejects with an error message.
 */
export const transcribe = (file) => {
	return new Promise((resolve, reject) => {
		// Create a push stream to read the audio file
		const pushStream = sdk.AudioInputStream.createPushStream();

		// Read the audio file and stream it to Azure's Speech SDK
		fs.createReadStream(file)
			.on('data', (chunk) => pushStream.write(chunk))
			.on('end', () => pushStream.close());

		// Configure audio input from the push stream
		const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
		const speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

		console.log('Starting speech recognition...');

		// Perform speech recognition
		speechRecognizer.recognizeOnceAsync((result) => {
			switch (result.reason) {
				case sdk.ResultReason.RecognizedSpeech:
					console.log('Speech recognized:', result.text);
					resolve(result.text);
					break;
				case sdk.ResultReason.NoMatch:
					console.log('Speech could not be recognized.');
					reject('Speech could not be recognized.');
					break;
				case sdk.ResultReason.Canceled:
					const cancellation = sdk.CancellationDetails.fromResult(result);
					console.log('CANCELED:', cancellation.reason);
					if (cancellation.reason === sdk.CancellationReason.Error) {
						console.log('ERROR:', cancellation.errorDetails);
					}
					reject(`CANCELED: ${cancellation.reason}`);
					break;
			}

			// Close the recognizer to free resources
			speechRecognizer.close();
		});
	});
};

/**
 * Command-line interface (CLI) usage: allows the script to be executed with an audio file argument.
 * Example: `node azure.js path/to/audio.wav`
 */
if (process.argv[1] === __filename) {
	const file = process.argv[2];

	if (!file) {
		console.error('Usage: node azure.js <audio-file-path>');
		process.exit(1);
	}

	transcribe(path.resolve(__dirname, file))
		.then(text => console.log('Transcription:\n', text))
		.catch(err => console.error('Error:', err));
}
