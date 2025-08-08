/**
 * Individual RTSP stream viewer component
 * Handles WebSocket connection, video display, and stream controls
 */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import config from '../config';

const StreamContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }
`;

const StreamHeader = styled.div`
  padding: 12px 16px;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
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
  padding: 12px 16px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

const SpeedControls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
`;

const SpeedButton = styled.button`
  background-color: ${props => props.$active ? '#27ae60' : '#e9ecef'};
  color: ${props => props.$active ? 'white' : '#495057'};
  border: 1px solid ${props => props.$active ? '#27ae60' : '#dee2e6'};
  padding: 3px 8px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 32px;

  &:hover:not(:disabled) {
    background-color: ${props => props.$active ? '#229954' : '#27ae60'};
    color: white;
    border-color: #27ae60;
  }

  &:disabled {
    background-color: #f8f9fa;
    color: #adb5bd;
    border-color: #dee2e6;
    cursor: not-allowed;
  }
`;

const SpeedLabel = styled.span`
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
  margin-right: 6px;
`;

const StreamViewer = ({ stream, onRemove }) => {
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [currentFrame, setCurrentFrame] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
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
      console.log('WebSocket readyState:', websocket.readyState);
      console.log('Error details:', {
        type: error.type,
        target: error.target,
        timeStamp: error.timeStamp
      });
      setStatus('error');
      setError('WebSocket connection failed - Check backend logs');
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

      case 'speed_changed':
        setPlaybackSpeed(data.speed);
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

  const handleSpeedChange = (speed) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'set_speed', 
        speed: speed 
      }));
      setPlaybackSpeed(speed);
    }
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isPlaying ? (
            <ControlButton onClick={handlePlay} disabled={status === 'connecting'}>
              ▶ Play
            </ControlButton>
          ) : (
            <ControlButton onClick={handlePause}>
              ⏸ Pause
            </ControlButton>
          )}
          <ControlButton onClick={handleStop}>
            ⏹ Stop
          </ControlButton>
        </div>

        <SpeedControls>
          <SpeedLabel>Speed:</SpeedLabel>
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
            <SpeedButton
              key={speed}
              $active={playbackSpeed === speed}
              onClick={() => handleSpeedChange(speed)}
              disabled={status !== 'connected'}
            >
              {speed}x
            </SpeedButton>
          ))}
        </SpeedControls>

        <ControlButton $variant="danger" onClick={handleRemove}>
          Remove
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