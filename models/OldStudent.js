const mongoose = require('mongoose');

const OldStudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, index: true },
    password: String,
    photo: String,
    studentName: { first: String, middle: String, last: String },
    parentType: String,
    fatherName: { first: String, last: String },
    fatherMobile: String,
    motherName: { first: String, last: String },
    motherMobile: String,
    guardianName: { first: String, last: String },
    guardianMobile: String,
    guardianRelation: String,
    studentMobile: String,
    aadharNumber: String,
    aadharDocument: String,
    education: { board: String, class: String },
    completedSession: { sessionName: String, startDate: Date, endDate: Date },
    monthlyFees: Number,
    feesHistory: Array,
    attendance: Array,
    address: { current: String, permanent: String },
    totalFeesPaid: { type: Number, default: 0 },
    totalFeesDue: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
    sessionCompletedAt: { type: Date, default: Date.now },
    movedBy: String,
    reason: String
}, { timestamps: true });

module.exports = mongoose.model('OldStudent', OldStudentSchema);
