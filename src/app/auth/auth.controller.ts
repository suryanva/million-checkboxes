import type { Request, Response } from 'express'
import { registrationPayloadModel } from './auth.model.js';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { createHmac, randomBytes } from 'node:crypto';


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

}


export default AuthenticationController;