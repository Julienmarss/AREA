# 🧪 Tests Backend AREA

Ce dossier contient tous les tests unitaires et d'intégration pour le backend de l'application AREA.

## 📋 Table des Matières

- [Structure des Tests](#structure-des-tests)
- [Configuration](#configuration)
- [Exécution des Tests](#exécution-des-tests)
- [Couverture de Code](#couverture-de-code)
- [Écrire des Tests](#écrire-des-tests)
- [Mocks et Stubs](#mocks-et-stubs)

---

## 📁 Structure des Tests

```
__tests__/
├── setup.ts                        # Configuration globale des tests
├── README.md                       # Ce fichier
│
├── # Tests des Services
├── services.test.ts                # Tests Discord & GitHub services
├── spotify.service.test.ts         # Tests Spotify service
├── google.service.test.ts          # Tests Google/Gmail service
├── timer.service.test.ts           # Tests Timer service
│
├── # Tests des Modèles & Storage
├── area.model.test.ts              # Tests InMemoryDB (AREA & Tokens)
├── user.storage.test.ts            # Tests UserStorage
│
├── # Tests des Utilitaires
├── auth.test.ts                    # Tests utils d'authentification (hash, JWT)
│
├── # Tests d'Intégration
├── api.integration.test.ts         # Tests API complets
└── areas.integration.test.ts       # Tests endpoints AREA
```

---

## ⚙️ Configuration

### Prérequis

```bash
cd server
npm install
```

### Configuration Jest

Le fichier `jest.config.js` est déjà configuré :

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  verbose: true,
};
```

### Variables d'Environnement

Les tests utilisent un fichier `.env.test` (optionnel) :

```env
NODE_ENV=test
JWT_SECRET=test-secret-key
```

---

## 🚀 Exécution des Tests

### Tous les tests

```bash
npm test
```

### Tests en mode watch (développement)

```bash
npm test -- --watch
```

### Tester un fichier spécifique

```bash
npm test -- services.test.ts
npm test -- spotify.service.test.ts
npm test -- areas.integration.test.ts
```

### Tests avec couverture

```bash
npm test -- --coverage
```

### Tests en mode verbeux

```bash
npm test -- --verbose
```

### Tests avec pattern

```bash
# Tous les tests de services
npm test -- --testPathPattern=service

# Tous les tests d'intégration
npm test -- --testPathPattern=integration

# Tests contenant "Discord"
npm test -- --testNamePattern=Discord
```

---

## 📊 Couverture de Code

### Générer un rapport de couverture

```bash
npm test -- --coverage
```

### Voir le rapport HTML

```bash
npm test -- --coverage
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Objectifs de Couverture

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 75,
      "lines": 80,
      "statements": 80
    }
  }
}
```

---

## ✍️ Écrire des Tests

### Template de Test

```typescript
import { MyService } from '../services/MyService';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    // Setup avant chaque test
    service = new MyService();
  });

  afterEach(() => {
    // Nettoyage après chaque test
    jest.clearAllMocks();
  });

  describe('myMethod', () => {
    test('should do something correctly', () => {
      // Arrange
      const input = 'test-input';
      
      // Act
      const result = service.myMethod(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toBe('expected-output');
    });

    test('should handle errors gracefully', () => {
      // Test error handling
      expect(() => service.myMethod(null)).toThrow();
    });
  });
});
```

### Bonnes Pratiques

1. **Nommage des Tests**
   - Utilisez `describe` pour grouper les tests par fonctionnalité
   - Utilisez `test` ou `it` avec des descriptions claires
   - Format : "should [expected behavior] when [condition]"

   ```typescript
   test('should return user when email exists', () => { /* ... */ });
   test('should throw error when email is invalid', () => { /* ... */ });
   ```

2. **Structure AAA (Arrange-Act-Assert)**
   ```typescript
   test('should calculate total correctly', () => {
     // Arrange - Préparer les données
     const items = [{ price: 10 }, { price: 20 }];
     
     // Act - Exécuter l'action
     const total = calculateTotal(items);
     
     // Assert - Vérifier le résultat
     expect(total).toBe(30);
   });
   ```

3. **Tests Isolés**
   - Chaque test doit être indépendant
   - Utilisez `beforeEach` pour réinitialiser l'état
   - Ne partagez pas de données entre les tests

4. **Mocking**
   - Mocker les dépendances externes (API, DB, etc.)
   - Ne pas mocker ce que vous testez
   - Utiliser `jest.mock()` au niveau du module

---

## 🎭 Mocks et Stubs

### Mocker un Module Entier

```typescript
jest.mock('../services/ExternalService', () => ({
  ExternalService: jest.fn().mockImplementation(() => ({
    fetchData: jest.fn().mockResolvedValue({ data: 'mocked' }),
    sendRequest: jest.fn().mockResolvedValue(true),
  })),
}));
```

### Mocker une API

```typescript
jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: { result: 'success' } }),
    post: jest.fn().mockResolvedValue({ data: { id: '123' } }),
  },
}));
```

### Mocker Spotify API

```typescript
jest.mock('spotify-web-api-node', () => {
  return jest.fn().mockImplementation(() => ({
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
    getMyRecentlyPlayedTracks: jest.fn().mockResolvedValue({
      body: {
        items: [{
          track: {
            id: 'track-123',
            name: 'Test Track',
            artists: [{ id: 'artist-123', name: 'Test Artist' }],
          },
        }],
      },
    }),
  }));
});
```

### Mocker Discord.js

```typescript
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue('token'),
    isReady: jest.fn().mockReturnValue(true),
    channels: {
      fetch: jest.fn().mockResolvedValue({
        send: jest.fn().mockResolvedValue({ id: 'msg-123' }),
      }),
    },
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
  },
}));
```

### Mocker Google APIs

```typescript
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn().mockReturnValue('https://...'),
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: 'token',
            refresh_token: 'refresh',
          },
        }),
      })),
    },
    gmail: jest.fn().mockReturnValue({
      users: {
        messages: {
          list: jest.fn().mockResolvedValue({ data: { messages: [] } }),
        },
      },
    }),
  },
}));
```

### Mocker Timers

```typescript
jest.useFakeTimers();

