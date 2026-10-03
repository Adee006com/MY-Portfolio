// server.js – with better CORS and logging
// console.log(process.env.http:127.0.0.1:5500)
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ----- CORS – allow all local dev origins -----
const allowedOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many requests, please try again later.',
});
app.use('/api/contact', limiter);

// ----- Email transporter -----
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ----- Validation -----
const validateContact = (name, email, message) => {
    const errors = [];
    if (!name || name.trim().length < 2) errors.push('Name is required (min 2 chars)');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
    if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters');
    return errors;
};

// ----- POST /api/contact -----
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    const errors = validateContact(name, email, message);
    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    try {
        // 1. Email to owner
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.OWNER_EMAIL,
            subject: `New contact from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
            html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`,
        });

        // 2. Confirmation to user
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Thank you for contacting us!',
            text: `Hi ${name},\n\nWe received your message:\n"${message}"\n\nWe'll get back to you shortly.\n\nBest regards,\nPortfolio Team`,
            html: `<p>Hi <strong>${name}</strong>,</p><p>We received your message:</p><blockquote>${message}</blockquote><p>We'll get back to you shortly.</p><p>Best regards,<br>Portfolio Team</p>`,
        });

        // 3. WhatsApp link
        const whatsappLink = `https://wa.me/${process.env.OWNER_WHATSAPP}?text=${encodeURIComponent(`Hi, I'm ${name} (${email}). ${message}`)}`;

        res.status(200).json({
            success: true,
            message: 'Message sent successfully!',
            whatsappLink,
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
});

// ----- Health check endpoint (test if backend is running) -----
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', time: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${5000}`);
    console.log(`📧 Email user: ${process.env.EMAIL_USER}`);
    console.log(`📱 WhatsApp: ${process.env.OWNER_WHATSAPP}`);
});
// Message is empty
