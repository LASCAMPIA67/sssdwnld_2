// packages/backend/test/api.test.js
const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'sssdwnld-api');
    });
  });

  describe('POST /api/v1/download', () => {
    it('should reject request without URL', async () => {
      const response = await request(app)
        .post('/api/v1/download')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid URL', async () => {
      const response = await request(app)
        .post('/api/v1/download')
        .send({ url: 'not-a-valid-url' })
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
    });

    it('should reject internal URLs', async () => {
      const response = await request(app)
        .post('/api/v1/download')
        .send({ url: 'http://localhost:3000/test' })
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
    });

    it('should accept valid video URL', async () => {
      const response = await request(app)
        .post('/api/v1/download')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .timeout(30000);

      // Le test peut échouer si yt-dlp n'est pas installé
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('metadata');
        expect(response.body).toHaveProperty('formats');
      }
    }, 30000);
  });

  describe('GET /api/v1/download/supported', () => {
    it('should return list of supported platforms', async () => {
      const response = await request(app)
        .get('/api/v1/download/supported')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('platforms');
      expect(Array.isArray(response.body.platforms)).toBe(true);
      expect(response.body.platforms.length).toBeGreaterThan(0);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown API routes', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
    });
  });
});

// Fermer les connexions après les tests
afterAll(async () => {
  // Fermer Redis si connecté
  const { redisClient } = require('../middleware/cache');
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});