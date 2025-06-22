// const asyncHandler = (fn) => {()=>{}} // higher order function to handle async errors in Express.js which accepts an async function and returns a new function that handles errors

// const asyncHandler = (fn) => async ( req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Internal Server Error',
//         });
//     }
// }

const asyncHandler = (requestHandler) => {
        return (req,res,next)=>{
            Promise.resolve(requestHandler(req, res, next))
                .catch(next); // Passes any error to the next middleware   
    }
}
// The asyncHandler function is a higher-order function designed to handle asynchronous operations in Express.js routes. It takes an asynchronous request handler function as an argument and returns a new function that executes the request handler. If the request handler throws an error, it catches the error and passes it to the next middleware in the stack, allowing for centralized error handling.

export {asyncHandler}