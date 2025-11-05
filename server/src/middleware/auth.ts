import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { userStorage } from '../storage/UserStorage';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const user = await userStorage.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};