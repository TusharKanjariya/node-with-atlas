const express = require('express');
const mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var notificationRoute = express.Router();

mongoose.connect(
  'mongodb+srv://ram:ram1234@cluster0-ry4fz.mongodb.net/design?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
);

var notification = require('./NotificationModel');

notificationRoute.get('/:id', (req, res) => {
  let id = req.params.id;
  notification.find({ uid: id }, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

notificationRoute.post('/add', (req, res) => {
  let notificationData = {
    uid: mongoose.Types.ObjectId(req.body.uid),
    message: req.body.message,
    read: req.body.read,
    date: new Date()
  };
  var addNot = new notification(notificationData);
  addNot.save(err => {
    console.log(err);
    console.log('done');
  });
  res.send(notificationData);
});

notificationRoute.post('/read', (req, res) => {
  let id = req.body.id;
  notification
    .findByIdAndUpdate(
      id,
      {
        read: true
      },
      { new: true }
    )
    .then(val => {
      res.send(val);
    });
});

notificationRoute.get('/read', (req, res) => {});
module.exports = notificationRoute;
