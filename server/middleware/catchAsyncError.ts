import express from "express";

export const CatchAsyncError = (theFunc: any) => (req: express.Request,res: express.Response,next:express.NextFunction) => {
    Promise.resolve(theFunc(req,res,next)).catch(next);
}
