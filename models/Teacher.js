const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
    teacherId: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    photo: { type: String, required: true },
    teacherName: { first: String, middle: String, last: String },
    fatherName: { first: String, middle: String, last: String },
    mobile: { type: String, required: true },
    altMobile: String,
    dob: Date,
    lastQualification: String,
    qualificationDoc: String,
    aadharNumber: { type: String, required: true, unique: true },
    aadharDoc: String,
    subject: String,
    salary: { type: Number, default: 0 },
    salaryHistory: [{
        month: String, year: Number, monthIndex: Number,
        salary: Number, paidAmount: Number, dueAmount: Number,
        status: String, paymentDate: Date, updatedBy: String, remarks: String
    }],
    attendance: [{
        date: String, status: String, remarks: String,
        photo: String, markedBy: String, markedAt: Date
    }],
    joiningDate: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    address: { current: String, permanent: String, city: String, state: String, pincode: String },
    bankDetails: { accountHolder: String, accountNumber: String, ifscCode: String, bankName: String },
    emergencyContact: { name: String, relation: String, phone: String },
    experience: Number,
    previousSchool: String,
    resume: String,
    experienceCertificate: String,
    remarks: String,
    rejectionReason: String,
    createdBy: String
}, { timestamps: true });

module.exports = mongoose.model('Teacher', TeacherSchema);
