# 📱 Frontend Documentation - AREA

## 🗂️ Structure du projet

```
web/src/
├── App.tsx                          # Point d'entrée + Routes
├── main.tsx                         # Bootstrap React
├── index.css                        # Styles globaux (Tailwind)
│
├── pages/                           # Pages de l'application
│   ├── Home.tsx                     # Page d'accueil (/)
│   ├── Register.tsx                 # Inscription (/register)
│   ├── Login.tsx                    # Connexion (/login)
│   ├── Dashboard.tsx                # Tableau de bord (/dashboard) 🔒
│   ├── Services.tsx                 # Connexion services (/services) 🔒
│   └── areas/
│       ├── CreateArea.tsx           # Créer AREA (/areas/create) 🔒
│       └── AreaList.tsx             # Liste AREAs (non utilisé)
│
├── components/                      # Composants réutilisables
│   ├── Layout.tsx                   # Layout principal (Nav + Main)
│   ├── ProtectedRoute.tsx           # HOC pour routes protégées
│   └── services/                    # Composants services (non utilisés)
│       ├── ServiceCard.tsx
│       ├── GitHubConnect.tsx
│       ├── DiscordConnect.tsx
│       └── SpotifyConnect.tsx
│
├── contexts/                        # Context API
│   └── AuthContext.tsx              # Gestion auth globale
│
├── services/                        # Appels API
│   └── api.ts                       # API centralisée
│
├── types/                           # Types TypeScript
│   └── index.ts                     # Interfaces globales
│
└── vite-env.d.ts                    # Types Vite
```

---

## 🎯 Pages principales

### 1. Home (`/`)
**Fichier** : `pages/Home.tsx`  
**Accès** : Public  
**Description** : Page d'accueil avec présentation du projet
```tsx
- Présentation AREA
- Statistiques (services, actions, reactions)
- Liste des services disponibles
- Exemples d'automations
- Bouton Download APK
- Informations about.json
```

### 2. Register (`/register`)
**Fichier** : `pages/Register.tsx`  
**Accès** : Public  
**Description** : Inscription utilisateur
```tsx
Formulaire:
- Email
- Password (min 6 caractères)
- First Name
- Last Name

→ Crée un compte
→ Génère un JWT token
→ Redirect vers /dashboard
```

### 3. Login (`/login`)
**Fichier** : `pages/Login.tsx`  
**Accès** : Public  
**Description** : Connexion utilisateur
```tsx
Formulaire:
- Email
- Password

→ Valide les credentials
→ Retourne un JWT token
→ Redirect vers /dashboard
```

### 4. Dashboard (`/dashboard`) 🔒
**Fichier** : `pages/Dashboard.tsx`  
**Accès** : Protégé (JWT requis)  
**Description** : Tableau de bord principal
```tsx
Affiche:
- Stats: Services connectés (X/3)
- Stats: AREAs actives
- Stats: Total AREAs
- Statuts des services (GitHub, Discord, Spotify)
- Liste des AREAs avec actions:
  - Enable/Disable
  - Delete
- Quick actions:
  - Connect Services
  - Create AREA
```

### 5. Services (`/services`) 🔒
**Fichier** : `pages/Services.tsx`  
**Accès** : Protégé (JWT requis)  
**Description** : Connexion des services externes
```tsx
Sections:
1. GitHub:
   - Input: Personal Access Token
   - Bouton: Connect GitHub
   
2. Discord:
   - Input: Bot Token
   - Input: Guild ID
   - Bouton: Connect Discord
   
3. Spotify:
   - Bouton: Connect with Spotify (OAuth2)

Affiche le statut de chaque service (Connected/Not connected)
```

### 6. Create AREA (`/areas/create`) 🔒
**Fichier** : `pages/areas/CreateArea.tsx`  
**Accès** : Protégé (JWT requis)  
**Description** : Création d'AREA avec wizard
```tsx
Wizard 4 étapes:

Step 1: Name
- Nom de l'AREA (requis)
- Description (optionnel)

Step 2: Action
- Sélection du service (GitHub/Discord/Spotify)
- Sélection du type d'Action
- Filtrage: affiche uniquement services connectés

Step 3: REAction
- Sélection du service (GitHub/Discord/Spotify)
- Sélection du type de REAction
- Filtrage: affiche uniquement services connectés

Step 4: Review
- Récapitulatif complet
- Preview: Action → REAction
- Bouton: Create AREA
- Redirect vers /dashboard après succès
```

---

## 🔐 Authentification

### AuthContext
**Fichier** : `contexts/AuthContext.tsx`

```tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email, password) => Promise<void>;
  register: (email, password, firstName, lastName) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
```

**Usage** :
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  if (!user) return <div>Not logged in</div>;
  
  return <div>Hello {user.firstName}!</div>;
}
```

**Storage** : Token JWT stocké dans `localStorage('area_token')`

---

## 🌐 API Service

### Fichier : `services/api.ts`

**APIs disponibles** :
```typescript
// Authentication
authAPI.register(email, password, firstName, lastName)
authAPI.login(email, password)
authAPI.me()

// GitHub
githubAPI.getStatus()
githubAPI.connect(accessToken)

// Discord
discordAPI.getStatus()
discordAPI.connect(botToken, guildId)

// Spotify
spotifyAPI.getStatus(userId)
spotifyAPI.initiateAuth(userId)
spotifyAPI.disconnect(userId)

// AREAs
areasAPI.getAll(userId?)
areasAPI.getById(id)
areasAPI.create(areaData)
areasAPI.update(id, updates)
areasAPI.delete(id)
areasAPI.toggle(id)
areasAPI.test(id)

// About
aboutAPI.getInfo()
```

**Exemple d'utilisation** :
```tsx
import { githubAPI } from '../services/api';

const handleConnect = async () => {
  try {
    await githubAPI.connect(token);
    console.log('Connected!');
  } catch (error) {
    console.error('Failed:', error.message);
  }
};
```

---

## 🛡️ Routes protégées

### ProtectedRoute
**Fichier** : `components/ProtectedRoute.tsx`

```tsx
// Usage dans App.tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```
---

## 🔄 Flow d'authentification

```
1. User arrive sur /login
   ↓
2. Entre email + password
   ↓
3. Submit → authAPI.login(email, password)
   ↓
4. Backend retourne { token, user }
   ↓
5. Frontend stocke token dans localStorage
   ↓
6. AuthContext met à jour user
   ↓
7. Redirect vers /dashboard
   ↓
8. Toutes les requêtes incluent:
   Header: "Authorization: Bearer {token}"
```

---

## 📱 Pages publiques vs protégées

### Publiques (accessible sans login)
- ✅ `/` - Home
- ✅ `/register` - Register
- ✅ `/login` - Login

### Protégées (JWT requis)
- 🔒 `/dashboard` - Dashboard
- 🔒 `/services` - Services
- 🔒 `/areas/create` - Create AREA

---

## 🔧 Configuration

### Variables d'environnement
**Fichier** : `.env` (à créer)

```env
VITE_API_URL=http://localhost:8080
```

**Usage** :
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
```

---

## 🚀 Commandes

```bash
# Installation
npm install

# Développement (port 8081)
npm run dev

# Build production
npm run build

# Preview production
npm run preview

# Lint
npm run lint
```

---