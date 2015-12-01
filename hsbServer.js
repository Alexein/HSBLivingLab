var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var mysql = require('mysql');

app.use( bodyParser.json() );
app.use(express.static(__dirname + '/public'));

var configModule = require("./configServer");
var hsbModule = require("./function/hsb");
var dbModule = require("./function/db");

function escapeInt(parameter) {
    return mysql.escape(parameter);
}
function escapeText(parameter) {
    return mysql.escape(parameter);
}
function escapeDate(parameter) {
    return mysql.escape(parameter);
}
function escapeTime(parameter) {
    return mysql.escape(parameter);
}
function escapeBool(parameter) {
    return mysql.escape(parameter);
}
function escapeDouble(parameter) {
    return mysql.escape(parameter);
}
app.post('/login', function(request, response) {
    var email = escapeText(request.body.email);
    var password = request.body.password; // Don't escape. Will be md5 hashed.
    hsbModule.login(response, configModule.dbPool(), email, password, configModule.hsbTitle());
});

app.post('/createBackup', function(request, response) {
    var sessionKey = escapeText(request.body.sessionKey);
    dbModule.createBackup(fs, hsbModule, response, configModule.dbPool(), sessionKey);
});

app.post('/currentUser', function(request, response) {
    var sessionKey = escapeText(request.body.sessionKey);
    hsbModule.currentUser(response, configModule.dbPool(), sessionKey);
});

app.post('/notifications', function(request, response) {
    var sessionKey = escapeText(request.body.sessionKey);
    var typeMask = escapeInt(request.body.typeMask);
    var statusMask = escapeInt(request.body.statusMask);
    hsbModule.notifications(response, configModule.dbPool(), sessionKey, typeMask, statusMask);
});

app.post('/sendMessage', function(request, response) {
    var sessionKey = escapeText(request.body.sessionKey);
    var subject = escapeText(request.body.subject);
    var body = escapeText(request.body.body);
    var recipients = request.body.recipients;
    hsbModule.sendMessage(response, configModule.dbPool(), sessionKey, subject, body, recipients);
});

app.post('/bookings', function(request, response) {
    var sessionKey = escapeText(request.body.sessionKey);
    var resourceName = escapeText(request.body.resourceName);
    var calendarStart = escapeText(request.body.calendarStart);
    var dayCount = request.body.dayCount;
    hsbModule.bookings(response, configModule.dbPool(), sessionKey, resourceName, calendarStart, dayCount);
});

app.post('/setBooking', function(request, response) {
    var sessionKey = escapeText(request.body.sessionKey);
    var booking = request.body.booking;
    var resourceName = escapeText(booking.resource);
    var date = escapeText(booking.date);
    var slotId = escapeInt(booking.slot);
    var type = booking.type; // [typeId: [unitId, ...], ...], unescaped
    var media = escapeInt(booking.media);
    var times = escapeInt(booking.times);
    hsbModule.setBooking(response, configModule.dbPool(), sessionKey, resourceName, date, slotId, type, media, times);
});

app.post('/setQueue', function(request, response) {
    var sessionKey = escapeText(request.body.sessionKey);
    var booking = request.body.booking;
    var resourceName = escapeText(booking.resource);
    var date = escapeText(booking.date);
    var slotId = escapeInt(booking.slot);
    var type = booking.type; // [typeId: count, ...], unescaped
    var alert = escapeInt(booking.alert);
    var autobook = escapeInt(booking.autobook);
    var media = escapeInt(booking.media);
    var times = escapeInt(booking.times);
    hsbModule.setQueue(response, configModule.dbPool(), sessionKey, resourceName, date, slotId, type, alert, autobook, media, times);
});

var server = app.listen(configModule.serverPort(), function () {
  var title = configModule.hsbTitle();
  var host = server.address().address
  var port = server.address().port

  console.log(title + " is listening at http://%s:%s", host, port)
  console.log('Press Ctrl + C to stop.');
})