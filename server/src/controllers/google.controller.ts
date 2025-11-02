import { Request, Response } from 'express';
import { GoogleService } from '../services/GoogleService';
import { userStorage } from '../storage/UserStorage';

const googleService = new GoogleService();

/**
 * Initie le flux OAuth Google
 */
export const initiateGoogleAuth = (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'demo_user';

    const state = Buffer.from(JSON.stringify({
      userId: userId,
      timestamp: Date.now(),
    })).toString('base64');
    
    const authUrl = googleService.getAuthUrl(state);
    
    console.log('🔐 Google OAuth initiated for user:', userId);
    console.log('📍 Redirect URI:', process.env.GOOGLE_REDIRECT_URI);
    
    res.json({ authUrl });
  } catch (error: any) {
    console.error('Error initiating Google auth:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Callback OAuth Google
 */
export const handleGoogleCallback = async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  
  console.log('📥 Google callback received');
  console.log('  Code:', code ? 'present' : 'missing');
  console.log('  State:', state ? 'present' : 'missing');
  console.log('  Error:', error || 'none');
  
  if (error) {
    console.error('❌ Google OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/services?error=${error}`);
  }
  
  if (!code || !state) {
    console.error('❌ Missing code or state');
    return res.redirect(`${process.env.FRONTEND_URL}/services?error=missing_params`);
  }
  
  try {
    const stateData = JSON.parse(
      Buffer.from(state as string, 'base64').toString()
    );
    const userId = stateData.userId;
    
    console.log('🔐 Exchanging Google code for token...');
    console.log('  User ID:', userId);

    const authData = await googleService.exchangeCode(code as string);
    
    console.log('✅ Got Google tokens');
    console.log('  Access token:', authData.accessToken ? 'present' : 'missing');
    console.log('  Refresh token:', authData.refreshToken ? 'present' : 'missing');
    console.log('  Email:', authData.email || 'N/A');

    const user = userStorage.findById(userId);
    if (!user) {
      console.error('❌ User not found in storage:', userId);
      throw new Error('User not found');
    }
    
    console.log('✅ User found in storage');

    const updatedUser = userStorage.updateServices(userId, 'google', {
      connected: true,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      expiresAt: authData.expiresAt,
      email: authData.email,
      connectedAt: new Date()
    });
    
    if (!updatedUser) {
      console.error('❌ Failed to update user services');
      throw new Error('Failed to update services');
    }
    
    console.log(`✅ Google authenticated for user ${userId}`);
    console.log('  Saved data:', updatedUser.services.google ? 'OK' : 'MISSING');
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    return res.redirect(`${frontendUrl}/services?connected=google`);
    
  } catch (error: any) {
    console.error('❌ Google OAuth callback error:', error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    return res.redirect(`${frontendUrl}/services?error=auth_failed`);
  }
};

/**
 * Récupère les derniers emails
 */
export const getRecentEmails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const maxResults = parseInt(req.query.maxResults as string) || 10;
    
    const emails = await googleService.getRecentEmails(userId, maxResults);
    
    res.json({
      success: true,
      emails,
      count: emails.length,
    });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Envoie un email
 */
export const sendEmail = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    const result = await googleService.sendEmail(userId, { to, subject, body });
    
    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Vérifie l'état de l'authentification Google
 */
export const getGoogleStatus = (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'demo_user';
    
    console.log('🔍 Checking Google status for user:', userId);
    
    const user = userStorage.findById(userId);
    const googleData = user?.services?.google;
    
    console.log('  UserStorage data:', googleData ? 'present' : 'missing');
    console.log('  Email:', googleData?.email || 'N/A');

    if (!googleData?.accessToken) {
      return res.json({
        authenticated: false,
        service: 'google',
      });
    }

    res.json({
      authenticated: googleData.connected === true || !!googleData.accessToken,
      service: 'google',
      email: googleData.email,
      connectedAt: googleData.connectedAt,
      expiresAt: googleData.expiresAt,
    });
  } catch (error: any) {
    console.error('❌ Error checking Google status:', error);
    res.status(500).json({ 
      authenticated: false,
      service: 'google',
      error: 'Failed to check status'
    });
  }
};

/**
 * Déconnexion Google
 */
export const disconnectGoogle = (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = userStorage.findById(userId);
    if (user && user.services?.google) {
      delete user.services.google;
    }

    res.json({
      success: true,
      message: 'Google disconnected successfully',
    });
  } catch (error: any) {
    console.error('Error disconnecting Google:', error);
    res.status(500).json({ error: error.message });
  }
};
