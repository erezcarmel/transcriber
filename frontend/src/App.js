import React, { useState, useRef } from 'react';
import axios from 'axios';
import RecordRTC from "recordrtc";
import './App.css';

const BACKEND_URL = `http://${window.location.hostname}:3001`;

/**
 * React component for audio transcription.
 * Allows users to upload an audio file or record audio and transcribe it using a backend service.
 */
const App = () => {
  const [inProgress, setInProgress] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState('');
  const recorderRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Opens the file dialog for selecting an audio file.
   */
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Uploads an audio file to the backend for transcription.
   * @param {File} selectedFile - The audio file to upload.
   */
  const uploadFile = async (selectedFile) => {
    const formData = new FormData();
    setTranscribedText('');
    formData.append('audio', selectedFile);
    try {
      setInProgress(true);
      const response = await axios.post(`${BACKEND_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setInProgress(false);
      setTranscribedText(response.data.text || '');
      setError(response.data.error || '');
    } catch (err) {
      console.error(err);
      setError('An error occurred while transcribing the audio.');
    }
  };

  /**
   * Handles file input change and uploads the selected file.
   * @param {Event} event - The file input change event.
   */
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  /**
   * Starts recording audio using RecordRTC.
   */
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    recorderRef.current = new RecordRTC(stream, {
      type: 'audio',
      mimeType: 'audio/wav',
      recorderType: RecordRTC.StereoAudioRecorder,
      numberOfAudioChannels: 1,
      desiredSampRate: 16000,
    });

    recorderRef.current.startRecording();
    setRecording(true);
  };

  /**
   * Stops the audio recording and uploads the recorded file.
   */
  const stopRecording = async () => {
    setRecording(false);
    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current.getBlob();
      const audioFile = new File([blob], 'recording.wav', { type: 'audio/wav' });
      uploadFile(audioFile);
    });
  };

  return (
    <div className="app-container">
      <div className="title">
        <h1>Audio Transcription</h1>
        <p>By Erez Carmel</p>
      </div>

      <div className="inputs-container">
        <div className="section upload-section">
          <h2>Upload an Audio File</h2>
          <input
            type="file"
            accept="audio/wav"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button onClick={openFileDialog} disabled={recording || inProgress}>📁</button>
        </div>

        <div className="section record-section">
          <h2>Record Audio</h2>
          <div className="record-buttons">
            <button className="record" onClick={startRecording} disabled={recording || inProgress}>◉</button>
            <button className="stop" onClick={stopRecording} disabled={!recording || inProgress}>▣</button>
          </div>
        </div>
      </div>

      {inProgress && (
        <h2 className="in-progress">Transcribing...</h2>
      )}

      {transcribedText && (
        <div className="section transcription">
          <h2>Transcribed Text</h2>
          <p>{transcribedText}</p>
        </div>
      )}

      {error && (
        <div className="section error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;
