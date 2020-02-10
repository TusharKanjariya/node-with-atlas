const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");

var app = express();
var sess;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    cookie: {
      path: "/",
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000
    },
    secret: "itsram"
  })
);

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies
}

app.post("/login", function(req, res, next) {
  sess = req.session;
  users = {
    name: req.body.name,
    password: req.body.password
  };
  sess.user = users;

  res.end("Done");
});

app.get("/", (req, res) => {
  res.send(req.session.user);
});

app.listen(process.env.PORT || 3000);
