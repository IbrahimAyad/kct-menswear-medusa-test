// Training Configuration for Live API Testing
// Update CHAT_API_URL with your Railway deployment URL

module.exports = {
  // API Configuration - UPDATE THIS WITH YOUR RAILWAY URL
  CHAT_API_URL: process.env.CHAT_API_URL || 'https://your-railway-app.railway.app',
  CHAT_API_KEY: process.env.CHAT_API_KEY || '',
  
  // API Endpoints
  endpoints: {
    startConversation: '/api/v3/chat/conversation/start',
    sendMessage: '/api/v3/chat/conversation/message',
    getHistory: '/api/v3/chat/conversation/history',
    endConversation: '/api/v3/chat/conversation/end',
    analytics: '/api/v3/chat/analytics/patterns',
    health: '/api/v3/chat/health'
  },
  
  // Training Configuration
  RUN_LIVE_TESTS: process.env.RUN_LIVE_TESTS === 'true' || false,
  TEST_TIMEOUT: parseInt(process.env.TEST_TIMEOUT) || 30000,
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
  
  // Performance Thresholds
  MIN_SUCCESS_RATE: parseFloat(process.env.MIN_SUCCESS_RATE) || 85,
  MAX_RESPONSE_TIME: parseInt(process.env.MAX_RESPONSE_TIME) || 500,
  MIN_CONVERSION_RATE: parseFloat(process.env.MIN_CONVERSION_RATE) || 45,
  
  // Framework Testing
  frameworks: {
    PRECISION: { target_conversion: 45, max_response_time: 500 },
    RESTORE: { target_satisfaction: 98, max_resolution_time: 300 },
    ATELIER: { target_engagement: 90, luxury_positioning: true }
  }
};
