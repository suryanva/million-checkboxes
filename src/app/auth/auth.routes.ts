import express from 'express'
import AuthenticationController from './auth.controller.js';

export const authRouter = express.Router();
const authentication = new AuthenticationController();

authRouter.post('/register', authentication.handleRegistration.bind(authentication));
authRouter.post('/login', authentication.handleLogin.bind(authentication));

authRouter.get('/google', authentication.handleGoogleRedirect.bind(authentication));
authRouter.get('/google/callback', authentication.handleGoogleCallback.bind(authentication));

// Session Management
authRouter.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.status(200).json({ message: 'Logged out' });
});