/* 
  --------------------- APP ---------------------
  - Application entry point
  - Connects mongoose to database
  - Listens at configured port
*/

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import routes from "./routes";
import { CronJobConfigModel } from "./bitquery/bitquery.models";

// load .env variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI as string;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS as string;
const INITIAL_INTERVAL = process.env.INITIAL_INTERVAL as any as number;

// use express 
const app = express();
app.use(express.json());

// use helmet
app.use(helmet());

// allow all request
app.use(
    cors({
      origin: "*",
    })
);

// connect to DB
(
    async () => {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log("Connected To Database - Initial Connection");
        } catch (err) {
            console.log(
                `Initial Distribution API Database connection error occurred -`,
                err
            );
        }

        // setup cron job config
        try {
            const config = new CronJobConfigModel({
                Config: {
                    Interval: INITIAL_INTERVAL,
                    TokenAddress: TOKEN_ADDRESS
                }
            });

            // save config
            await config.save();
            console.log("Create initial config documents in Database");
        } catch (err) {
            console.log(
                `Initial Cron Job Config error occurred -`,
                err
            );
        }
    }
)();

routes(app);

// listen on specified port
const port = process.env.APP_PORT;
app.listen(port, () => {
    console.log(`Application listening at port ${port}`);
});
