export const CatchAsyncError =
    (theFunc: any) => (req,res,next) => {
    Promise.resolve(theFunc(req,res,next)).catch(next);
}