const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Logs the error stack to consol for debugging

    // Sets the HTTP status code, defaults to 500 if not provided
    const statusCode = err.statusCode || 500;

    // Sends a JSON responce with error details
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Something went wrong!', // Fallback error messsage
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Includes stack trace only in dev enviroment
    });
};

module.exports = errorHandler;
