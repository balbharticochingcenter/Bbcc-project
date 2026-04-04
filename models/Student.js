const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    photo: { type: String, required: true, default: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23667eea"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40"%3E📷%3C/text%3E%3C/svg%3E' },
    
    studentName: {
        first: { type: String, required: true },
        middle: { type: String, default: '' },
        last: { type: String, required: true }
    },
    
    parentType: { type: String, enum: ['Father', 'Mother', 'Guardian'], required: true, default: 'Father' },
    
    fatherName: { first: String, middle: String, last: String },
    fatherMobile: String,
    motherName: { first: String, middle: String, last: String },
    motherMobile: String,
    guardianName: { first: String, middle: String, last: String },
    guardianMobile: String,
    guardianRelation: String,
    
    studentMobile: { type: String, required: true },
    alternateMobile: String,
    email: String,
    
    aadharNumber: { type: String, required: true, unique: true },
    aadharDocument: { type: String, required: true },
    
    education: {
        board: { type: String, required: true },
        class: { type: String, required: true }
    },
    
    currentSession: {
        sessionName: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    
    monthlyFees: { type: Number, required: true, default: 0 },
    
    feesHistory: [{
        sessionName: String,
        month: String,
        year: Number,
        monthIndex: Number,
        amount: Number,
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },
        status: { type: String, enum: ['paid', 'partial', 'unpaid', 'exempted'], default: 'unpaid' },
        paymentDate: Date,
        lateFee: { type: Number, default: 0 },
        remarks: String,
        updatedBy: String
    }],
    
    attendance: [{
        date: String,
        sessionName: String,
        status: { type: String, enum: ['present', 'absent', 'late', 'half-day', 'holiday'], default: 'absent' },
        checkInTime: String,
        checkOutTime: String,
        remarks: String,
        markedBy: String,
        markedAt: { type: Date, default: Date.now }
    }],
    
    accountStatus: {
        isBlocked: { type: Boolean, default: false },
        blockedFrom: Date,
        blockedUntil: Date,
        blockReason: String,
        blockedBy: String,
        unblockedAt: Date,
        unblockedBy: String
    },
    
    blockHistory: [{
        blockedFrom: Date,
        blockedUntil: Date,
        reason: String,
        blockedBy: String,
        unblockedAt: Date,
        unblockedBy: String,
        attendanceFrozen: { type: Boolean, default: true },
        feesFrozen: { type: Boolean, default: true }
    }],
    
    sessionCompleted: { type: Boolean, default: false },
    sessionCompletedAt: Date,
    movedToOldOn: Date,
    
    registrationDate: { type: Date, default: Date.now },
    joiningDate: { type: Date, required: true },
    leavingDate: Date,
    
    address: {
        current: String,
        permanent: String,
        city: String,
        state: String,
        pincode: String
    },
    
    previousSchool: String,
    remarks: String,
    createdBy: { type: String, default: 'admin' }
    
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
