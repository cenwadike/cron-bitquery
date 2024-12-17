/* 
  --------------------- ROUTES ---------------------
  - Defines routes
*/

import {Express} from "express";
import {getTopTenWhalesHandler, getTopWhaleTransactionsHandler, setCronIntervalHandler, setCronTokenAddressHandler} from "./bitquery/bitquery.controllers";
import healthCheck from "./health/health.controller";

function routes(app: Express) {
    app.get("/", healthCheck);
    app.post("/api/v1/cron-bitquery/intervals/set", setCronIntervalHandler);
    app.post("/api/v1/cron-bitquery/address/set", setCronTokenAddressHandler);
    app.get("/api/v1/cron-bitquery/whales/get", getTopTenWhalesHandler);
    app.get("/api/v1/cron-bitquery/transactions/get", getTopWhaleTransactionsHandler);
}

export default routes;