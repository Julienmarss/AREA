import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { userStorage } from '../storage/UserStorage';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../utils/auth';
import { User, RegisterRequest, LoginRequest } from '../types/user';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName }: RegisterRequest = req.body;

    const existingUser = await userStorage.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    const passwordHash = await hashPassword(password);

    const user: User = {
      id: uuidv4(),
      email,
      firstName,
      lastName,
      passwordHash,
      createdAt: new Date(),
      services: {}
    };

    await userStorage.create(user);

    const token = generateToken(user.id);

    console.log(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    const user = await userStorage.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const token = generateToken(user.id);

    console.log(`User logged in: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await userStorage.findById(req.user!.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        services: user.services
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/logout', authenticate, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;