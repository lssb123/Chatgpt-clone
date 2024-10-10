import passport from "passport";
import passportJWT from "passport-jwt";
import express from "express";
import cors from "cors";

const { Strategy: JwtStrategy, ExtractJwt } = passportJWT;

const app = express();

//controllers
import { pingTest, test } from "../v1/controllers/test.controller.js";

//routers
import testRouter from "../v1/routes/test.routes.js";
import sessionRouter from "../v1/routes/session.routes.js";
import chatRouter from "../v1/routes/chat.routes.js";
import { createShareableSession, getSessionHistory } from "../v1/controllers/session.controller.js";

//defining the JWT strategy
const passportStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: "superSecret", // secret key
  },
  (jwt_payload, next) => {
    console.log(jwt_payload);
    next(null, jwt_payload);
  }
);

//init passport strategy
passport.use(passportStrategy);

//handle browser options Request
const handleOptionsReq = (req, res, next) => {
  if (req.method === "OPTIONS") {
    res.send(200);
  } else {
    next();
  }
};

app.use(cors())

// login route
// app.post("/login", )

//test routes
app.get("/test", test);
app.get("/test/ping", pingTest);


app.get("/api/session/share/:sessionId", createShareableSession);
app.get("/api/session/history/:sessionId",getSessionHistory );

//secured routes 
app.use(
  "/api",
  handleOptionsReq,
  passport.authenticate("jwt", { session: false }),
  sessionRouter,
  chatRouter
);

// app.use("/api", testRouter);

export default app;