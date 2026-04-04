const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    photo: { type: String, default: '' },
    studentName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    parentType: { type: String, enum: ['Father', 'Mother', 'Guardian'], default: 'Father' },
    fatherName: { first: String, last: String },
    fatherMobile: String,
    motherName: { first: String, last: String },
    motherMobile: String,
    guardianName: { first: String, last: String },
    guardianMobile: String,
    guardianRelation: String,
    studentMobile: { type: String, required: true },
    email: String,
    aadharNumber: { type: String, required: true, unique: true },
    aadharDocument: { type: String, default: '' },
    education: {
        board: { type: String, required: true },
        class: { type: String, required: true }
    },
    currentSession: {
        sessionName: String,
        startDate: Date,
        endDate: Date
    },
    monthlyFees: { type: Number, default: 0 },
    feesHistory: [{
        sessionName: String,
        month: String,
        year: Number,
        monthIndex: Number,
        amount: Number,
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },
        status: { type: String, enum: ['paid', 'partial', 'unpaid'], default: 'unpaid' },
        paymentDate: Date,
        remarks: String
    }],
    attendance: [{
        date: String,
        sessionName: String,
        status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'absent' },
        checkInTime: String,
        checkOutTime: String,
        remarks: String,
        markedAt: { type: Date, default: Date.now }
    }],
    accountStatus: {
        isBlocked: { type: Boolean, default: false },
        blockedFrom: Date,
        blockReason: String,
        blockedBy: String
    },
    blockHistory: [{
        blockedFrom: Date,
        blockedUntil: Date,
        reason: String,
        blockedBy: String,
        unblockedAt: Date
    }],
    joiningDate: { type: Date, default: Date.now },
    address: {
        current: String,
        permanent: String
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', StudentSchema);
