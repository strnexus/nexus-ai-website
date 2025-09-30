import winston from 'winston';

// Custom log format for better readability
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ' ' + JSON.stringify(meta, null, 2);
    }
    
    return logMessage;
  })
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;
    
    // Add metadata if present (simplified for console)
    if (Object.keys(meta).length > 0) {
      const metaStr = JSON.stringify(meta);
      if (metaStr.length < 200) {
        logMessage += ` ${metaStr}`;
      } else {
        logMessage += ` [metadata: ${Object.keys(meta).join(', ')}]`;
      }
    }
    
    return logMessage;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ai-tools-pipeline' },
  transports: [
    // Console output (always enabled for development)
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    }),

    // File output for production
    new winston.transports.File({
      filename: 'logs/pipeline-error.log',
      level: 'error',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      format: logFormat
    }),

    new winston.transports.File({
      filename: 'logs/pipeline.log',
      level: 'info',
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
      format: logFormat
    })
  ]
});

// Add custom log levels for pipeline-specific events
logger.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  debug: 'green'
});

// Pipeline-specific logging helpers
export const pipelineLogger = {
  start: (pipelineName: string, options?: any) => {
    logger.info(`🚀 Starting ${pipelineName}`, options);
  },

  complete: (pipelineName: string, stats?: any) => {
    logger.info(`✅ Completed ${pipelineName}`, stats);
  },

  error: (pipelineName: string, error: any, context?: any) => {
    logger.error(`❌ ${pipelineName} failed`, {
      error: error.message || error,
      stack: error.stack,
      ...context
    });
  },

  progress: (message: string, current?: number, total?: number) => {
    if (current !== undefined && total !== undefined) {
      const percentage = Math.round((current / total) * 100);
      logger.info(`🔄 ${message} (${current}/${total} - ${percentage}%)`);
    } else {
      logger.info(`🔄 ${message}`);
    }
  },

  source: (sourceName: string, action: string, stats?: any) => {
    logger.info(`📡 ${sourceName}: ${action}`, stats);
  },

  quality: (message: string, toolName?: string, issues?: any[]) => {
    const meta = toolName ? { tool: toolName, issues } : { issues };
    logger.info(`🔍 Quality Check: ${message}`, meta);
  },

  duplicate: (message: string, toolNames?: string[], confidence?: number) => {
    logger.info(`🔍 Duplicate Detection: ${message}`, { 
      tools: toolNames, 
      confidence 
    });
  },

  review: (message: string, toolName?: string, reason?: string) => {
    logger.warn(`📋 Review Queue: ${message}`, { 
      tool: toolName, 
      reason 
    });
  }
};

// Export for use in tests or when custom configuration is needed
export { winston };

// Ensure log directory exists
import { promises as fs } from 'fs';
import path from 'path';

const logDir = path.dirname('logs/pipeline.log');
fs.mkdir(logDir, { recursive: true }).catch(err => {
  console.warn(`Could not create log directory: ${err.message}`);
});

export default logger;