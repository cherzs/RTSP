/**
 * Grid layout component for displaying multiple RTSP streams
 * Responsive grid that adapts to screen size and number of streams
 */
import React from 'react';
import styled from 'styled-components';
import StreamViewer from './StreamViewer';

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
`;

const EmptyStateText = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #5a6c7d;
`;

const EmptyStateSubtext = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  max-width: 400px;
  margin: 0 auto;
`;

const GridHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 5px;
`;

const StreamCount = styled.h2`
  color: #2c3e50;
  font-size: 1.5rem;
  margin: 0;
`;

const GridControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ControlButton = styled.button`
  background: white;
  border: 2px solid #e0e0e0;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: #3498db;
    color: #3498db;
  }

  &.active {
    background-color: #3498db;
    border-color: #3498db;
    color: white;
  }
`;

const StreamGrid = ({ streams, onRemoveStream, onClearAll }) => {
  if (streams.length === 0) {
    return (
      <EmptyState>
        <EmptyStateIcon></EmptyStateIcon>
        <EmptyStateText>No streams added yet</EmptyStateText>
        <EmptyStateSubtext>
          Add an RTSP stream URL above to start viewing live camera feeds. 
          You can add multiple streams and view them simultaneously in a grid layout.
        </EmptyStateSubtext>
      </EmptyState>
    );
  }

  return (
    <>
      <GridHeader>
        <StreamCount>
          {streams.length} Stream{streams.length !== 1 ? 's' : ''}
        </StreamCount>
        <GridControls>
          {streams.length > 1 && (
            <ControlButton onClick={onClearAll}>
              Clear All
            </ControlButton>
          )}
        </GridControls>
      </GridHeader>

      <GridContainer>
        {streams.map((stream) => (
          <StreamViewer
            key={stream.id}
            stream={stream}
            onRemove={onRemoveStream}
          />
        ))}
      </GridContainer>
    </>
  );
};

export default StreamGrid;