const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
// this is the file that starts our connection to mongo
// we require mongoose and then we create the connectDB function
// we use try and catch
// we try awaiting for mongoose.connect and pass the connection url we have saved in the env file
// if there are errs we log them instead and we export the func
