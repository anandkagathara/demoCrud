const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: String,
    email: String,
    first_name: String,
    last_name : String,
    password: String,
    roles: 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
      }
    
  })
);

module.exports = User;
