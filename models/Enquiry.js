const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    alternateMobile: String,
    email: String,
    parentName: String,
    parentMobile: String,
    location: String,
    city: String,
    pincode: String,
    board: String,
    class: String,
    applicantType: { type: String, enum: ['self', 'father', 'mother', 'friend', 'relative', 'other'], default: 'self' },
    applicantRelation: String,
    course: String,
    preferredTime: String,
    message: String,
    source: { type: String, default: 'website' },
    status: { type: String, enum: ['pending', 'contacted', 'followup', 'admitted', 'not_interested', 'spam'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    notes: String,
    followupDate: Date,
    respondedBy: String,
    respondedAt: Date,
    assignedTo: String,
    ipAddress: String,
    userAgent: String,
    callReminderSent: { type: Boolean, default: false },
    reminderSentAt: Date
}, { timestamps: true });

EnquirySchema.index({ fullName: 'text', mobile: 'text' });
module.exports = mongoose.model('Enquiry', EnquirySchema);
