import React, { useState, useRef } from 'react';

const NoteRecognitionApp = () => {
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [result, setResult] = useState('');
  const [detectedFrequency, setDetectedFrequency] = useState(0);
  const [lastDetectedNote, setLastDetectedNote] = useState('');
  const audioInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (file) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const fileReader = new FileReader();

        fileReader.onload = async (e) => {
          const arrayBuffer = e.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          processAudio(audioBuffer);
        };

        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error reading the file:', error);
      }
    }
  };

  const processAudio = (audioBuffer) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    source.start();

    const detectPitch = () => {
      analyser.getFloatTimeDomainData(dataArray);

      const buffer = new Float32Array(bufferLength);
      analyser.getFloatFrequencyData(buffer);

      const maxIndex = buffer.indexOf(Math.max(...buffer));
      const frequency = audioContext.sampleRate * maxIndex / bufferLength;

      const note = getNoteFromFrequency(frequency);
      setResult(note);
      setDetectedFrequency(frequency);

      setLastDetectedNote(prevNote => {
        if (frequency > 660 && note !== prevNote) {
          setRecordedNotes(prevNotes => [...prevNotes, note]);
          console.log(note + " - " + frequency);
          return note;
        }
        return prevNote;
      });
    };

    const getNoteFromFrequency = (frequency) => {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const noteIndex = Math.round(12 * Math.log2(frequency / 440) + 69);
      return notes[noteIndex % 12];
    };

    setInterval(detectPitch, 100);
  };

  return (
    <div>
      <h1>Note Recognition</h1>
      <input
        type="file"
        accept="audio/*"
        ref={audioInputRef}
        onChange={handleFileChange}
      />
      <p>Result: {result} ({Math.round(detectedFrequency)} Hz)</p>
      <div>
        <h3>Recorded Notes:</h3>
        <ul>
          {recordedNotes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NoteRecognitionApp;
