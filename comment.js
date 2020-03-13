const express = require('express');
const mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var commentsRoute = express.Router();

mongoose.connect(
  'mongodb+srv://ram:ram1234@cluster0-ry4fz.mongodb.net/design?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const commentSchema = mongoose.Schema({
  postid: { type: ObjectId },
  uid: { type: ObjectId, ref: 'users' },
  comment: String,
  date: { type: Date, default: Date() }
});

const comment = mongoose.model('comments', commentSchema);

commentsRoute.get('/:postid', (req, res) => {
  comment
    .aggregate([
      { $match: { postid: ObjectId(req.params.postid) } },
      {
        $lookup: {
          from: 'users',
          localField: 'uid',
          foreignField: '_id',
          as: 'userData'
        }
      }
    ])
    .then(val => {
      res.send(val);
    });
});

commentsRoute.post('/', (req, res) => {
  var commentData = new comment(req.body);
  commentData.save(err => {
    if (err) throw err;
  });
  res.send({ ok: 'Done' });
});

module.exports = commentsRoute;
