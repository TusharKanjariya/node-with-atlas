const express = require('express');
const mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var multer = require('multer');
var fs = require('fs');
teamProfileStorage = multer.diskStorage({
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

var teamProfileUpload = multer({
  storage: teamProfileStorage,
  fileFilter: (req, file, cb) => {
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

var teamProfileImage = teamProfileUpload.single('teamProfile');

var teamsRoute = express.Router();

mongoose.connect(
  'mongodb+srv://ram:ram1234@cluster0-ry4fz.mongodb.net/design?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
);

var teamsSchema = mongoose.Schema({
  name: String,
  date: { type: Date, default: Date() },
  members: [{ type: ObjectId, ref: 'users' }],
  requestedMembers: [{ type: ObjectId, ref: 'users' }],
  admin: { type: ObjectId, ref: 'users' },
  image: String
});

var teams = mongoose.model('teams', teamsSchema);
var users = require('./UserModel');
var posts = require('./PostModel');
var notification = require('./NotificationModel');

teamsRoute.post('/create', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let imgName = '';
  teamProfileImage(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.log('first', err);
    } else if (err) {
      console.log(err);
    } else {
      console.log('done');
      imgName = req.file.filename;
    }
    if (req.body.name && req.body.adminId) {
      let requestedUsers = req.body.requestedMembers.split(',');
      let usersArray = requestedUsers.map(val => {
        return ObjectId(val);
      });
      let data = {
        name: req.body.name,
        members: [ObjectId(req.body.adminId)],
        requestedMembers: usersArray,
        admin: req.body.adminId,
        image: imgName
      };
      var sendData = new teams(data);
      sendData.save((err, doc) => {
        if (err) throw err;
        teams
          .aggregate([
            { $match: { _id: doc._id } },
            {
              $lookup: {
                from: 'users',
                localField: 'admin',
                foreignField: '_id',
                as: 'userData'
              }
            }
          ])
          .then(val => {
            let docsInsert = [];
            val[0].requestedMembers.map(v => {
              let it = {
                uid: v,
                teamid: ObjectId(val[0]._id),
                message: `You are added in Team ${val[0].name} by ${val[0].userData[0].fname} ${val[0].userData[0].lname}`,
                read: false,
                isTeamInvite: true
              };
              docsInsert.push(it);
            });
            notification.insertMany(docsInsert, (err, doc) => {
              if (err) throw err;
            });
            res.send({ val, created: true });
          });
      });
    }
  });
});

teamsRoute.get('/users', (req, res) => {
  users.find({}, (err, doc) => {
    if (err) throw err;
    res.send(doc);
  });
});

teamsRoute.get('/trash', (req, res) => {
  var available = [];
  teams.find({}, (err, res) => {
    res.map(val => {
      available.push(val.image);
    });
    let data = fs.readdirSync(__dirname + '/images/profiles/').filter(files => {
      return !available.includes(files);
    });
    data.forEach(d => {
      if (d.includes('teamProfile') === true) {
        fs.unlink(__dirname + '/images/profiles/' + d, err => {
          if (err) {
            console.error(err);
            return;
          }
        });
      }
    });
    available = [];
  });
  res.send('Done');
});

teamsRoute.post('/acceptInvite', (req, res) => {
  teams
    .findByIdAndUpdate(req.body.id, {
      $pull: { requestedMembers: { $in: [ObjectId(req.body.uid)] } },
      $push: { members: req.body.uid }
    })
    .then(val => {});

  notification
    .findByIdAndUpdate(req.body.notid, {
      isTeamInvite: false
    })
    .then(val => {});
  res.send({ ok: 1 });
});

teamsRoute.post('/rejectInvite', (req, res) => {
  teams
    .findByIdAndUpdate(req.body.id, {
      $pull: { requestedMembers: { $in: [ObjectId(req.body.uid)] } }
    })
    .then(val => {});

  notification
    .findByIdAndUpdate(req.body.notid, {
      isTeamInvite: false,
      read: true
    })
    .then(val => {});
  res.send({ ok: 1 });
});

teamsRoute.get('/myteams/:uid', (req, res) => {
  teams
    .aggregate([
      {
        $match: {
          members: ObjectId(req.params.uid)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'teamMembers'
        }
      }
    ])
    .then(val => {
      res.send(val);
    });
});

teamsRoute.get('/team/:id', (req, res) => {
  teams
    .aggregate([
      {
        $match: {
          _id: ObjectId(req.params.id)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'teamMembers'
        }
      }
    ])
    .then(val => {
      res.send(val);
    });
});

teamsRoute.get('/getPosts/:teamID', (req, res) => {
  posts.find({ teamid: ObjectId(req.params.teamID) }, (err, doc) => {
    if (err) throw err;
    res.send(doc);
  });
});

module.exports = teamsRoute;
