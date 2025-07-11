// packages/backend/test/setup.js
// Configuration pour les tests

// Variables d'environnement de test
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';

// Mock Redis pour les tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    dbSize: jest.fn(() => 0),
    info: jest.fn(() => 'redis_version:7.0.0'),
    on: jest.fn(),
    isOpen: false
  }))
}));

// Timeout global pour les tests
jest.setTimeout(30000);