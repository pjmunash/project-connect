const mongoose = require('mongoose');

const ApplicationSub = new mongoose.Schema({
  
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  university: { type: String },
  degree: { type: String },
  major: { type: String },
  currentYear: { type: String },
  skills: [{ type: String }],
  status: { type: String, enum: ['applied','pending','accepted','rejected'], default: 'applied' },
  resumeUrl: { type: String },
  message: { type: String },
  appliedAt: { type: Date, default: Date.now }
}, { _id: true });

const InternshipSchema = new mongoose.Schema({
  
  title: { type: String },
  company: { type: String },
  description: { type: String },
  field: { type: String },
  location: { type: String },
  remote: { type: Boolean, default: false },
  paid: { type: Boolean, default: false },
    
    active: { type: Boolean, default: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  applicationForm: [{ question: String, type: { type: String, enum: ['text','textarea','select','checkbox'], default: 'text' }, options: [String] }],
  applicants: [ApplicationSub],
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Internship', InternshipSchema);
