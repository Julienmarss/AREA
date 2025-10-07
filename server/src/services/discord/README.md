# Discord Service for AREA

## Vue d'ensemble

Le service Discord permet d'automatiser les interactions avec Discord via l'API Discord Bot. Il implémente 3 Actions et 3 REActions selon la spécification du projet.

## Configuration préalable

### 1. Créer un Bot Discord

1. Allez sur https://discord.com/developers/applications
2. Cliquez sur "New Application"
3. Donnez un nom à votre application
4. Allez dans l'onglet "Bot"
5. Cliquez sur "Add Bot"
6. Copiez le token du bot

### 2. Configurer les permissions

Le bot a besoin des permissions suivantes :
- `Send Messages` - Pour envoyer des messages
- `Manage Roles` - Pour ajouter des rôles aux utilisateurs
- `Read Message History` - Pour lire les messages
- `View Channels` - Pour voir les canaux
- `Use Slash Commands` (optionnel)

### 3. Inviter le bot sur votre serveur

1. Dans l'onglet "OAuth2" > "URL Generator"
2. Sélectionnez "bot" dans les scopes
3. Sélectionnez les permissions nécessaires
4. Utilisez l'URL générée pour inviter le bot

## Actions (Triggers)

### 1. `message_posted_in_channel`
**Description :** Se déclenche quand un message est posté dans un canal spécifique

**Paramètres :**
- `channelId` (requis) : ID du canal à surveiller
- `keyword` (optionnel) : Mot-clé à filtrer dans le message
- `authorId` (optionnel) : ID de l'auteur spécifique à surveiller

**Exemple de configuration :**
```json
{
  "channelId": "123456789012345678",
  "keyword": "urgent",
  "authorId": "987654321098765432"
}
```

### 2. `user_mentioned`
**Description :** Se déclenche quand un utilisateur spécifique est mentionné

**Paramètres :**
- `userId` (requis) : ID de l'utilisateur à surveiller pour les mentions
- `channelId` (optionnel) : ID du canal spécifique

**Exemple de configuration :**
```json
{
  "userId": "123456789012345678",
  "channelId": "987654321098765432"
}
```

### 3. `user_joined_server`
**Description :** Se déclenche quand un utilisateur rejoint un serveur

**Paramètres :**
- `guildId` (requis) : ID du serveur à surveiller

**Exemple de configuration :**
```json
{
  "guildId": "123456789012345678"
}
```

## REActions (Actions)

### 1. `send_message_to_channel`
**Description :** Envoie un message dans un canal Discord

**Paramètres :**
- `channelId` (requis) : ID du canal de destination
- `content` (requis) : Contenu du message
- `embedTitle` (optionnel) : Titre de l'embed
- `embedDescription` (optionnel) : Description de l'embed

**Exemple d'exécution :**
```json
{
  "channelId": "123456789012345678",
  "content": "Nouveau message automatique !",
  "embedTitle": "Alert",
  "embedDescription": "Ceci est un message automatique depuis AREA"
}
```

### 2. `send_dm`
**Description :** Envoie un message privé à un utilisateur

**Paramètres :**
- `userId` (requis) : ID de l'utilisateur destinataire
- `content` (requis) : Contenu du message

**Exemple d'exécution :**
```json
{
  "userId": "123456789012345678",
  "content": "Message privé automatique depuis AREA"
}
```

### 3. `add_role_to_user`
**Description :** Ajoute un rôle à un utilisateur sur un serveur

**Paramètres :**
- `guildId` (requis) : ID du serveur
- `userId` (requis) : ID de l'utilisateur
- `roleId` (requis) : ID du rôle à ajouter

**Exemple d'exécution :**
```json
{
  "guildId": "123456789012345678",
  "userId": "987654321098765432",
  "roleId": "555666777888999000"
}
```

## API Endpoints

### Authentification
- `POST /api/v1/services/discord/auth` - Authentifier avec le token du bot
- `GET /api/v1/services/discord/auth/:userId` - Vérifier le statut d'authentification

### Actions
- `POST /api/v1/services/discord/actions/:actionId/listen` - Commencer à écouter une action
- `DELETE /api/v1/services/discord/actions/:actionId/listen` - Arrêter d'écouter une action

### Réactions
- `POST /api/v1/services/discord/reactions/:reactionId/execute` - Exécuter une réaction

### Information du service
- `GET /api/v1/services/discord` - Obtenir la configuration du service

## Exemples d'utilisation

### 1. Authentification

```bash
curl -X POST http://localhost:8080/api/v1/services/discord/auth \
  -H "Content-Type: application/json" \
  -d '{
    "botToken": "YOUR_BOT_TOKEN_HERE",
    "guildId": "123456789012345678",
    "userId": "user123"
  }'
```

### 2. Écouter les messages dans un canal

```bash
curl -X POST http://localhost:8080/api/v1/services/discord/actions/message_posted_in_channel/listen \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "parameters": {
      "channelId": "123456789012345678",
      "keyword": "urgent"
    }
  }'
```

### 3. Envoyer un message

```bash
curl -X POST http://localhost:8080/api/v1/services/discord/reactions/send_message_to_channel/execute \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "parameters": {
      "channelId": "123456789012345678",
      "content": "Message automatique !",
      "embedTitle": "Alert",
      "embedDescription": "Ceci est automatique"
    },
    "triggerData": {}
  }'
```

## Comment obtenir les IDs Discord

### ID de Canal
1. Activez le mode développeur dans Discord (Paramètres Utilisateur > Avancé > Mode Développeur)
2. Clic droit sur un canal > "Copier l'ID"

### ID d'Utilisateur
1. Mode développeur activé
2. Clic droit sur un utilisateur > "Copier l'ID"

### ID de Serveur (Guild)
1. Mode développeur activé
2. Clic droit sur le nom du serveur > "Copier l'ID"

### ID de Rôle
1. Paramètres du serveur > Rôles
2. Clic droit sur un rôle > "Copier l'ID"

## Gestion des erreurs

Le service gère automatiquement :
- Les tokens invalides
- Les permissions insuffisantes
- Les canaux/utilisateurs inexistants
- Les déconnexions du bot

## Sécurité

- Le token du bot doit être gardé secret
- N'accordez que les permissions nécessaires
- Utilisez HTTPS en production
- Validez toujours les entrées utilisateur

## Limitations

- Un bot ne peut pas lire ses propres messages
- Les messages privés nécessitent un canal commun
- Certaines actions peuvent être limitées par les permissions Discord
- Rate limiting Discord (50 requêtes par seconde)