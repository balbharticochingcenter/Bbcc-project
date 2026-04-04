const mongoose = require('mongoose');

const OldStudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { first: String, last: String },
    studentMobile: String,
    education: { board: String, class: String },
    completedSession: { sessionName: String, startDate: Date, endDate: Date },
    totalFeesPaid: { type: Number, default: 0 },
    totalFeesDue: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
    sessionCompletedAt: { type: Date, default: Date.now },
    reason: String
});

module.exports = mongoose.model('OldStudent', OldStudentSchema);
