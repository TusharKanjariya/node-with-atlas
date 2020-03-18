var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var postSchema = new mongoose.Schema({
  Userid: ObjectId,
  teamid: {
    type: ObjectId,
    required: false
  },
  title: String,
  description: String,
  tags: String,
  category: String,
  likes: [{ type: ObjectId, ref: 'users' }],
  image: String,
  date: Date
});

module.exports = mongoose.model('posts', postSchema);
