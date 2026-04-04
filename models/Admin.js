const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    adminID: { type: String, required: true, unique: true },
    pws: { type: String, required: true },
    name: { type: String, default: 'Admin' }
});

module.exports = mongoose.model('Admin', AdminSchema);
