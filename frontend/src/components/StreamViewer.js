/**
 * Individual RTSP stream viewer component with Bootstrap
 * Handles WebSocket connection, video display, and stream controls
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Badge, Alert } from 'react-bootstrap';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaTrash,
  FaVideo,
  FaExclamationTriangle
} from 'react-icons/fa';
import config from '../config';

const StreamViewer = ({ stream, onRemove, isFullscreen = false }) => {
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
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
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
        // Handle parsing errors silently
        setError('Invalid message format received');
      }
    };

    websocket.onclose = () => {
      setStatus('disconnected');
      setIsPlaying(false);
      wsRef.current = null;
    };

    websocket.onerror = (error) => {
      setStatus('error');
      setError('WebSocket connection failed - Check backend logs');
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connection_established':
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
        // Handle unknown message types silently
        break;
    }
  };

  const handlePlay = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectWebSocket();
    } else {
      if (!isPlaying) {
        ws.send(JSON.stringify({ type: 'play' }));
      }
    }
  };

  const handlePause = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'pause' }));
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
      case 'connected': return 'Terhubung';
      case 'connecting': return 'Menghubungkan...';
      case 'error': return 'Error';
      default: return 'Terputus';
    }
  };

  return (
    <div className="modern-card h-100">
      {/* Clean Header */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 bg-primary bg-opacity-10 rounded-circle">
            <FaVideo className="text-primary" size={14} />
          </div>
          <div>
            <h6 className="mb-0 text-dark fw-semibold">
              {stream.title || `Stream ${stream.id.slice(0, 8)}`}
            </h6>
            <small className="text-muted">Stream Langsung</small>
          </div>
        </div>
        <Badge 
          bg={getStatusVariant()} 
          className="px-3 py-2 rounded-pill badge-enhanced"
          style={{ fontSize: '0.75rem' }}
        >
          {getStatusText()}
        </Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="m-3 mb-0">
          <div className="d-flex align-items-center gap-2">
            <FaExclamationTriangle size={14} />
            <small className="mb-0 fw-medium">{error}</small>
          </div>
        </Alert>
      )}

      {/* Clean Video Container */}
      <div 
        className={`position-relative bg-dark d-flex align-items-center justify-content-center ${isFullscreen ? 'stream-fullscreen' : ''}`}
        style={{ 
          height: isFullscreen ? '400px' : '300px',
          minHeight: isFullscreen ? '400px' : '300px',
          background: '#f8f9fa'
        }}
      >
        {currentFrame ? (
          <div className="position-relative w-100 h-100">
            <img 
              src={currentFrame} 
              alt="Live stream" 
              className="img-fluid w-100 h-100"
              style={{ 
                objectFit: 'cover',
                transition: 'all 0.3s ease'
              }}
            />
            {/* Live indicator */}
            <div className="position-absolute top-0 start-0 m-3">
              <Badge bg="danger" className="px-3 py-2 rounded-pill d-flex align-items-center gap-2 fw-bold">
                <span 
                  className="bg-white rounded-circle" 
                  style={{ 
                    width: '8px', 
                    height: '8px',
                    animation: 'pulse 1.5s infinite'
                  }}
                ></span>
                LANGSUNG
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted">
            <div className="mb-3">
              {status === 'error' ? (
                <FaExclamationTriangle 
                  className="text-warning" 
                  size={isFullscreen ? 48 : 36} 
                />
              ) : status === 'connecting' ? (
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <FaVideo 
                  className="text-muted" 
                  size={isFullscreen ? 48 : 36} 
                />
              )}
            </div>
            <div style={{ fontSize: isFullscreen ? '1.1rem' : '0.95rem' }} className="fw-medium">
              {status === 'connecting' 
                ? 'Menghubungkan ke stream...' 
                : status === 'error' 
                  ? 'Stream tidak tersedia' 
                  : 'Klik tombol Play untuk memulai'
              }
            </div>
            {status === 'disconnected' && (
              <small className="text-muted mt-2 d-block">
                Stream siap untuk diputar
              </small>
            )}
          </div>
        )}
      </div>

      {/* Clean Controls */}
      <div className="p-3 border-top">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          {/* Play Controls */}
          <div className="d-flex gap-2">
            {!isPlaying ? (
              <Button 
                onClick={handlePlay} 
                disabled={status === 'connecting'}
                className="btn-clean btn-primary-clean d-flex align-items-center gap-2"
              >
                <FaPlay size={12} />
                <span>Putar</span>
              </Button>
            ) : (
              <Button 
                onClick={handlePause}
                className="btn-clean btn-secondary-clean d-flex align-items-center gap-2"
              >
                <FaPause size={12} />
                <span>Jeda</span>
              </Button>
            )}
            <Button 
              onClick={handleStop}
              className="btn-clean btn-secondary-clean d-flex align-items-center gap-2"
            >
              <FaStop size={12} />
              <span>Stop</span>
            </Button>
          </div>

          {/* Remove Button */}
          <Button 
            onClick={handleRemove}
            className="btn-clean d-flex align-items-center gap-2"
            style={{
              background: 'transparent',
              border: '1px solid #dc3545',
              color: '#dc3545'
            }}
          >
            <FaTrash size={12} />
            <span>Hapus</span>
          </Button>
        </div>



        {/* Stream Info */}
        <div className="mt-3 pt-3 border-top">
          <div className="mb-2">
            <h6 className="mb-2 text-dark small fw-semibold d-flex align-items-center gap-2">
              <FaVideo size={12} className="text-primary" />
              URL Stream:
            </h6>
            <div className="bg-light rounded p-2">
              <code className="text-dark small d-block text-truncate fw-medium">
                {stream.rtsp_url}
              </code>
            </div>
          </div>
          {lastUpdate && (
            <div className="d-flex align-items-center gap-2 mt-3">
              <div 
                className="bg-success rounded-circle" 
                style={{ 
                  width: '8px', 
                  height: '8px',
                  animation: 'pulse 2s infinite'
                }}
              ></div>
              <small className="text-success fw-medium">
                Terakhir diperbarui: {lastUpdate}
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamViewer;