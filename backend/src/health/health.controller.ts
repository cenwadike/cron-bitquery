/* 
  --------------------- HEALTH CONTROLLERS ---------------------
  - Define ```healthCheck``` handler
*/

import { Request, Response, NextFunction} from "express";

function healthCheck(req:Request, res:Response, next: NextFunction) {
    res.sendStatus(200);
}

export default healthCheck;