import type { Request, Response } from 'express'
import { registrationPayloadModel } from './auth.model.js';

class AuthenticationController {

    public async handleRegistration(req: Request, res: Response) {
        const validationResult = await registrationPayloadModel.safeParseAsync(req.body);
        if (validationResult.error) {
            return res.status(400).json({ message: 'body validation result', error: validationResult.error })
        }


    }

}


export default AuthenticationController;