test('should execute after delay', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);
  
  jest.advanceTimersByTime(1000);
  
  expect(callback).toHaveBeenCalledTimes(1);
});

jest.useRealTimers();
```

---

## 📝 Exemples de Tests par Type

### Tests Unitaires (Services)

```typescript
describe('SpotifyService', () => {
  test('should check new track played', async () => {
    const result = await SpotifyService.checkNewTrackPlayed('user-id');
    expect(result).toHaveProperty('triggered');
    expect(typeof result.triggered).toBe('boolean');
  });
});
```

### Tests d'Intégration (API)

```typescript
describe('POST /api/v1/areas', () => {
  test('should create new AREA', async () => {
    const response = await request(app)
      .post('/api/v1/areas')
      .send({
        name: 'Test AREA',
        action: { /* ... */ },
        reaction: { /* ... */ },
      })
      .expect(201);
      
    expect(response.body.area).toHaveProperty('id');
  });
});
```

### Tests de Modèles

```typescript
describe('InMemoryDB', () => {
  test('should create and retrieve AREA', () => {
    const area = InMemoryDB.createArea({ /* ... */ });
    const found = InMemoryDB.getAreaById(area.id);
    
    expect(found).toBeDefined();
    expect(found?.id).toBe(area.id);
  });
});
```

---

## 🐛 Débugger les Tests

### Lancer un test spécifique en mode debug

```bash
node --inspect-brk node_modules/.bin/jest --runInBand services.test.ts
```

### Utiliser console.log dans les tests

```typescript
test('debug test', () => {
  const data = { foo: 'bar' };
  console.log('Data:', data);
  expect(data.foo).toBe('bar');
});
```

### Désactiver le mocking temporairement

```typescript
jest.unmock('../services/RealService');
```

---

## 📈 CI/CD

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd server && npm install
      - name: Run tests
        run: cd server && npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 🔗 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeScript Jest Guide](https://kulshekhar.github.io/ts-jest/)

---

## ✅ Checklist avant de Commit

- [ ] Tous les tests passent (`npm test`)
- [ ] Couverture > 80% pour le nouveau code
- [ ] Tests pour les cas nominaux et d'erreur
- [ ] Pas de `console.log` ou `debugger` oubliés
- [ ] Mocks appropriés pour les dépendances externes
- [ ] Tests isolés et reproductibles

---

**Bon testing! 🚀**
