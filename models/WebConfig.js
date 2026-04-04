const mongoose = require('mongoose');

const WebConfigSchema = new mongoose.Schema({
    logoText: { type: String, default: 'BBCC' },
    logoType: { type: String, enum: ['text', 'image', 'url'], default: 'text' },
    logoImage: { type: String, default: '' },
    title: { type: String, default: 'Bal Bharti Coaching' },
    subTitle: { type: String, default: 'Excellence in Education' },
    aboutText: { type: String, default: '' },
    slides: [{ type: String }],
    whatsapp: { type: String, default: '#' },
    insta: { type: String, default: '#' },
    fb: { type: String, default: '#' },
    twitter: { type: String, default: '#' },
    contactAddress: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    establishedYear: Number,
    totalStudentsTrained: Number,
    totalFaculty: Number
}, { timestamps: true });

module.exports = mongoose.model('WebConfig', WebConfigSchema);
