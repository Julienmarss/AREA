// server/src/routes/discord/oauth.ts

import { Router } from 'express';
import axios from 'axios';

const router = Router();

// POST /api/v1/services/discord/oauth/exchange
router.post('/oauth/exchange', async (req, res) => {
  const { code, userId } = req.body;

  console.log('🔄 Discord OAuth exchange - userId:', userId);

  if (!code || !userId) {
    return res.status(400).json({ error: 'Code and userId required' });
  }

  try {
    // 1. Échanger le code contre un token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:3000/oauth/callback', // DOIT être identique à Discord portal
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // 2. Récupérer les infos utilisateur
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const discordUser = userResponse.data;

    // 3. Récupérer les guilds
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const guilds = guildsResponse.data;

    // 4. Sauvegarder (selon ton système de storage)
    // discordService.saveUserConnection(userId, { ... });
    console.log('✅ Discord connected:', discordUser.username);

    return res.json({
      success: true,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      guilds: guilds.length,
    });

  } catch (error: any) {
    console.error('❌ Discord exchange error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to exchange Discord code',
    });
  }
});

export default router;