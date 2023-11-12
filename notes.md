# CONFIG

allowedOrigins:
corsOptions:
dbConn

# CONTROLLERS

notesController
usersController

# LOGS

errLog
mongoErrLog
reqLog

# MIDDLEWARE

errHandler
logger

# MODELS

Note
User

# PUBLIC

style.css

# ROUTES

noteRoutes
root
userRoutes

# VIEWS

404
index.html

# SERVER

# ENV

<!-- why do we need logs, why do we need a public why we need the root.js and the 404 and index why? why the css? why we need the logger? -->

Authentication: verify who someone is - Login -

Authorization: what resources does someone have access to

...

1- auth route
2- auth router
3- auth controller
4- rate limiter for login in router package
(express-rate-limit)
5- loginLimiter in middleware

how to get a secret key
node
require("crypto").randomBytes(64).toString("hex)
