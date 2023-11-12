// dotenv is a package and config not sure
require("dotenv").config();
// express imported
const express = require("express");
// express invoked in app
const app = express();
// path imported
const path = require("path");
// logger and log event from logger imported
const { logger, logEvents } = require("./middleware/logger");
// errHandler imported
const errorHandler = require("./middleware/errorHandler");
// cookie parser package
const cookieParser = require("cookie-parser");
// cors package
const cors = require("cors");
// cors options from config
const corsOptions = require("./config/corsOptions");
// connectDB func
const connectDB = require("./config/dbConn");
// mongoose imported
const mongoose = require("mongoose");
// specified that port is either what we have in port or 3500
// server is 3500 and react is 3000
const PORT = process.env.PORT || 3500;

// not sure where we use this development in?
console.log(process.env.NODE_ENV);

// connect db here before we start everything
connectDB();

// we use the logger, this creates the reqLog.log file
app.use(logger);
// to activate the cors we pass the cors config to the cors package
app.use(cors(corsOptions));
// we get the ability to parse json here
app.use(express.json());
// we call cookie parser here
app.use(cookieParser());
// first route is just 3500/ but we already have the front public page ...
// okay so this is what well get if we go to 3500
// i think this is just the css and whats under is the html page
app.use("/", express.static(path.join(__dirname, "public")));
app.use("/", require("./routes/root"));
app.use("/auth", require("./routes/authRoutes"));
//this is for the users we pass the routes
// if i got to this route through 3500 port i just get the json coolz
app.use("/users", require("./routes/userRoutes"));
// same but for notes
app.use("/notes", require("./routes/noteRoutes"));
// this is a catch all for the other paths people might write
// it renders html if it accepts html, json if it accepts it and a txt if neither works
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// here is our err handler waiting under everything for any possible issues
app.use(errorHandler);

// here we set the mongoose connecting like dave not sure why he does it like that but me no care today
// we got connecting.once and .on
// on for success, on for err
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
