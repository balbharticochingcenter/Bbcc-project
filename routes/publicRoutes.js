const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Testimonial = require('../models/Testimonial');

router.get('/health', (req, res) => {
    res.json({ success: true, message: "Server is running", timestamp: new Date() });
});

router.get('/stats', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalTeachers = await Teacher.countDocuments({ status: 'approved' });
        res.json({ success: true, data: { totalStudents, totalTeachers, totalCourses: 12, successRate: 96 } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/public/teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find({ status: 'approved' }).select('photo teacherName').limit(8);
        const publicTeachers = teachers.map(t => ({
            photo: t.photo,
            name: `${t.teacherName.first} ${t.teacherName.last}`
        }));
        res.json({ success: true, data: publicTeachers });
    } catch (err) {
        res.json({ success: false, data: [] });
    }
});

router.get('/public/students', async (req, res) => {
    try {
        const students = await Student.find().select('photo studentName').limit(8);
        const publicStudents = students.map(s => ({
            photo: s.photo,
            name: `${s.studentName.first} ${s.studentName.last}`
        }));
        res.json({ success: true, data: publicStudents });
    } catch (err) {
        res.json({ success: false, data: [] });
    }
});

router.get('/testimonials', async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, data: testimonials });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
