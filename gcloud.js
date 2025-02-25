import fs from 'fs';
import speech from'@google-cloud/speech';

// Creating a new speech service client
const speechClient = new speech.SpeechClient();

const transcribe = async (filename) => {
	const request = {
		config: {
			encoding: 'ENCODING_UNSPECIFIED', // Transcription encoding definition
			sampleRateHertz: '16000', // Voice file sample rate, usually 16000/8000 suould be enough
			languageCode: 'en-US', // Transcription language code
			enableAutomaticPunctuation: true, // Turn on to recognize periods, commas, and question marks in the voice file
			useEnhanced: true, // Turn on to transcribe phone call and video audio
		},
		audio: {
			content: fs.readFileSync(filename).toString('base64'),
		}
	};

	const [response] = await speechClient.recognize(request);

	// Transcription response can return as a JSON file with multiple results if multiple files are transcribed
	const transcription = response.results
		// Each transcription returns with multiple transcription alternatives
		.map(result => result.alternatives[0].transcript)
		.join('\n');
	console.log('Transcription', transcription);
};

transcribe(process.argv[2]); // We're taking the file local path from the node command 2nd argument