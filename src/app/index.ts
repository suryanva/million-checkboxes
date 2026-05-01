import express from "express";
import type { Express } from "express";

export function createExpressApplication(): Express {
    const app = express();



    //Middlewares




    //Routes
    app.get('/', (req, res) => {
        return res.json({ message: 'Welcome to Million Checkboxes' })
    })


    return app;
}