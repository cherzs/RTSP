import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import StreamInput from './components/StreamInput';
import StreamGrid from './components/StreamGrid';
import config from './config';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg,rgb(45, 50, 70) 0%,rgb(113, 109, 117) 100%);
  padding: 20px 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 32px;
  color: white;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  font-weight: 300;
`;

const MainContent = styled.main`
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StatusBar = styled.div`
  background: ${props => props.type === 'error' ? '#e74c3c' : props.type === 'success' ? '#27ae60' : '#3498db'};
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Footer = styled.footer`
  text-align: center;
  margin-top: 40px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
`;

const FooterLink = styled.a`
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

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
          showMessage('Backend is not responding properly', 'error');
        }
      } catch (error) {
        showMessage('Cannot connect to backend. Please ensure it is running.', 'error');
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
      console.error('Error loading streams:', error);
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
        showMessage(`Error adding stream: ${errorData.detail || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showMessage(`Network error: ${error.message}`, 'error');
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
        showMessage('Error removing stream', 'error');
      }
    } catch (error) {
      showMessage(`Network error: ${error.message}`, 'error');
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
    <AppContainer>
      <Container>
        <Header>
          <Title> RTSP Stream Viewer</Title>
          <Subtitle>View live RTSP camera streams in your browser</Subtitle>
        </Header>

        <MainContent>
          {message && (
            <StatusBar type={message.type}>
              <span>
                {message.type === 'error' && '❌'}
                {message.type === 'success' && ''}
                {message.type === 'info' && 'ℹ️'}
              </span>
              {message.text}
            </StatusBar>
          )}

          <StreamInput onAddStream={handleAddStream} loading={loading} />
          
          <StreamGrid 
            streams={streams} 
            onRemoveStream={handleRemoveStream}
            onClearAll={handleClearAll}
          />
        </MainContent>

        <Footer>
          <p>
            Built with React & Django | 
            <FooterLink href="https://github.com/cherzs/RTSP" target="_blank" rel="noopener noreferrer">
              {' '}View Source Code
            </FooterLink>
          </p>
        </Footer>
      </Container>
    </AppContainer>
  );
}

export default App;