/**
 * RTSP URL input form component with Bootstrap
 * Allows users to add new streams with URL validation
 */
import React, { useState } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
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
    <div className="modern-card p-4 mb-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="p-2 bg-primary bg-opacity-10 rounded-circle">
          <FaPlus className="text-primary" size={16} />
        </div>
        <div>
          <h5 className="mb-1 text-dark fw-semibold">Tambah Stream Baru</h5>
          <p className="text-muted mb-0 small">Masukkan URL RTSP atau pilih contoh stream</p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-medium text-dark mb-2">
                URL Stream RTSP
              </Form.Label>
              <Form.Control
                type="url"
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                placeholder="rtsp://username:password@ip:port/path"
                required
                disabled={loading}
                className="border-1 rounded-2"
                style={{ padding: '12px 16px' }}
              />
            </Form.Group>
          </Col>
          
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-medium text-dark mb-2">
                Nama Stream (Opsional)
              </Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kamera Ruang Tamu"
                disabled={loading}
                className="border-1 rounded-2"
                style={{ padding: '12px 16px' }}
              />
            </Form.Group>
          </Col>
          
          <Col md={2} className="d-flex align-items-end">
            <Button 
              type="submit" 
              disabled={loading || !rtspUrl.trim()}
              className="w-100 btn-clean btn-primary-clean"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Loading...
                </>
              ) : (
                <>
                  <FaPlus size={14} className="me-2" />
                  Tambah
                </>
              )}
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Example Streams */}
      <div className="mt-4 p-3 bg-light rounded-3">
        <div className="d-flex align-items-center gap-2 mb-3">
          <FaExternalLinkAlt className="text-primary" size={14} />
          <h6 className="mb-0 text-dark fw-medium">Contoh Stream (klik untuk menggunakan)</h6>
        </div>
        <div className="row g-2">
          {exampleStreams.map((url, index) => (
            <div key={index} className="col-12">
              <div
                onClick={() => handleExampleClick(url)}
                className="p-3 bg-white rounded-2 border cursor-pointer"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#dee2e6';
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <FaVideo className="text-primary flex-shrink-0" size={14} />
                  <div className="flex-grow-1 min-w-0">
                    <p className="mb-1 fw-medium text-dark small">
                      {index === 0 ? 'RTSP Camera Stream' : 'Sample Video Stream'}
                    </p>
                    <code className="text-muted small text-truncate d-block">
                      {url}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreamInput;