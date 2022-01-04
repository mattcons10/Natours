const crypto = require('crypto');
const mongoose = require('mongoose');
//const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');
//const moment = require('moment-timezone');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A name is required.'],
    //validate: [validator.isAlpha, 'Name must only contain alpha characters.'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: [true, 'Email address is required.'],
    validate: [validator.isEmail, 'Invalid email.'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    trim: true,
    required: [true, 'A password is required.'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      //Only works on create and save
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords do not match.',
    },
    select: false,
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now,
    required: false,
  },
  photoCover: {
    type: String,
    trim: true,
  },
  photo: { type: String, default: 'default.jpg' },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpire: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //only runs if password was modified
  if (!this.isModified('password')) return next();

  //hash password with cost 12 and clear passwordConfirm
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('find', function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//instanced method available with every instanced document of a user.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  //false means token < changed password timestamp
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
