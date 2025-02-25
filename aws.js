import 'dotenv/config';
import {
	TranscribeClient,
	StartTranscriptionJobCommand
} from '@aws-sdk/client-transcribe';

// Creating a new transcription instance, using our local environment keys with the dotenv package
const transcribeClient = new TranscribeClient({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
	}
});

const params = {
	TranscriptionJobName: 'Transcribe1', // The transcription job name, must be unique for every transcription process
	LanguageCode: 'en-US', // Transcription language code
	MediaFormat: 'mp3', // File format we are transcribing
	OutputBucketName: process.env.AWS_BUCKET, // The transciprion results bucket in AWS S3
	Settings: { // Optional settings to define whether to label the speakers, and how many speakers to transcribe
		ShowSpeakerLabels: true,
		MaxSpeakerLabels: 3
	}
};

const transcribe = async (file) => {
	try {
		const data = await transcribeClient.send(
			new StartTranscriptionJobCommand({
				...params,
				Media: {
					MediaFileUri: file,
				},
			})
		);
		console.log('Success', data);
		return data; // For unit tests.
	} catch (err) {
		console.log('Error', err);
	}
};

transcribe(process.argv[2]); // We're taking the file URI from the node command 2nd argument