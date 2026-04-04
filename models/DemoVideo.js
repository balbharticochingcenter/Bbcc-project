const mongoose = require('mongoose');

const DemoVideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    videoSource: { type: String, enum: ['youtube', 'vimeo', 'mp4', 'embed'], default: 'youtube' },
    videoUrl: { type: String, required: true },
    thumbnail: String,
    duration: String,
    category: { type: String, default: 'demo' },
    tags: [String],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    uploadedBy: String,
    publishDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DemoVideo', DemoVideoSchema);
