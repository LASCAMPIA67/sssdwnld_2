module.exports = {
  // L'environnement dans lequel les tests seront exécutés
  testEnvironment: 'node',

  // Répertoire où les rapports de couverture seront générés
  coverageDirectory: 'coverage',

  // Fichiers à inclure dans le rapport de couverture. C'est plus fiable que d'exclure.
  collectCoverageFrom: [
    './routes/**/*.js',
    './services/**/*.js',
    './middleware/**/*.js',
    './config/**/*.js',
    '!./config/swagger.js', // Exclure les fichiers de config non testables
  ],

  // Rapports de couverture à générer (utile pour les intégrations comme Codecov)
  coverageReporters: ['text', 'lcov', 'clover', 'json'],

  // Appliquer un standard minimum de couverture de test
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    },
  },

  // Fichier à exécuter avant chaque suite de tests (pour la configuration)
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Pattern pour trouver les fichiers de test
  testMatch: ['<rootDir>/test/**/*.test.js'],

  // Timeout maximum pour un seul test (en millisecondes)
  testTimeout: 30000,

  // Affiche les résultats de chaque test individuel
  verbose: true,

  // Réinitialise automatiquement les mocks avant chaque test
  clearMocks: true,

  // Restaure automatiquement les mocks qui ont été espionnés
  restoreMocks: true,
};