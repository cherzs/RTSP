/**
 * RTSP URL input form component with Bootstrap
 * Allows users to add new streams with URL validation
 */
import React, { useState } from 'react';
import { Form, Row, Col, Button, Card, ListGroup } from 'react-bootstrap';
import { FaPlus, FaVideo, FaExternalLinkAlt } from 'react-icons/fa';

const StreamInput = ({ onAddStream, loading }) => {
  const [rtspUrl, setRtspUrl] = useState('');
  const [title, setTitle] = useState('');

  const exampleStreams = [
    'rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
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
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold text-dark">
                  RTSP Stream URL
                </Form.Label>
                <Form.Control
                  type="url"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  placeholder="rtsp://username:password@ip:port/path"
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold text-dark">
                  Stream Title (Optional)
                </Form.Label>
                <Form.Control
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Camera Stream"
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            
            <Col md={2} className="d-flex align-items-end">
              <Button 
                type="submit" 
                variant="success" 
                disabled={loading || !rtspUrl.trim()}
                className="w-100 d-flex align-items-center justify-content-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <FaPlus size={14} />
                    Add Stream
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Form>

        {/* Example Streams */}
        <Card className="mt-3 bg-light border-0">
          <Card.Body className="py-3">
            <h6 className="card-title text-dark mb-2 d-flex align-items-center gap-2">
              <FaVideo className="text-primary" />
              Example RTSP Streams (click to use):
            </h6>
            <ListGroup variant="flush">
              {exampleStreams.map((url, index) => (
                <ListGroup.Item 
                  key={index} 
                  action
                  onClick={() => handleExampleClick(url)}
                  className="px-0 py-2 border-0 bg-transparent"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <FaExternalLinkAlt size={10} className="text-muted flex-shrink-0" />
                    <code className="text-muted small text-truncate">
                      {url}
                    </code>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      </Card.Body>
    </Card>
  );
};

export default StreamInput;