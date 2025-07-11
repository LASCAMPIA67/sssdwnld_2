// packages/backend/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'sssdwnld API',
      version: '1.0.0',
      description: 'API pour télécharger des vidéos depuis plusieurs plateformes',
      contact: {
        name: 'LASCAMPIA',
        email: 'contact@lascampia67.fr',
        url: 'https://github.com/LASCAMPIA67'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://sssdwnld.com/api/v1'
          : 'http://localhost:3000/api/v1',
        description: process.env.NODE_ENV === 'production' 
          ? 'Serveur de production'
          : 'Serveur de développement'
      }
    ],
    tags: [
      {
        name: 'Vidéo',
        description: 'Endpoints pour la gestion des vidéos'
      },
      {
        name: 'Système',
        description: 'Endpoints système et monitoring'
      }
    ],
    components: {
      schemas: {
        VideoRequest: {
          type: 'object',
          required: ['url'],
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              description: 'URL de la vidéo à analyser'
            }
          }
        },
        VideoResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            id: {
              type: 'string',
              example: 'a1b2c3d4'
            },
            metadata: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                duration: { type: 'number' },
                duration_formatted: { type: 'string' },
                thumbnail: { type: 'string' },
                description: { type: 'string' },
                uploader: { type: 'string' },
                view_count: { type: 'number' },
                upload_date: { type: 'string' },
                platform: { type: 'string' }
              }
            },
            formats: {
              type: 'object',
              properties: {
                video: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      format_id: { type: 'string' },
                      quality: { type: 'string' },
                      ext: { type: 'string' },
                      filesize_mb: { type: 'number' },
                      resolution: { type: 'string' },
                      fps: { type: 'number' }
                    }
                  }
                },
                audio: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      format_id: { type: 'string' },
                      quality: { type: 'string' },
                      ext: { type: 'string' },
                      filesize_mb: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Une erreur est survenue'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Requête invalide',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFound: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        TooManyRequests: {
          description: 'Trop de requêtes',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        InternalError: {
          description: 'Erreur serveur',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './server.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};