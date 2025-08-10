/**
 * Bootstrap Grid layout component for displaying multiple RTSP streams
 * Responsive grid with larger video cards - 2 per row on desktop
 */
import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { FaVideo, FaTimes } from 'react-icons/fa';
import StreamViewer from './StreamViewer';

const StreamGrid = ({ streams, onRemoveStream, onClearAll }) => {
  if (streams.length === 0) {
    return (
      <Card className="text-center border-0 bg-light">
        <Card.Body className="py-5">
          <div className="mb-3" style={{ fontSize: '4rem', opacity: 0.5 }}>
            <FaVideo className="text-muted" />
          </div>
          <Card.Title as="h3" className="text-muted mb-3">
            No Streams Added Yet
          </Card.Title>
          <Card.Text className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
            Add your first RTSP stream using the form above. You can use one of the example URLs or provide your own camera stream.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      {/* Grid Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="text-dark mb-0">
          {streams.length} Stream{streams.length !== 1 ? 's' : ''}
        </h4>
        {streams.length > 0 && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={onClearAll}
            className="d-flex align-items-center gap-2"
          >
            <FaTimes size={12} />
            Clear All
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