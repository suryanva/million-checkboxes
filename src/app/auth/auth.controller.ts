import type { Request, Response } from 'express'
import { LoginPayloadModel, registrationPayloadModel } from './auth.model.js';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { createHmac, randomBytes } from 'node:crypto';
import { client } from "../../utils/oauth.congif.js"
import jwt from 'jsonwebtoken'


class AuthenticationController {

    public async handleRegistration(req: Request, res: Response) {
        const validationResult = await registrationPayloadModel.safeParseAsync(req.body);
        if (validationResult.error) {
            return res.status(400).json({ message: 'body validation result', error: validationResult.error })
        }

        const { name, email, password } = validationResult.data;

        const userEmailResult = await db.select().from(users).where(eq(users.email, email))

        if (userEmailResult.length > 0) return res.status(400).json({ error: 'duplicate entry', message: `user with email ${email} already exists` })

        const salt = randomBytes(32).toString('hex');
        const hash = createHmac('sha256', salt).update(password).digest('hex');

        const [result] = await db.insert(users).values({
            name,
            email,
            password: hash,
            salt
        }).returning({ id: users.id })

        return res.status(201).json({ message: `user has been created successfully`, data: { id: result?.id } })

    }

    public async handleLogin(req: Request, res: Response) {

        const validationResult = await LoginPayloadModel.safeParseAsync(req.body);

        if (validationResult.error) {
            return res.status(400).json({ message: 'body validation result', error: validationResult.error })
        }

        const { email, password } = validationResult.data;

        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user || !user.password || !user.salt) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const verifyHash = createHmac('sha256', user.salt).update(password).digest('hex');
        if (verifyHash !== user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        this.issueToken(res, user.id);
        return res.status(200).json({ message: 'Login successful' });

    }

    public async handleGoogleRedirect(req: Request, res: Response) {
        const url = client.generateAuthUrl({
            access_type: 'offline',
            scope: ['openid', 'profile', 'email'],
        });
        res.redirect(url);
    }

    public async handleGoogleCallback(req: Request, res: Response) {
        const { code } = req.query;
        if (!code) return res.status(400).send('No code provided');

        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            throw new Error("GOOGLE_CLIENT_ID is missing in environment variables");
        }

        try {
            const { tokens } = await client.getToken(code as string);
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token as string,
                audience: googleClientId,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) throw new Error('Google payload missing required information');

            // 1. Attempt to find the user by Google ID or Email
            const [existingUser] = await db.select().from(users).where(
                or(eq(users.googleId, payload.sub), eq(users.email, payload.email))
            );

            let finalUser;

            if (!existingUser) {
                // 2. Create new user if they don't exist
                const [newUser] = await db.insert(users).values({
                    email: payload.email,
                    name: payload.name || 'Anonymous',
                    googleId: payload.sub,
                    avatarUrl: payload.picture,
                }).returning();
                finalUser = newUser;
            } else {
                finalUser = existingUser;
                // 3. Account Linking: Update Google ID if they registered via local auth previously
                if (!existingUser.googleId) {
                    const [updatedUser] = await db.update(users)
                        .set({ googleId: payload.sub })
                        .where(eq(users.id, existingUser.id))
                        .returning();
                    finalUser = updatedUser;
                }
            }

            // 4. Guaranteed Safety Check for TypeScript
            if (!finalUser) {
                return res.status(500).json({ message: 'User resolution failed' });
            }

            this.issueToken(res, finalUser.id);

            // Redirect to your frontend dashboard
            return res.redirect(process.env.FRONTEND_URL || '/');

        } catch (error) {
            console.error('Google Auth Error:', error);
            return res.status(500).json({ message: 'Authentication failed' });
        }
    }



    private issueToken(res: Response, userId: string) {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

    }

}

export default AuthenticationController;