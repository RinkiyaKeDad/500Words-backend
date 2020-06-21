const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, //unique=true will just create an internal index for the email which in simple words simply speeds up the querying process if you request the email
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  articles: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Article' }],
});

//we use 3rd party package mongoose unique validator to ensure that email enterd is unique
userSchema.plugin(uniqueValidator);
module.exports = mongoose.model('User', userSchema);
