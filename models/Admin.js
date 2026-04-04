const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true },
    pws: { type: String, required: true },
    name: { type: String, default: 'Admin' },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
