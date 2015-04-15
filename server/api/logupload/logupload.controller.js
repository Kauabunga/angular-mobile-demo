'use strict';

var _ = require('lodash');
var Logupload = require('./logupload.model');

// Get list of loguploads
exports.index = function(req, res) {
  Logupload.find(function (err, loguploads) {
    if(err) { return handleError(res, err); }
    return res.json(200, loguploads);
  });
};

// Get a single logupload
exports.show = function(req, res) {
  Logupload.findById(req.params.id, function (err, logupload) {
    if(err) { return handleError(res, err); }
    if(!logupload) { return res.send(404); }
    return res.json(logupload);
  });
};

// Creates a new logupload in the DB.
exports.create = function(req, res) {
  Logupload.create(req.body, function(err, logupload) {
    if(err) { return handleError(res, err); }
    return res.json(201, logupload);
  });
};

// Updates an existing logupload in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Logupload.findById(req.params.id, function (err, logupload) {
    if (err) { return handleError(res, err); }
    if(!logupload) { return res.send(404); }
    var updated = _.merge(logupload, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, logupload);
    });
  });
};

// Deletes a logupload from the DB.
exports.destroy = function(req, res) {
  Logupload.findById(req.params.id, function (err, logupload) {
    if(err) { return handleError(res, err); }
    if(!logupload) { return res.send(404); }
    logupload.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}