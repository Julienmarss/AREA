import { Request, Response } from 'express';
import { getGitHubAuthUrl } from '../config/github';
import { GitHubService } from '../services/GitHubService';
import { userStorage } from '../storage/UserStorage';
import axios from 'axios';

const githubService = new GitHubService();

export class GitHubController {
  
  // Initier l'authentification OAuth2
  static initiateAuth(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    
    const state = Buffer.from(JSON.stringify({
      userId: userId,
      timestamp: Date.now(),
    })).toString('base64');
    
    const authUrl = getGitHubAuthUrl(state);
    
    console.log('🔐 GitHub OAuth initiated for user:', userId);
    console.log('📍 Redirect URI:', process.env.GITHUB_REDIRECT_URI);
    
    res.json({ authUrl });
  }
  
  // Callback OAuth2
  static async callback(req: Request, res: Response) {
    const { code, state, error } = req.query;
    
    console.log('📥 GitHub callback received');
    console.log('  Code:', code ? 'present' : 'missing');
    console.log('  State:', state ? 'present' : 'missing');
    console.log('  Error:', error || 'none');
    
    if (error) {
      console.error('❌ GitHub OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/services?error=${error}`);
    }
    
    if (!code || !state) {
      console.error('❌ Missing code or state');
      return res.status(400).json({ error: 'Missing code or state' });
    }
    
    try {
      // Décoder le state pour récupérer le userId
      const stateData = JSON.parse(
        Buffer.from(state as string, 'base64').toString()
      );
      const userId = stateData.userId;
      
      console.log('🔐 Exchanging GitHub code for token...');
      console.log('  User ID:', userId);
      
      // Échanger le code contre un access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.GITHUB_REDIRECT_URI,
        },
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      if (!accessToken) {
        throw new Error('No access token received from GitHub');
      }
      
      console.log('✅ Got GitHub access token');
      
      // Récupérer les infos utilisateur GitHub
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      const githubUser = userResponse.data;
      console.log('✅ Got GitHub user info:', githubUser.login);
      
      // Authentifier l'utilisateur dans le service
      const success = await githubService.authenticate(userId, { accessToken });
      
      if (success) {
        // Sauvegarder dans le userStorage
        userStorage.updateServices(userId, 'github', {
          accessToken,
          username: githubUser.login,
          connectedAt: new Date()
        });
        
        console.log(`✅ GitHub authenticated for user ${userId} (${githubUser.login})`);
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
        return res.redirect(`${frontendUrl}/services?connected=github`);
      } else {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
        return res.redirect(`${frontendUrl}/services?error=auth_failed`);
      }
      
    } catch (error: any) {
      console.error('❌ GitHub OAuth callback error:', error.response?.data || error.message);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      return res.redirect(`${frontendUrl}/services?error=auth_failed`);
    }
  }
  
  // Vérifier le statut de connexion
  static async checkStatus(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string || 'demo_user';
      
      console.log('🔍 Checking GitHub status for user:', userId);
      
      // Vérifier dans le service
      const isAuthenticated = await githubService.isAuthenticated(userId);
      
      // Récupérer les infos du userStorage
      const user = userStorage.findById(userId);
      const githubData = user?.services?.github;
      
      console.log('  Service authenticated:', isAuthenticated);
      console.log('  UserStorage data:', githubData ? 'present' : 'missing');
      console.log('  Username:', githubData?.username || 'N/A');
      
      res.json({
        authenticated: isAuthenticated && githubData?.connected === true,
        service: 'github',
        username: githubData?.username,
        connectedAt: githubData?.connectedAt
      });
    } catch (error) {
      console.error('❌ Error checking GitHub status:', error);
      res.status(500).json({ 
        authenticated: false, 
        service: 'github',
        error: 'Failed to check status'
      });
    }
  }
}