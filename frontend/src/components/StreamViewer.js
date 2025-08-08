/**
 * Individual RTSP stream viewer component with Bootstrap
 * Handles WebSocket connection, video display, and stream controls
 */
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, ButtonGroup, Badge, Alert } from 'react-bootstrap';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaTrash,
  FaVideo,
  FaExclamationTriangle
} from 'react-icons/fa';
import config from '../config';

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
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log(`WebSocket connected for stream ${stream.id}`);
      setStatus('connected');
      setWs(websocket);
      wsRef.current = websocket;
      
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
        console.log('Stream paused message received');
        setIsPlaying(false);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handlePlay = () => {
    console.log('Play button clicked, isPlaying:', isPlaying);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('Connecting WebSocket...');
      connectWebSocket();
    } else {
      if (!isPlaying) {
        console.log('Sending play message to server');
        ws.send(JSON.stringify({ type: 'play' }));
      } else {
        console.log('Already playing, ignoring play request');
      }
    }
  };

  const handlePause = () => {
    console.log('Pause button clicked, isPlaying:', isPlaying);
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('Sending pause message to server');
      ws.send(JSON.stringify({ type: 'pause' }));
    } else {
      console.log('WebSocket not ready, ws state:', ws?.readyState);
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





  const getStatusVariant = () => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'danger';
      default: return 'secondary';
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
    <Card className="h-100 shadow-sm">
      {/* Header */}
      <Card.Header className="bg-gradient bg-primary text-white d-flex justify-content-between align-items-center">
        <Card.Title className="mb-0 h6">
          {stream.title || `Stream ${stream.id.slice(0, 8)}`}
        </Card.Title>
        <Badge bg={getStatusVariant()}>
          {getStatusText()}
        </Badge>
      </Card.Header>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="m-2 mb-0">
          <small>{error}</small>
        </Alert>
      )}

      {/* Larger Video Container */}
      <div 
        className="position-relative bg-black d-flex align-items-center justify-content-center"
        style={{ 
          height: '350px',  // Increased from 250px to 350px
          minHeight: '350px'  // Ensure minimum height
        }}
      >
        {currentFrame ? (
          <img 
            src={currentFrame} 
            alt="Live stream" 
            className="img-fluid"
            style={{ 
              maxHeight: '100%', 
              maxWidth: '100%',
              objectFit: 'contain' 
            }}
          />
        ) : (
          <div className="text-center text-muted">
            <div className="mb-3" style={{ fontSize: '3rem', opacity: 0.6 }}>
              {status === 'error' ? (
                <FaExclamationTriangle className="text-warning" />
              ) : (
                <FaVideo />
              )}
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {status === 'connecting' 
                ? 'Connecting to stream...' 
                : status === 'error' 
                  ? 'Stream unavailable' 
                  : 'Click Play to start stream'
              }
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          {/* Play Controls */}
          <ButtonGroup>
            {!isPlaying ? (
              <Button 
                variant="primary" 
                onClick={handlePlay} 
                disabled={status === 'connecting'}
                className="d-flex align-items-center gap-2"
              >
                <FaPlay size={12} />
                Play
              </Button>
            ) : (
              <Button 
                variant="warning" 
                onClick={handlePause}
                className="d-flex align-items-center gap-2"
              >
                <FaPause size={12} />
                Pause
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={handleStop}
              className="d-flex align-items-center gap-2"
            >
              <FaStop size={12} />
              Stop
            </Button>
          </ButtonGroup>

          {/* Remove Button */}
          <Button 
            variant="outline-danger" 
            onClick={handleRemove}
            className="d-flex align-items-center gap-2"
          >
            <FaTrash size={12} />
            Remove
          </Button>
        </div>



        {/* Stream Info */}
        <div className="border-top pt-2">
          <small className="text-muted d-block text-truncate">
            {stream.rtsp_url}
          </small>
          {lastUpdate && (
            <small className="text-muted">
              Last update: {lastUpdate}
            </small>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default StreamViewer;