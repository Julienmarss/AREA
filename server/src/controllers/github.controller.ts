import { Request, Response } from 'express';
import { getGitHubAuthUrl } from '../config/github';
import { GitHubService } from '../services/GitHubService';
import axios from 'axios';

const githubService = new GitHubService();

export class GitHubController {
  
  // Initier l'authentification OAuth2
  static initiateAuth(req: Request, res: Response) {
    const state = Buffer.from(JSON.stringify({
      userId: req.query.userId || 'demo_user',
      timestamp: Date.now(),
    })).toString('base64');
    
    const authUrl = getGitHubAuthUrl(state);
    res.json({ authUrl });
  }
  
  // Callback OAuth2
  static async callback(req: Request, res: Response) {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/error?message=${error}`);
    }
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }
    
    try {
      // Décoder le state pour récupérer le userId
      const stateData = JSON.parse(
        Buffer.from(state as string, 'base64').toString()
      );
      const userId = stateData.userId;
      
      console.log('🔐 Exchanging GitHub code for token...');
      
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
      
      // Authentifier l'utilisateur dans le service
      const success = await githubService.authenticate(userId, { accessToken });
      
      if (success) {
        console.log(`✅ GitHub authenticated for user ${userId}`);
        res.redirect(`${process.env.FRONTEND_URL}/services?connected=github`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/error?message=auth_failed`);
      }
      
    } catch (error: any) {
      console.error('❌ GitHub OAuth callback error:', error.response?.data || error.message);
      res.redirect(`${process.env.FRONTEND_URL}/error?message=auth_failed`);
    }
  }
  
  // Vérifier le statut de connexion
  static async checkStatus(req: Request, res: Response) {
    const userId = req.query.userId as string || 'demo_user';
    const isAuthenticated = await githubService.isAuthenticated(userId);
    
    res.json({
      authenticated: isAuthenticated,
      service: 'github',
    });
  }
}