const { logEvents } = require("./logger");

const errorHandler = (err, req, res, next) => {
  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    "errLog.log"
  );
  console.log(err.stack);

  const status = res.statusCode ? res.statusCode : 500; // server error

  res.status(status);

  // res.json({ message: err.message });
  // rtk looks for this flag
  // this so rtk knows msg from here is an err
  // if i work with a backend dev need to tell them to set this flag if they're dealing with unexpected err
  res.json({ message: err.message, isError: true });
};

module.exports = errorHandler;

// the change here is because of how we are handling err in redux and rtk query
