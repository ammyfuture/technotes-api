// we get user model
const User = require("../models/User");
// we get bcrypt package
const bcrypt = require("bcrypt");
//  we get jwt package
const jwt = require("jsonwebtoken");
// we get asyncHandler like the other controllers
const asyncHandler = require("express-async-handler");

// 3 controllers for 3 routes

// @desc Login
// @route POST /auth
// @access Public

// login route, its a post so we post to front and then receive it here and then saved it in mongo
const login = asyncHandler(async (req, res) => {
  // getting username and password from front
  const { username, password } = req.body;

  // making sure they're both full if not, err msg we need all
  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // if they're there and it checks then we call user.findOnd and we use username we get from the front to find the user
  // goal finding the user with this username
  const foundUser = await User.findOne({ username }).exec();

  // if there is no user or user isn't active anymore then send an err resp with unauthorized
  // hopefully there is a way to delete the inactive users after awhile ...
  if (!foundUser || !foundUser.active) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // if user was found and active then we now verify the pass, is the pass we get and the foundUser.password the same?
  // we use this using compare method from jwt and it has its way of comparing the pass that it encrypts
  const match = await bcrypt.compare(password, foundUser.password);

  // if the pass if not it, then we send an err msg, unauthorized maybe better should be pass is wrong?
  if (!match) return res.status(401).json({ message: "Unauthorized" });

  // if pass is checked tho then we get jwt.sign and we pass an obj with:
  /*
    UserInfo prop and pass another obj to this user which has username and roles 
    username is foundUser.name and roles is foundUser.roles 

    so first arg is that userInfo arg
    second one is the access_token_secret that i'll make from .env and there is a config for when it expires and its in 15 minutes not sure what that means tho
    */

  // so again, if all checks out, we get jwt.sign, we save it under accessToken var
  // we pass two args, an obj that has a user info prop where we pass the username and the roles of the found user
  // sec is the secret word

  // access token made, what do we do with it?
  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: foundUser.username,
        roles: foundUser.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  // refresh token, we call jwt.sign again and pass the username from the found user and we pass a secret refresh token that i'll make in .env and it expires in 7 days
  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // so now we have an access token and a refresh token

  // so the res has a cookie we get it its a method we pass jwt as a string i guess specifying cookie type then we pass the refresh token
  // Create secure cookie with refresh token, then an obj, the obj takes these props: httpOnly: true, secure, true, sameSite none, maxAge is cookie expiry time which is how much? 7*24 means 7 days? then 60*60 which is 1200? then 1000 I'm guessing first computation is days sec min then seconds? idk
  // but the point is, we httpOnly means only accessible by web server, secure means https no http and sameSite none means we have diff ports and maxAge how long the cookie lives
  // question why not token here? just the refresh
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  // Send accessToken containing username and roles
  // we send accessToken not the refresh? wonder how that works
  res.json({ accessToken });
});

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
// this is a get one what is it getting? the refresh?
const refresh = (req, res) => {
  // so we are requesting the cookies? we saved them up in the login post req and i'm guessing they get stored in the req.cookies
  const cookies = req.cookies;
  // if cookie isn;t there or jwt isn't there return 401? unauthorized
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  // refresh token is saved in the jwt so the first arg was where we will save the refresh token, so we pass the name for first arg and the refresh token we made as sec and to extract it we first get the cookie, make sure its there and then we get th refresh token from the jwt thats a prop of the cookie now and the stuff in the obj where configs i guess for the refresh token
  const refreshToken = cookies.jwt;

  // when we create we use sign when we verify we use verify
  // we first check the refresh token, the refreshToken secret, the we use AsyncHandler here as a third arg and we have a func and we get err and decoded?
  // the async returns a forbidden msg if err was found
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });
      // we get the user using findOne and we pass username which is coming from decoded.username
      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();
      // if we don't find, we send unauthorized
      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      // if we find, we get accessToken and make a new one for 15 minutes, same process as before
      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );
      // we send back the accessToken
      res.json({ accessToken });
    })
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists

const logout = (req, res) => {
  // this one we post , we get cookies again from req.cookies
  const cookies = req.cookies;
  // if no jwt found we return no content?
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  // otherwise we return res.clearCookie and we pass the name and we pass the config, httpOnly again only servers, sameSite is none and secure is true so https and no max age because here we clear and then we send a res with cookie cleared
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

// export the three controllers
module.exports = {
  login,
  refresh,
  logout,
};

// refresh purpose is to give us a new access token
