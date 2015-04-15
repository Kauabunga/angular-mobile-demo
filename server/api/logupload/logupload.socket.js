/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Logupload = require('./logupload.model');

exports.register = function(socket) {


  socket.on('logupload:log', function(argu){
    console.log('mnooo', JSON.stringify(argu));
  });

  Logupload.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Logupload.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('logupload:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('logupload:remove', doc);
}
