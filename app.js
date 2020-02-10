const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
// var cookieParser = require("cookie-parser");
var app = express();

// Session Management and Configuration
var sess;
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
  app.set("trust proxy", true); // trust first proxy
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cors());

// MongoDB Database Connection
mongoose.connect(
  "mongodb+srv://ram:ram1234@cluster0-ry4fz.mongodb.net/design?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// Check User is Logged in or Not
function isLogged(req, res, next) {
  if (sess) {
    next();
  } else {
    res.send({ loggedIn: false });
  }
}

// Creating a Schema Instance and Define Schema Structure
var Schema = mongoose.Schema;
var userSchema = new Schema({
  fname: String,
  lname: String,
  email: String,
  password: String,
  passion: String
});

// Creating a Schema Model used for Manipulate Data
var studentModel = mongoose.model("users", userSchema);

// Route APIs
app.get("/", function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send("Hii");
});
app.post("/insert", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.body.fname && req.body.lname) {
    let user = {
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      password: req.body.password,
      passion: req.body.passion
    };
    let sendData = new studentModel(user);
    sendData.save(err => {
      if (err) res.send(err);
      res.send({ status: true });
    });
  } else {
    res.send("Error : Can't Send Data");
  }
});

app.post("/login", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  sess = req.session;
  if (req.body.email && req.body.password) {
    let check = {
      email: req.body.email,
      password: req.body.password
    };
    studentModel.find(check, (err, result) => {
      if (err) throw err;
      if (result.length >= 0) {
        sess.userID = result[0]._id;
        sess.user = result;
        req.session = sess;
        res.send(req.session.user);
      } else {
        res.send({ status: false });
      }
    });
  }
});

app.get("/data", isLogged, (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  studentModel.find((err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

app.get("/logout", isLogged, (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  sess = "";
  res.end("Done");
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Start at" + PORT));
