const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['student','employer','university','admin'], default: 'student' },
  name: { type: String },
  verified: { type: Boolean, default: false },
  profile: {
    skills: [String],
    education: [{ institution: String, degree: String, year: String }],
    certifications: [String],
    projects: [{ title: String, link: String, description: String }],
  },
  // Gamification: badges, streaks and points
  gamification: {
    points: { type: Number, default: 0 },
    badges: [{ key: String, awardedAt: Date }],
    applicationStreak: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
