// we get the jwt package again
const jwt = require("jsonwebtoken");

// we make a verify middleware
const verifyJWT = (req, res, next) => {
  // we get the authorization from req.headers.authorization or Authorization
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // if there is not authorization header that starts with Bearer then send back unauthorized
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // we make a token var if the authorization header is found, we take it and call split on it and we only grab the second part ditching the bearer, we only need the token bit
  const token = authHeader.split(" ")[1];
  // then we call jwt.verify and we pass token and then we pass the secret access and the we pass and err handling func that has err and decoded info and inside we say if there was an err then return forbidden otherwise, save this in req.user, save decode.UserInfo.username that we made and for roles save decode.UserInfo.roles and then since its a middle call next
  // where was this used tho?
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = decoded.UserInfo.username;
    req.roles = decoded.UserInfo.roles;
    next();
  });
};

module.exports = verifyJWT;
