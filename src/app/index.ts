import express from "express";
import type { Express } from "express";
import { authRouter } from "./auth/auth.routes.js";

export function createExpressApplication(): Express {
    const app = express();



    //Middlewares
    app.use(express.json())




    //Routes
    app.get('/', (req, res) => {
        return res.json({ message: 'Welcome to Million Checkboxes' })
    })
    app.use('/api/v1/auth', authRouter)


    return app;
}