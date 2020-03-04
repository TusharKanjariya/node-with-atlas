const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
var cookieParser = require('cookie-parser');
var ObjectId = require('mongodb').ObjectID;
const multer = require('multer');
var app = express();

app.use(express.static('images'));
// Session Management and Configuration
var sess;
app.use(
  session({
    cookie: {
      path: '/',
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000
    },
    secret: 'itsram'
  })
);

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './images/uploads');
  },
  filename: (req, file, cb) => {
    let ext = file.originalname.substring(
      file.originalname.lastIndexOf('.'),
      file.originalname.length
    );
    cb(null, file.fieldname + Date.now() + ext);
  }
});

var profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './images/profiles');
  },
  filename: (req, file, cb) => {
    let ext = file.originalname.substring(
      file.originalname.lastIndexOf('.'),
      file.originalname.length
    );
    cb(null, file.fieldname + Date.now() + ext);
  }
});

var upload = multer({
  storage: storage,
  fileFilter: function(req, file, cb) {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      return cb(new Error('Supported Files are JPG, PNG and JPEG Formats.'));
    }
  }
});

var profileUpload = multer({
  storage: profileStorage,
  fileFilter: function(req, file, cb) {
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      return cb(new Error('Supported Files are JPG,PNG and JPEG Formats.'));
    }
  }
});
var postImage = upload.single('image');
var profileImage = profileUpload.single('profile');

if (app.get('env') === 'production') {
  app.set('trust proxy', true); // trust first proxy
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cors());

// MongoDB Database Connection
mongoose.connect(
  'mongodb+srv://ram:ram1234@cluster0-ry4fz.mongodb.net/design?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// Check User is Logged in or Not
function isLogged(req, res, next) {
  if (sess) {
    next();
  } else {
    next();
  }
}

// Creating a Schema Instance and Define Schema Structure
var Schema = mongoose.Schema;
var userSchema = new Schema({
  fname: String,
  lname: String,
  email: String,
  password: String,
  passion: String,
  followers: [{ type: ObjectId, ref: 'users' }],
  following: [{ type: ObjectId, ref: 'users' }],
  image: String
});
var postSchema = new Schema({
  Userid: ObjectId,
  title: String,
  description: String,
  tags: String,
  category: String,
  likes: [{ type: ObjectId, ref: 'users' }],
  image: String,
  date: Date
});

// Creating a Schema Model used for Manipulate Data
var studentModel = mongoose.model('users', userSchema);
var postModel = mongoose.model('posts', postSchema);

// Route APIs
app.get('/', function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'x-requested-with, x-requested-by'
  );
  res.send('Hii');
});
app.post('/signup', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let imgName = '';
  profileImage(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.log('first', err);
      res.send(err);
    } else if (err) {
      console.log(err);
      res.send(err);
    } else {
      console.log('done');
      imgName = req.file.filename;
    }
    if (req.body.fname && req.body.lname) {
      let user = {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        password: req.body.password,
        passion: req.body.passion,
        followers: [],
        following: [],
        image: imgName
      };
      let sendData = new studentModel(user);
      sendData.save(err => {
        if (err) res.send(err);
        res.send({ status: true });
        console.log('Done');
      });
    } else {
      res.send("Error : Can't Send Data");
    }
  });
});

app.post('/login', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  sess = req.session;
  if (req.body.email && req.body.password) {
    let check = {
      email: req.body.email,
      password: req.body.password
    };
    studentModel.find(check, (err, result) => {
      if (err) throw err;
      if (result.length >= 0) {
        res.send(result);
      } else {
        res.send({ status: false });
      }
    });
  }
});

app.get('/data', isLogged, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'x-requested-with, x-requested-by'
  );
  postModel.find((err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

app.post('/postUpload', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let imgName = '';
  postImage(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.log('first', err);
      res.send(err);
    } else if (err) {
      console.log(err);
      res.send(err);
    } else {
      console.log('done');
      imgName = req.file.filename;
    }
    let currentDate = new Date();
    if (req.body.userId && req.body.title) {
      let check = {
        Userid: mongoose.Types.ObjectId(req.body.userId),
        title: req.body.title,
        description: req.body.desc,
        tags: req.body.tags,
        category: req.body.category,
        likes: [],
        image: imgName,
        date: currentDate
      };
      let postData = new postModel(check);
      postData.save(err => {
        if (err) {
          console.log(err);
          res.send(err);
        }
        res.send({ status: true });
      });
    } else {
      res.send("Error : Can't Send Data");
    }
  });
});

app.post('/like', (req, res) => {
  if (req.body.id && req.body.userid) {
    postModel.find({ _id: req.body.id }, (err, result) => {
      let likes = result[0].likes.filter(
        val => val.toString() === req.body.userid
      );
      if (likes.length === 0) {
        postModel
          .findByIdAndUpdate(req.body.id, {
            $push: {
              likes: req.body.userid
            }
          })
          .then(val => {
            res.end();
          });
        res.end();
      }
    });
  }
  res.end();
});

app.get('/singlePost/:id', (req, res) => {
  postModel
    .aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'Userid',
          foreignField: '_id',
          as: 'userData'
        }
      }
    ])
    .exec((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

app.get('/profile/:id', (req, res) => {
  let id = req.params.id;
  studentModel
    .aggregate([
      { $match: { _id: mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'Userid',
          as: 'userPosts'
        }
      }
    ])
    .exec((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

app.get('/logout', isLogged, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'x-requested-with, x-requested-by'
  );
  sess = '';
  res.end('Done');
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Start at' + PORT));
