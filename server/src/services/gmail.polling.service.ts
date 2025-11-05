import cron from 'node-cron';
import { GoogleService } from './GoogleService';
import { AreaExecutor } from './AreaExecutor';
import { userStorage } from '../storage/UserStorage';
import { InMemoryDB } from '../models/area.model';

/**
 * Service de polling pour vérifier les nouveaux emails Gmail
 * Note: En production, il est recommandé d'utiliser Gmail Push Notifications (Pub/Sub)
 */
export class GmailPollingService {
  private static isRunning = false;
  private static cronJob: cron.ScheduledTask | null = null;
  private static lastCheckedEmails = new Map<string, Set<string>>(); // userId -> Set<emailId>

  /**
   * Démarre le polling Gmail (vérifie toutes les 2 minutes)
   */
  static start() {
    if (this.isRunning) {
      console.log('Gmail polling already running');
      return;
    }

    console.log('Starting Gmail polling service...');

    this.cronJob = cron.schedule('*/2 * * * *', async () => {
      await this.checkAllGmailAreas();
    });

    this.isRunning = true;
    console.log('Gmail polling started (checking every 2 minutes)');
  }

  /**
   * Arrête le polling Gmail
   */
  static stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('Gmail polling stopped');
  }

  /**
   * Vérifie toutes les AREAs Gmail actives
   */
  private static async checkAllGmailAreas() {
    try {
      const areas = await InMemoryDB.getAreas();
      const activeGmailAreas = areas.filter(
        area => area.enabled && area.action.service === 'google'
      );

      if (activeGmailAreas.length === 0) return;

      console.log(`Checking ${activeGmailAreas.length} Gmail AREAs...`);

      const areasByUser = new Map<string, typeof activeGmailAreas>();
      
      for (const area of activeGmailAreas) {
        if (!areasByUser.has(area.userId)) {
          areasByUser.set(area.userId, []);
        }
        areasByUser.get(area.userId)!.push(area);
      }

      for (const [userId, userAreas] of areasByUser) {
        await this.checkUserEmails(userId, userAreas);
      }
    } catch (error) {
      console.error('Error checking Gmail AREAs:', error);
    }
  }

  /**
   * Vérifie les emails d'un utilisateur
   */
  private static async checkUserEmails(userId: string, areas: any[]) {
    try {
      const user = await userStorage.findById(userId);
      const googleData = user?.services?.google;

      if (!googleData?.accessToken) {
        console.log(`User ${userId} not authenticated with Google, skipping`);
        return;
      }

      const googleService = new GoogleService();
      await googleService.authenticate(userId, googleData);
      
      const emails = await googleService.getRecentEmails(userId, 10);

      if (!this.lastCheckedEmails.has(userId)) {
        this.lastCheckedEmails.set(userId, new Set());
      }
      const checkedEmails = this.lastCheckedEmails.get(userId)!;

      for (const email of emails) {
        if (checkedEmails.has(email.id)) {
          continue;
        }

        console.log(`New email detected for user ${userId}: ${email.subject}`);

        checkedEmails.add(email.id);

        for (const area of areas) {
          if (this.matchesEmailAction(area, email)) {
            console.log(`AREA matched: ${area.name} (${area.id})`);

            const triggerData = {
              email: {
                id: email.id,
                from: email.from,
                to: email.to,
                subject: email.subject,
                body: email.body,
                snippet: email.snippet,
              }
            };

            await AreaExecutor.executeMatchingAreas(
              'google',
              area.action.type,
              triggerData
            );

            InMemoryDB.updateArea(area.id, {
              lastTriggered: new Date(),
              lastChecked: new Date(),
            });
          }
        }
      }

      if (checkedEmails.size > 100) {
        const idsArray = Array.from(checkedEmails);
        const toKeep = idsArray.slice(-100);
        this.lastCheckedEmails.set(userId, new Set(toKeep));
      }
    } catch (error) {
      console.error(`Error checking emails for user ${userId}:`, error);
    }
  }

  /**
   * Vérifie si un email correspond aux critères d'une action
   */
  private static matchesEmailAction(area: any, email: any): boolean {
    const { type, config } = area.action;

    switch (type) {
      case 'new_email_received':
        return true;

      case 'email_from_sender':
        if (config.from && email.from) {
          return email.from.toLowerCase().includes(config.from.toLowerCase());
        }
        return false;

      case 'email_with_subject':
        if (config.subject && email.subject) {
          return email.subject.toLowerCase().includes(config.subject.toLowerCase());
        }
        return false;

      default:
        console.warn(`Unknown Gmail action type: ${type}`);
        return false;
    }
  }

  /**
   * Force la vérification d'une AREA spécifique
   */
  static async forceCheckArea(areaId: string): Promise<boolean> {
    try {
      const area = await InMemoryDB.getAreaById(areaId);
      if (!area || area.action.service !== 'google') {
        return false;
      }

      await this.checkUserEmails(area.userId, [area]);
      return true;
    } catch (error) {
      console.error(`Error force checking area ${areaId}:`, error);
      return false;
    }
  }

  /**
   * Nettoie la mémoire des emails traités
   */
  static clearCheckedEmails(userId?: string) {
    if (userId) {
      this.lastCheckedEmails.delete(userId);
      console.log(`Cleared checked emails for user ${userId}`);
    } else {
      this.lastCheckedEmails.clear();
      console.log('Cleared all checked emails');
    }
  }
}
