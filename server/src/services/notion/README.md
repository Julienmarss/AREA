# Service Notion - Documentation

## Vue d'ensemble

Le service Notion permet d'intégrer l'API Notion dans votre application AREA. Il offre la possibilité de surveiller les changements dans vos bases de données et pages Notion, ainsi que de créer et modifier du contenu automatiquement.

## Configuration OAuth2

### Étape 1 : Créer une intégration Notion

1. Rendez-vous sur [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Cliquez sur "+ New integration"
3. Nommez votre intégration (ex: "AREA Integration")
4. Sélectionnez le workspace associé
5. Configurez les capacités (Capabilities):
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
6. Cliquez sur "Submit"

### Étape 2 : Configurer OAuth2

1. Dans les paramètres de votre intégration, allez dans l'onglet "OAuth"
2. Ajoutez une "Redirect URI":
   ```
   http://localhost:8080/api/v1/auth/notion/callback
   ```
   (Adaptez selon votre configuration)
3. Notez le `Client ID` et le `Client Secret` (OAuth)

### Étape 3 : Variables d'environnement

Ajoutez ces variables dans votre fichier `.env`:

```env
NOTION_CLIENT_ID=your_client_id_here
NOTION_CLIENT_SECRET=your_client_secret_here
NOTION_REDIRECT_URI=http://localhost:8080/api/v1/auth/notion/callback
```

### Étape 4 : Connecter une base de données ou page

Pour que l'intégration puisse accéder à une base de données ou page:
1. Ouvrez la page/base dans Notion
2. Cliquez sur les "..." (menu) en haut à droite
3. Sélectionnez "Add connections"
4. Recherchez et sélectionnez votre intégration

## Actions (Triggers) disponibles

### 1. `database_item_created`
**Description:** Se déclenche quand un nouvel élément est ajouté à une base de données Notion.

**Paramètres:**
- `databaseId` (string, requis) - L'ID de la base de données à surveiller

**Données transmises:**
- `pageId` - ID de l'élément créé
- `databaseId` - ID de la base de données
- `properties` - Propriétés de l'élément
- `url` - URL de l'élément
- `createdTime` - Date de création

**Exemple d'utilisation:**
```json
{
  "action": {
    "service": "notion",
    "type": "database_item_created",
    "config": {
      "databaseId": "abc123def456..."
    }
  }
}
```

### 2. `database_item_updated`
**Description:** Se déclenche quand un élément d'une base de données est modifié.

**Paramètres:**
- `databaseId` (string, requis) - L'ID de la base de données à surveiller

**Données transmises:**
- `pageId` - ID de l'élément modifié
- `databaseId` - ID de la base de données
- `properties` - Propriétés mises à jour
- `url` - URL de l'élément
- `lastEditedTime` - Date de dernière modification

**Exemple d'utilisation:**
```json
{
  "action": {
    "service": "notion",
    "type": "database_item_updated",
    "config": {
      "databaseId": "abc123def456..."
    }
  }
}
```

### 3. `page_created`
**Description:** Se déclenche quand une nouvelle page est créée dans Notion.

**Paramètres:**
- `parentPageId` (string, optionnel) - ID de la page parente (laisser vide pour surveiller toutes les pages)

**Données transmises:**
- `pageId` - ID de la page créée
- `parentPageId` - ID de la page parente (si applicable)
- `url` - URL de la page
- `createdTime` - Date de création
- `properties` - Propriétés de la page

**Exemple d'utilisation:**
```json
{
  "action": {
    "service": "notion",
    "type": "page_created",
    "config": {
      "parentPageId": ""
    }
  }
}
```

### 4. `database_property_changed`
**Description:** Se déclenche quand une propriété spécifique d'un élément de base de données change.

**Paramètres:**
- `databaseId` (string, requis) - L'ID de la base de données
- `propertyName` (string, requis) - Le nom de la propriété à surveiller (ex: "Status", "Priority")

**Données transmises:**
- `pageId` - ID de l'élément
- `databaseId` - ID de la base de données
- `propertyName` - Nom de la propriété
- `propertyValue` - Nouvelle valeur de la propriété
- `properties` - Toutes les propriétés
- `url` - URL de l'élément
- `lastEditedTime` - Date de modification

**Exemple d'utilisation:**
```json
{
  "action": {
    "service": "notion",
    "type": "database_property_changed",
    "config": {
      "databaseId": "abc123def456...",
      "propertyName": "Status"
    }
  }
}
```

## Reactions disponibles

### 1. `create_database_item`
**Description:** Crée un nouvel élément dans une base de données Notion.

**Paramètres:**
- `databaseId` (string, requis) - ID de la base de données
- `title` (string, requis) - Titre de l'élément
- `properties` (string, optionnel) - Propriétés additionnelles en JSON

**Exemple:**
```json
{
  "reaction": {
    "service": "notion",
    "type": "create_database_item",
    "config": {
      "databaseId": "abc123def456...",
      "title": "Nouvelle tâche: {{issue.title}}",
      "properties": "{\"Status\": \"To Do\", \"Priority\": \"High\"}"
    }
  }
}
```

### 2. `update_database_item`
**Description:** Met à jour un élément existant dans une base de données.

**Paramètres:**
- `pageId` (string, requis) - ID de l'élément à mettre à jour (utilisez `{{notion.pageId}}` depuis un trigger)
- `properties` (string, requis) - Propriétés à modifier en JSON

**Exemple:**
```json
{
  "reaction": {
    "service": "notion",
    "type": "update_database_item",
    "config": {
      "pageId": "{{notion.pageId}}",
      "properties": "{\"Status\": \"Done\", \"CompletedAt\": \"2024-01-15\"}"
    }
  }
}
```

### 3. `create_page`
**Description:** Crée une nouvelle page dans Notion.

**Paramètres:**
- `parentPageId` (string, optionnel) - ID de la page parente
- `title` (string, requis) - Titre de la page
- `content` (string, optionnel) - Contenu de la page

**Exemple:**
```json
{
  "reaction": {
    "service": "notion",
    "type": "create_page",
    "config": {
      "title": "Notes: {{issue.title}}",
      "content": "Issue créée par {{issue.user.login}}. Lien: {{issue.html_url}}"
    }
  }
}
```

## Variables disponibles dans les templates

Vous pouvez utiliser des variables dans vos configurations de reactions:

### Depuis les triggers Notion:
- `{{notion.pageId}}` - ID de la page
- `{{notion.url}}` - URL de la page
- `{{notion.databaseId}}` - ID de la base de données

### Depuis les triggers GitHub:
- `{{issue.title}}` - Titre de l'issue
- `{{issue.number}}` - Numéro de l'issue
- `{{issue.user.login}}` - Auteur de l'issue
- `{{issue.html_url}}` - URL de l'issue

### Depuis les triggers Discord:
- `{{message.content}}` - Contenu du message
- `{{message.author}}` - Auteur du message
- `{{message.channel}}` - Nom du canal

### Depuis les triggers Spotify:
- `{{track.name}}` - Nom du morceau
- `{{track.artist}}` - Nom de l'artiste

## Exemples d'AREA complets

### Exemple 1: GitHub Issue → Notion Database
Créer un élément dans une base de données Notion quand une issue GitHub est créée.

```json
{
  "name": "GitHub Issues to Notion",
  "action": {
    "service": "github",
    "type": "new_issue_created",
    "config": {
      "owner": "monorganisation",
      "repo": "monprojet"
    }
  },
  "reaction": {
    "service": "notion",
    "type": "create_database_item",
    "config": {
      "databaseId": "abc123...",
      "title": "{{issue.title}}",
      "properties": "{\"URL\": \"{{issue.html_url}}\", \"Status\": \"New\", \"Author\": \"{{issue.user.login}}\"}"
    }
  }
}
```

### Exemple 2: Notion Task Completed → Discord Notification
Envoyer un message Discord quand une tâche Notion est marquée comme "Done".

```json
{
  "name": "Notion Done → Discord",
  "action": {
    "service": "notion",
    "type": "database_property_changed",
    "config": {
      "databaseId": "abc123...",
      "propertyName": "Status"
    }
  },
  "reaction": {
    "service": "discord",
    "type": "send_message_to_channel",
    "config": {
      "channelId": "123456789",
      "content": "✅ Tâche terminée! {{notion.url}}"
    }
  }
}
```

### Exemple 3: Spotify Track → Notion Music Log
Logger automatiquement les morceaux écoutés dans une base de données Notion.

```json
{
  "name": "Spotify to Notion Music Log",
  "action": {
    "service": "spotify",
    "type": "new_track_played",
    "config": {}
  },
  "reaction": {
    "service": "notion",
    "type": "create_database_item",
    "config": {
      "databaseId": "def456...",
      "title": "{{track.name}}",
      "properties": "{\"Artist\": \"{{track.artist}}\", \"PlayedAt\": \"2024-01-15\"}"
    }
  }
}
```

## Trouver l'ID d'une base de données ou page

### Méthode 1: Via l'URL
L'ID se trouve dans l'URL de votre page/base:
```
https://www.notion.so/workspace/Database-Name-abc123def456?v=...
                                                ^^^^^^^^^^^^
                                                C'est l'ID!
```

### Méthode 2: Via l'API
Utilisez l'endpoint `/api/v1/notion/databases` ou `/api/v1/notion/pages` pour lister toutes vos bases et pages avec leurs IDs.

```bash
curl http://localhost:8080/api/v1/notion/databases?userId=demo_user
```

## Limitations

- **Polling:** Les actions Notion utilisent du polling (vérification toutes les 60 secondes). Il peut y avoir un délai avant détection.
- **Permissions:** L'intégration doit être connectée à chaque page/base de données manuellement.
- **Rate Limiting:** L'API Notion a des limites de taux (3 requêtes/seconde).
- **Propriétés complexes:** Seules les propriétés basiques sont supportées pour l'instant (texte, nombre, select, date, checkbox).

## Dépannage

### "Notion not authenticated"
- Vérifiez que l'utilisateur a bien connecté son compte Notion
- Vérifiez les variables d'environnement `NOTION_CLIENT_ID` et `NOTION_CLIENT_SECRET`

### "Database not found"
- Vérifiez que l'intégration a été connectée à la base de données dans Notion
- Vérifiez l'ID de la base de données

### "Invalid properties"
- Assurez-vous que le JSON des propriétés est valide
- Vérifiez que les noms de propriétés correspondent exactement à ceux dans Notion (sensible à la casse)

## Support

Pour plus d'informations sur l'API Notion:
- [Documentation officielle Notion API](https://developers.notion.com/)
- [Guide OAuth Notion](https://developers.notion.com/docs/authorization)
