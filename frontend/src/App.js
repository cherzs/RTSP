import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { FaVideo, FaSignal, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import StreamInput from './components/StreamInput';
import StreamGrid from './components/StreamGrid';
import config from './config';
import './App.css';

function App() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/health/`);
        if (response.ok) {
          showMessage('Backend connected successfully', 'success');
        } else {
          showMessage('Backend is not responding properly', 'danger');
        }
      } catch (error) {
        showMessage('Cannot connect to backend. Please ensure it is running.', 'danger');
      }
    };

    checkBackendHealth();
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/streams/`);
      if (response.ok) {
        const data = await response.json();
        setStreams(data.results || data);
      }
    } catch (error) {
      // Handle error silently - streams will remain empty
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAddStream = async (streamData) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/streams/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(streamData),
      });

      if (response.ok) {
        const newStream = await response.json();
        setStreams(prev => [...prev, newStream]);
        showMessage(`Stream "${newStream.title}" added successfully!`, 'success');
      } else {
        const errorData = await response.json();
        showMessage(`Error adding stream: ${errorData.detail || 'Unknown error'}`, 'danger');
      }
    } catch (error) {
      showMessage(`Network error: ${error.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStream = async (streamId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/streams/${streamId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStreams(prev => prev.filter(stream => stream.id !== streamId));
        showMessage('Stream removed successfully', 'success');
      } else {
        showMessage('Error removing stream', 'danger');
      }
    } catch (error) {
      showMessage(`Network error: ${error.message}`, 'danger');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all streams?')) {
      streams.forEach(stream => {
        handleRemoveStream(stream.id);
      });
    }
  };

  return (
    <div className="app-container">
      <Container fluid className="py-4">
        <Row>
          <Col>
            {/* Header */}
            <header className="text-center mb-4 text-white">
              <h1 className="display-4 fw-bold mb-2 d-flex align-items-center justify-content-center gap-3">
                <FaVideo className="text-primary" />
                RTSP Stream Viewer
              </h1>
              <p className="lead opacity-75 d-flex align-items-center justify-content-center gap-2">
                <FaSignal size={18} />
                View live RTSP camera streams in your browser
              </p>
            </header>

            {/* Main Content */}
            <main className="main-content">
              {message && (
                <Alert 
                  variant={message.type} 
                  dismissible 
                  onClose={() => setMessage(null)}
                  className="d-flex align-items-center"
                >
                  <span className="me-2">
                    {message.type === 'danger' && <FaExclamationTriangle />}
                    {message.type === 'success' && <FaCheckCircle />}
                    {message.type === 'info' && <FaSignal />}
                  </span>
                  {message.text}
                </Alert>
              )}

              <StreamInput onAddStream={handleAddStream} loading={loading} />
              
              <StreamGrid 
                streams={streams} 
                onRemoveStream={handleRemoveStream}
                onClearAll={handleClearAll}
              />
            </main>

            {/* Footer */}
            <footer className="text-center mt-5 text-white-50">
              <p className="mb-0">
                Built with React & Django | 
                <a 
                  href="https://github.com/cherzs/RTSP" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white-50 text-decoration-none ms-1"
                >
                  View Source Code
                </a>
              </p>
            </footer>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;