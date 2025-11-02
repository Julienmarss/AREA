import { google, gmail_v1 } from 'googleapis';
import { GOOGLE_CONFIG } from '../config/google';
import { userStorage } from '../storage/UserStorage';
import { GoogleAuthData, GmailMessage, SendEmailParams } from '../types/google';

export class GoogleService {
  private oauth2Client;
  private gmail: gmail_v1.Gmail | null = null;
  private authenticatedUserId: string | null = null;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CONFIG.CLIENT_ID,
      GOOGLE_CONFIG.CLIENT_SECRET,
      GOOGLE_CONFIG.REDIRECT_URI
    );
  }

  /**
   * Génère l'URL d'authentification OAuth2
   */
  getAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_CONFIG.SCOPES,
      state: state,
      prompt: 'consent',
    });
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  async exchangeCode(code: string): Promise<GoogleAuthData> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    const expiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date) 
      : new Date(Date.now() + 3600 * 1000);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: expiresAt,
    };
  }

  /**
   * Authentifie le service avec les credentials d'un utilisateur
   */
  async authenticate(userId: string, authData: Partial<GoogleAuthData>): Promise<boolean> {
    try {
      if (!authData.accessToken || !authData.refreshToken) {
        console.error(`❌ Missing Google credentials for user ${userId}`);
        return false;
      }

      this.oauth2Client.setCredentials({
        access_token: authData.accessToken,
        refresh_token: authData.refreshToken,
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      this.authenticatedUserId = userId;

      console.log(`✅ Google authenticated for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Google authentication failed for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Initialise le service
   */
  async initialize(): Promise<void> {
    console.log('🔧 Google Service initialized');
  }

  /**
   * Récupère les derniers emails
   */
  async getRecentEmails(userId: string, maxResults: number = 10): Promise<GmailMessage[]> {
    const user = userStorage.findById(userId);
    const googleData = user?.services?.google;

    if (!googleData?.accessToken) {
      throw new Error('Google not authenticated');
    }

    await this.authenticate(userId, googleData);

    if (!this.gmail) {
      throw new Error('Gmail client not initialized');
    }

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
    });

    const messages = response.data.messages || [];
    const detailedMessages: GmailMessage[] = [];

    for (const message of messages) {
      if (message.id) {
        const detail = await this.getEmailById(userId, message.id);
        if (detail) {
          detailedMessages.push(detail);
        }
      }
    }

    return detailedMessages;
  }

  /**
   * Récupère un email par son ID
   */
  async getEmailById(userId: string, messageId: string): Promise<GmailMessage | null> {
    if (!this.gmail) {
      throw new Error('Gmail client not initialized');
    }

    const response = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    
    // Parse headers
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value;

    return {
      id: message.id || '',
      threadId: message.threadId || '',
      labelIds: message.labelIds || [],
      snippet: message.snippet || '',
      historyId: message.historyId || '',
      internalDate: message.internalDate || '',
      payload: message.payload as any || { headers: [] },
      from: getHeader('from') || undefined,
      to: getHeader('to') || undefined,
      subject: getHeader('subject') || undefined,
      body: message.snippet || '',
    };
  }

  /**
   * Envoie un email
   */
  async sendEmail(userId: string, params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const user = userStorage.findById(userId);
      const googleData = user?.services?.google;

      if (!googleData?.accessToken) {
        return { success: false, error: 'Google not authenticated' };
      }

      await this.authenticate(userId, googleData);

      if (!this.gmail) {
        return { success: false, error: 'Gmail client not initialized' };
      }

      // Créer le message au format RFC 2822
      const email = [
        `To: ${params.to}`,
        `Subject: ${params.subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        params.body,
      ].join('\n');

      // Encoder en base64url
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });

      console.log(`✅ Email sent: ${response.data.id}`);
      return { success: true, messageId: response.data.id || undefined };
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ajoute un label à un email
   */
  async addLabel(userId: string, messageId: string, labelId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.gmail) {
        return { success: false, error: 'Gmail client not initialized' };
      }

      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      });

      console.log(`✅ Label ${labelId} added to message ${messageId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error adding label:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marque un email comme lu
   */
  async markAsRead(userId: string, messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.gmail) {
        return { success: false, error: 'Gmail client not initialized' };
      }

      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });

      console.log(`✅ Message ${messageId} marked as read`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error marking as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exécute une réaction Google
   */
  async executeReaction(
    reactionType: string,
    userId: string,
    config: any,
    triggerData: any
  ): Promise<void> {
    console.log(`🔄 Executing Google reaction: ${reactionType}`);

    switch (reactionType) {
      case 'send_email':
        await this.sendEmail(userId, {
          to: config.to,
          subject: config.subject,
          body: config.body,
        });
        break;

      case 'reply_to_email':
        if (triggerData.email?.from && triggerData.email?.subject) {
          await this.sendEmail(userId, {
            to: triggerData.email.from,
            subject: `Re: ${triggerData.email.subject}`,
            body: config.body || 'Auto-reply',
          });
        }
        break;

      case 'add_label':
        if (triggerData.email?.id && config.labelId) {
          await this.addLabel(userId, triggerData.email.id, config.labelId);
        }
        break;

      case 'mark_as_read':
        if (triggerData.email?.id) {
          await this.markAsRead(userId, triggerData.email.id);
        }
        break;

      default:
        console.error(`❌ Unknown Google reaction type: ${reactionType}`);
    }
  }
}
