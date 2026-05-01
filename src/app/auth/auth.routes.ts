import express from 'express'
import AuthenticationController from './auth.controller.js';

export const authRouter = express.Router();
const authentication = new AuthenticationController();

authRouter.post('/register', authentication.handleRegistration.bind(authentication))