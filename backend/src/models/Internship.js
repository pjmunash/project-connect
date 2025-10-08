const mongoose = require('mongoose');

const ApplicationSub = new mongoose.Schema({
  // allow missing user for legacy/seeded data; app code expects user when present
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // additional profile fields captured at the time of application
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
  // title made optional to avoid crashing on legacy/seeded documents missing this field
  title: { type: String },
  company: { type: String },
  description: { type: String },
  field: { type: String },
  location: { type: String },
  remote: { type: Boolean, default: false },
  paid: { type: Boolean, default: false },
    // whether the posting is active/published (allow take-down without deleting)
    active: { type: Boolean, default: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // The employer can define a custom application form for this posting
  applicationForm: [{ question: String, type: { type: String, enum: ['text','textarea','select','checkbox'], default: 'text' }, options: [String] }],
  applicants: [ApplicationSub],
  // allow storing answers to the custom form alongside each applicant (kept inside ApplicationSub as formAnswers)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Internship', InternshipSchema);
