var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var languagesSchema = new Schema({
    "language": String
});

module.exports = mongoose.model('languages', languagesSchema);