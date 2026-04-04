const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ['Student', 'Parent', 'Teacher', 'Alumni'], default: 'Student' },
    text: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    image: String,
    isActive: { type: Boolean, default: true },
    order: Number
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', TestimonialSchema);
