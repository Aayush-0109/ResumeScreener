import { logger, logWithContext } from './src/utils/logger'

// Test different log levels
logger.info('Logger setup complete');
logger.warn('This is a warning');
logger.error('This is an error');

// Test structured logging
logWithContext('info', 'User action', {
  userId: 'user-123',
  action: 'test',
  correlationId: 'test-123'
});

console.log('✅ Check your console - you should see formatted logs!');