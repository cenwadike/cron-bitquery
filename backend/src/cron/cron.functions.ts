/* 
  --------------------- CRON FUNCTIONS ---------------------
  - Define ```getTopTenWhalesCronFunction``` cron function
  - Define ```getTopWhaleTransactionsCronFunction``` cron function
*/

import { CronJobConfigModel, TopWhalesModel, WhaleTransactionModel } from "../bitquery/bitquery.models";
import dotenv from "dotenv";
import moment from 'moment';

// load .env variables
dotenv.config();

const BIT_QUERY_TOKEN = process.env.BIT_QUERY_TOKEN as string;
let tokenAddress: string | null | undefined;

export async function getTopTenWhalesCronFunction() {
    // get current date
    const date = moment(new Date());
    const formattedDate = date.format('YYYY-MM-DD').toString();

    // get token address from db
    let cronConfig = await CronJobConfigModel.find({}, 'Config.TokenAddress').limit(1);
    cronConfig.map(cronConfigItem => {
        // set interval
        tokenAddress = cronConfigItem.Config?.TokenAddress?.toString();
    })

    // ensure token address is not null or undefined
    if (tokenAddress !== undefined && tokenAddress !== null) {
        // construct header
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${BIT_QUERY_TOKEN}`);

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

        // fetch top whales
        await fetch("https://streaming.bitquery.io/graphql", requestOptions)
            .then((response) => response.text())
            .then(async (result) => {
                let resultJSON = JSON.parse(result);
                let data = resultJSON.data;
                console.log("data: ", result);
                
                if (resultJSON !== undefined && data.EVM.TokenHolders !== undefined) {
                    console.log("Cron Job: Getting Top Token whales")
                
                    let topWhales = await TopWhalesModel.find();

                    // save new top whale if collection is empty
                    if (topWhales.length === 0) {
                        for (let i = 0; i< data.EVM.TokenHolders.length; i++) {
                            let whales = new TopWhalesModel({
                                EVM: {
                                    TokenHolders: {
                                        Holder: {
                                            Address: JSON.stringify(data.EVM.TokenHolders[i].Holder.Address)
                                        }
                                    }
                                }
                            })
                    
                            whales.save();
                        }
                    }else {
                        // update top 10 whales
                        for (let i = 0; i< data.EVM.TokenHolders.length; i++) {
                            await TopWhalesModel.findOneAndUpdate(
                                { 
                                    EVM: 
                                        {
                                            TokenHolders: {
                                                Holder: {
                                                    Address: JSON.stringify(data.EVM.TokenHolders[i].Holder.Address)
                                                }
                                            }
                                        } 
                                },
                                { upsert: true, new: true } // upsert creates a new document if no match is found
                            );
                        }
                    }
                }
            })
            .catch((error) => console.error(error));    
    }  
}

export async function getTopWhaleTransactionsCronFunction() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${BIT_QUERY_TOKEN}`);

    let topWhales = await TopWhalesModel.find();

    topWhales.map(oneWhale => {
        let whale = JSON.stringify(oneWhale).toString(); 

        let raw = JSON.stringify({
            "query": "query MyQuery($buyer: String!, $seller: String!) { EVM(dataset: combined, network: bsc) { buyside: DEXTrades( limit: {count: 10} orderBy: {descending: Block_Time} where: {Trade: {Buy: {Buyer: {is: $buyer}}}} ) { Block { Number Time } Transaction { From To Hash } Trade { Buy { Amount Buyer Currency { Name Symbol SmartContract } Seller Price } Sell { Amount Buyer Currency { Name SmartContract Symbol } Seller Price } } } sellside: DEXTrades( limit: {count: 10} orderBy: {descending: Block_Time} where: {Trade: {Buy: {Seller: {is: $seller}}}} ) { Block { Number Time } Transaction { From To Hash } Trade { Buy { Amount Buyer Currency { Name Symbol SmartContract } Seller Price } Sell { Amount Buyer Currency { Name SmartContract Symbol } Seller Price } } } } }",
            "variables": {
                "buyer": whale,
                "seller": whale
            }
        })
    
        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
    
        fetch("https://streaming.bitquery.io/graphql", requestOptions)
            .then((response) => response.text())
            .then(async (result) => {
                console.log(result)
                
                // save whale transaction
                let whalesTx = new WhaleTransactionModel({
                    Transactions: JSON.stringify(result)
                })
        
                whalesTx.save();
            })
            .catch((error) => console.error(error));
    })    
}