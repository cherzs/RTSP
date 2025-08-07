import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import config from '../config';

const StreamContainer = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const StreamHeader = styled.div`
  padding: 15px;
  background: #2c3e50;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StreamTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const StreamStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.$status) {
      case 'connected': return '#27ae60';
      case 'connecting': return '#f39c12';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
`;

const ViewerCount = styled.span`
  font-size: 0.8rem;
  color: #bdc3c7;
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const VideoElement = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const PlaceholderText = styled.div`
  color: #95a5a6;
  text-align: center;
  font-size: 1.1rem;
`;

const Controls = styled.div`
  padding: 15px;
  background: #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const ControlButton = styled.button`
  background-color: ${props => props.$variant === 'danger' ? '#e74c3c' : '#3498db'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;

  &:hover:not(:disabled) {
    background-color: ${props => props.$variant === 'danger' ? '#c0392b' : '#2980b9'};
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
`;

const StreamInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StreamUrl = styled.div`
  font-size: 0.8rem;
  color: #7f8c8d;
  font-family: monospace;
  word-break: break-all;
`;

const LastUpdate = styled.div`
  font-size: 0.7rem;
  color: #95a5a6;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background: #fdf2f2;
  padding: 10px;
  font-size: 0.9rem;
  border-left: 4px solid #e74c3c;
`;

const StreamViewer = ({ stream, onRemove }) => {
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [currentFrame, setCurrentFrame] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    setError(null);

    const wsUrl = `${config.WS_BASE_URL}/ws/stream/${stream.id}/`;
    console.log('Connecting to WebSocket:', wsUrl);
    console.log('Config WS_BASE_URL:', config.WS_BASE_URL);
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log(`WebSocket connected for stream ${stream.id}`);
      setStatus('connected');
      setWs(websocket);
      wsRef.current = websocket;
      
      // Start the stream
      websocket.send(JSON.stringify({
        type: 'start_stream',
        rtsp_url: stream.rtsp_url
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    websocket.onclose = () => {
      console.log(`WebSocket closed for stream ${stream.id}`);
      setStatus('disconnected');
      setIsPlaying(false);
      wsRef.current = null;
    };

    websocket.onerror = (error) => {
      console.error(`WebSocket error for stream ${stream.id}:`, error);
      setStatus('error');
      setError('WebSocket connection failed');
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connection_established':
        console.log('WebSocket connection established');
        break;
        
      case 'stream_started':
        setIsPlaying(true);
        setError(null);
        break;
        
      case 'frame':
        setCurrentFrame(`data:image/jpeg;base64,${data.frame}`);
        setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
        break;
        
      case 'error':
        setError(data.message);
        setStatus('error');
        break;
        
      case 'stream_stopped':
        setIsPlaying(false);
        setCurrentFrame(null);
        break;

      case 'stream_resumed':
        setIsPlaying(true);
        break;

      case 'stream_paused':
        setIsPlaying(false);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handlePlay = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectWebSocket();
    } else {
      ws.send(JSON.stringify({ type: 'play' }));
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'pause' }));
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop_stream' }));
      ws.close();
    }
    setCurrentFrame(null);
    setIsPlaying(false);
    setStatus('disconnected');
    setWs(null);
    wsRef.current = null;
  };

  const handleRemove = () => {
    handleStop();
    onRemove(stream.id);
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  return (
    <StreamContainer>
      <StreamHeader>
        <StreamTitle>{stream.title || `Stream ${stream.id.slice(0, 8)}`}</StreamTitle>
        <StreamStatus>
          <StatusIndicator $status={status} />
          <ViewerCount>{getStatusText()}</ViewerCount>
        </StreamStatus>
      </StreamHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <VideoContainer>
        {currentFrame ? (
          <VideoElement src={currentFrame} alt="Live stream" />
        ) : (
          <PlaceholderText>
            {status === 'connecting' 
              ? 'Connecting to stream...' 
              : status === 'error' 
                ? 'Stream unavailable' 
                : 'Click Play to start stream'
            }
          </PlaceholderText>
        )}
      </VideoContainer>

      <Controls>
        <div>
          {!isPlaying ? (
            <ControlButton onClick={handlePlay} disabled={status === 'connecting'}>
              ▶ Play
            </ControlButton>
          ) : (
            <ControlButton onClick={handlePause}>
              ⏸ Pause
            </ControlButton>
          )}
          <ControlButton onClick={handleStop} style={{ marginLeft: '8px' }}>
            ⏹ Stop
          </ControlButton>
        </div>

        <ControlButton $variant="danger" onClick={handleRemove}>
          🗑 Remove
        </ControlButton>
      </Controls>

      <StreamInfo>
        <StreamUrl>{stream.rtsp_url}</StreamUrl>
        {lastUpdate && <LastUpdate>Last update: {lastUpdate}</LastUpdate>}
      </StreamInfo>
    </StreamContainer>
  );
};

export default StreamViewer;