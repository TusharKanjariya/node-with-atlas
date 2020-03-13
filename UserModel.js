var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
var userSchema = mongoose.Schema({
  fname: String,
  lname: String,
  email: String,
  password: String,
  passion: String,
  followers: [{ type: ObjectId, ref: 'users' }],
  following: [{ type: ObjectId, ref: 'users' }],
  image: String
});

module.exports = mongoose.model('users', userSchema);
