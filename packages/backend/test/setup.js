// Fichier de configuration exécuté avant chaque suite de tests (configuré via setupFilesAfterEnv)

// 1. Définir les variables d'environnement spécifiques aux tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error'; // N'afficher que les erreurs pour garder la sortie des tests propre

// 2. Simuler les modules externes pour isoler les tests
// On simule ici le client Redis pour éviter toute connexion réelle à une base de données pendant les tests.
jest.mock('redis', () => {
  // Créer un mock pour le client Redis lui-même
  const redisClientMock = {
    connect: jest.fn().mockResolvedValue(),
    quit: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
    isOpen: true, // Simuler un client connecté par défaut
  };

  // Le module 'redis' exporte 'createClient', donc on simule cette fonction
  return {
    createClient: jest.fn(() => redisClientMock),
  };
});


// 3. Nettoyer les mocks après chaque test pour garantir l'isolation
afterEach(() => {
  // Réinitialise l'état de tous les mocks (appels, instances, etc.)
  jest.clearAllMocks();
});