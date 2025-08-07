/**
 * RTSP URL input form component
 * Allows users to add new streams with URL validation
 */
import React, { useState } from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
  }

  &::placeholder {
    color: #95a5a6;
  }
`;

const Button = styled.button`
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.3s ease;
  min-width: 120px;

  &:hover:not(:disabled) {
    background-color: #219a52;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const ExampleStreams = styled.div`
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
`;

const ExampleTitle = styled.h4`
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 0.9rem;
`;

const ExampleUrl = styled.div`
  font-family: monospace;
  font-size: 0.8rem;
  color: #7f8c8d;
  background: white;
  padding: 8px;
  border-radius: 3px;
  margin-bottom: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e9ecef;
  }
`;

const StreamInput = ({ onAddStream, loading }) => {
  const [rtspUrl, setRtspUrl] = useState('');
  const [title, setTitle] = useState('');

  const exampleStreams = [
    'https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0',
    'rtsp://192.168.18.14:8080/h264_ulaw.sdp',  // IP Webcam (local only)
    'http://192.168.18.14:8080/video',          // IP Webcam HTTP (local only)
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rtspUrl.trim()) {
      onAddStream({
        rtsp_url: rtspUrl.trim(),
        title: title.trim() || undefined
      });
      setRtspUrl('');
      setTitle('');
    }
  };

  const handleExampleClick = (url) => {
    setRtspUrl(url);
  };

  return (
    <InputContainer>
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="rtsp-url">RTSP Stream URL</Label>
          <Input
            id="rtsp-url"
            type="url"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            placeholder="rtsp://username:password@ip:port/path"
            required
            disabled={loading}
          />
        </InputGroup>
        
        <InputGroup>
          <Label htmlFor="stream-title">Stream Title (Optional)</Label>
          <Input
            id="stream-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Camera Stream"
            disabled={loading}
          />
        </InputGroup>
        
        <Button type="submit" disabled={loading || !rtspUrl.trim()}>
          {loading ? 'Adding...' : 'Add Stream'}
        </Button>
      </Form>

      <ExampleStreams>
        <ExampleTitle>Example RTSP Streams (click to use):</ExampleTitle>
        {exampleStreams.map((url, index) => (
          <ExampleUrl 
            key={index} 
            onClick={() => handleExampleClick(url)}
            title="Click to use this URL"
          >
            {url}
          </ExampleUrl>
        ))}
      </ExampleStreams>
    </InputContainer>
  );
};

export default StreamInput;