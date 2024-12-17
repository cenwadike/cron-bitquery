/* 
  --------------------- BITQUERY MODELS ---------------------
  Defines schema for cron job configuration and top whales  
*/

import mongoose from "mongoose";

// Define a schema
const Schema = mongoose.Schema;

// Define Cron job config schema
const CronJobConfigModelSchema = new Schema({
  Config: {
    Interval:  {
      type: Number
    },
    TokenAddress:  {
      type: String
    }
  }
});


// Define Bitquery TopWhalesModelSchema  schema
const TopWhalesModelSchema = new Schema({
  EVM: {
    TokenHolders: [
      {
        Holder: {
          Address: {
            type: String,
          }
        }
      }
    ]
  }
});

const WhaleTransactionSchema = new Schema({
  Transactions: {
    type: Object,
  }
});


// Compile model from schema
export const CronJobConfigModel = mongoose.model("CronJobConfigModel", CronJobConfigModelSchema);
export const TopWhalesModel = mongoose.model("TopWhalesModel", TopWhalesModelSchema);
export const WhaleTransactionModel = mongoose.model("WhaleTransactionModel", WhaleTransactionSchema);
