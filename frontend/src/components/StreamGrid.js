/**
 * Bootstrap Grid layout component for displaying multiple RTSP streams
 * Responsive grid with larger video cards - 2 per row on desktop
 */
import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { FaVideo, FaTimes } from 'react-icons/fa';
import StreamViewer from './StreamViewer';

const StreamGrid = ({ streams, onRemoveStream, onClearAll }) => {
  if (streams.length === 0) {
    return (
      <div className="text-center py-5">
        <div 
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-4"
          style={{ width: '120px', height: '120px' }}
        >
          <FaVideo className="text-muted" size={48} />
        </div>
        <h3 className="text-dark mb-3 fw-bold">Belum Ada Stream</h3>
        <p className="text-muted mx-auto mb-4" style={{ maxWidth: '500px' }}>
          Tambahkan stream RTSP pertama Anda menggunakan form di atas. 
          Anda dapat menggunakan salah satu contoh URL atau menyediakan stream kamera Anda sendiri.
        </p>
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
            Real-time Streaming
          </span>
          <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
            Multi-camera Support
          </span>
          <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill">
            Remote Access
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Clean Grid Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 bg-primary bg-opacity-10 rounded-circle">
            <FaVideo className="text-primary" size={16} />
          </div>
          <div>
            <h4 className="text-dark mb-0 fw-semibold">
              {streams.length} Stream{streams.length !== 1 ? 's' : ''} Aktif
            </h4>
            <small className="text-muted">Menampilkan semua stream yang tersedia</small>
          </div>
        </div>
        {streams.length > 0 && (
          <Button
            variant="outline-danger"
            onClick={onClearAll}
            className="btn-clean d-flex align-items-center gap-2"
            style={{
              background: 'transparent',
              border: '1px solid #dc3545',
              color: '#dc3545'
            }}
          >
            <FaTimes size={12} />
            <span>Hapus Semua</span>
          </Button>
        )}
      </div>

      {/* Responsive Grid - Larger video cards */}
      <Row className="g-4">
        {streams.map((stream) => (
          <Col 
            key={stream.id} 
            xs={12}      // Mobile: always full width
            lg={streams.length === 1 ? 12 : 6}  // Desktop: full width if single stream, half width for multiple
          >
            <StreamViewer 
              stream={stream} 
              onRemove={onRemoveStream}
              isFullscreen={streams.length === 1}
            />
          </Col>
        ))}
      </Row>
    </>
  );
};

export default StreamGrid;