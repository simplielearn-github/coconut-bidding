const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['PRODUCER', 'CONSUMER', 'ADMIN']
  },
}, {
  timestamps: true,
});

UserSchema.index({userName: 1}, {unique: true})

module.exports = mongoose.model("users", UserSchema);
