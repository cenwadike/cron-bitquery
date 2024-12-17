/* 
  --------------------- BITQUERY CONTROLLERS ---------------------
  - Set up initial cron job
  - Define ```setCronIntervalHandler``` handler
  - Define ```setCronTokenAddressHandler``` handler
  - Define ```getTopTenWhalesHandler``` handler
  - Define ```getTopWhaleTransactionsHandler``` handler
*/

import { Request, Response, NextFunction } from "express";
import { getTopTenWhalesCronFunction, getTopWhaleTransactionsCronFunction } from "../cron/cron.functions";
import cron from "node-cron";
import dotenv from "dotenv";
import { CronJobConfigModel, WhaleTransactionModel } from "./bitquery.models";
import moment from "moment";

// load .env variables
dotenv.config();

const BIT_QUERY_TOKEN = process.env.BIT_QUERY_TOKEN as string;

let interval;
let task: cron.ScheduledTask;

// setup cron job
(
    async() => {
        try {
            // get cron config
            let cronConfig = await CronJobConfigModel.find({}, 'Config.Interval').limit(1);

            // start initial cron job
            cronConfig.map(cronConfigItem => {
                // set interval
                interval = cronConfigItem.Config?.Interval;

                // create cron job schedule
                if (interval !== undefined) {
                    task = cron.schedule('*/' + interval + ' * * * * *',  function() {
                        getTopTenWhalesCronFunction();
                        getTopWhaleTransactionsCronFunction();
                    });

                    task.start();
                }
            })
        } catch (error) {
            console.error("Failed to set up cron job with error: ", error);
        }
    }
)(); 

export async function setCronIntervalHandler(req:Request, res:Response, next: NextFunction) {
    const newInterval = req.body.interval as any as number;
    const timeFrame = req.body.frame as any as string; 

    // update cron job interval
    await CronJobConfigModel.updateOne({
        Config: {
            Interval: newInterval
        }
    });

    switch (timeFrame) {
        case "seconds":
            // validate interval
            if (newInterval <= 0 || newInterval > 59) {
                res.status(400).send("Invalid interval. Ensure interval is greater than 0 and less than 60");
            }
            // create cron job schedule
            const newSecondsTask = cron.schedule('*/' + newInterval + ' * * * * *',  function() {
                getTopTenWhalesCronFunction();
                getTopWhaleTransactionsCronFunction();
                console.log(`running a task every ${newInterval} second`);
            });

            // stop old cron job
            task.stop();

            // create new cron job that runs every x interval
            task = newSecondsTask;
            task.start();

            console.log(`Updated Cron Job interval to ${newInterval} seconds`);

            break;

        case "minutes":
            // validate interval
            if (newInterval <= 0 || newInterval > 59) {
                res.status(400).send("Invalid interval. Ensure interval is greater than 0 and less than 60");
            }
            // create cron job schedule
            const newMiinutesTask = cron.schedule('* */' + newInterval + ' * * * *',  function() {
                getTopTenWhalesCronFunction();
                getTopWhaleTransactionsCronFunction();
                console.log(`running a task every ${newInterval} minutes`);
            });

            // stop old cron job
            task.stop();

            // create new cron job that runs every x interval
            task = newMiinutesTask;
            task.start();
            
            console.log(`Updated Cron Job interval to ${newInterval} minutes`);

            break;

        case "hours":
            // validate interval
            if (newInterval <= 0 || newInterval > 23) {
                res.status(400).send("Invalid interval. Ensure interval is greater than 0 and less than 24");
            }
            // create cron job schedule
            const newHoursTask = cron.schedule('* * */' + newInterval + ' * * *',  function() {
                getTopTenWhalesCronFunction();
                getTopWhaleTransactionsCronFunction();
                console.log(`running a task every ${newInterval} hours`);
            });

            // stop old cron job
            task.stop();

            // create new cron job that runs every x interval
            task = newHoursTask;
            task.start();

            console.log(`Updated Cron Job interval to ${newInterval} hours`);
            
            break;

        default:
            res.status(400).send("Invalid time frame provided");
            break;
    }

    res.status(200).send("OK");
}


export async function setCronTokenAddressHandler(req:Request, res:Response, next: NextFunction) {
    const tokenAddress = req.body.address as any as string;

    // update cron job config
    await CronJobConfigModel.updateOne({
        Config: {
            TokenAddress: tokenAddress
        }
    })    

    res.status(200).send("OK");
}

export async function getTopTenWhalesHandler(req:Request, res:Response, next: NextFunction) {
    let tokenAddress;
    // get current date
    const date = moment(new Date());
    const formattedDate = date.format('YYYY-MM-DD').toString();

    // get cron config
    let cronConfig = await CronJobConfigModel.find({}, 'Config.TokenAddress').limit(1);

    // start initial cron job
    cronConfig.map(cronConfigItem => {
        // set interval
        tokenAddress = cronConfigItem.Config?.TokenAddress;
    });
    
    // ensure token address was retrieved from DB
    if (tokenAddress !== undefined && tokenAddress !== null) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append('Authorization', `Bearer ${BIT_QUERY_TOKEN}`);

        const raw = JSON.stringify({
            "query": "query MyQuery($date: String!, $tokenSmartContract: String!) { EVM(dataset: archive, network: bsc) { TokenHolders(date: $date, tokenSmartContract: $tokenSmartContract, where: { Balance: { Amount: { ge: \"10000000\" } } }, limit: { count: 10 }, orderBy: { descending: Balance_Amount }) { Holder { Address } } } }",
            "variables": {
                "date": formattedDate,
                "tokenSmartContract": tokenAddress
            }
        });

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch("https://streaming.bitquery.io/graphql", requestOptions)
            .then((response) => response.text())
            .then((result) => {
                console.log("Getting Top Token whales")
                console.log(JSON.stringify(result));
                res.send(JSON.stringify(result))
            })
            .catch((error) => console.error(error));    

    }
}

export async function getTopWhaleTransactionsHandler(req:Request, res:Response, next: NextFunction) {
    let whaleTx = await WhaleTransactionModel.find({}, 'Transactions').limit(10);

    res.status(200).send(whaleTx);
}
