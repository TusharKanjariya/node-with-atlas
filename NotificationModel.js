var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var notificationSchema = mongoose.Schema({
  uid: ObjectId,
  message: String,
  read: Boolean,
  date: Date,
  teamid: ObjectId,
  isTeamInvite: { type: Boolean, default: false }
});
module.exports = mongoose.model('notification', notificationSchema);
