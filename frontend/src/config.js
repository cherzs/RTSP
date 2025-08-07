const config = {
  // API Base URL
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  
  // WebSocket URL
  WS_BASE_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:8000',
  
  // Default stream settings
  DEFAULT_STREAM_SETTINGS: {
    quality: 'medium',
    autoPlay: true,
    showControls: true
  },
  
  // Grid settings
  GRID_SETTINGS: {
    maxColumns: 4,
    defaultColumns: 2,
    minStreamWidth: 300
  }
};

export default config;