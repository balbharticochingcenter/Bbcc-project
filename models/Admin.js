const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true, trim: true },
    pws: { type: String, required: true },
    photo: { type: String, default: '' },
    aadharNumber: { type: String, default: '' },
    aadharDoc: { type: String, default: '' },
    name: { type: String, default: 'Admin' },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
