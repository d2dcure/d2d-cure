// pages/api/contact.js

import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { fullName, date, email, phone, comment } = req.body;

    // Configure NodeMailer
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail email
        pass: process.env.GMAIL_PASS, // Your Gmail app password
      },
    });

    try {
      // Send the email
      await transporter.sendMail({
        from: email,
        to: process.env.GMAIL_RECEIVING_EMAIL, // Your receiving email
        subject: `Contact Form Submission from ${fullName}`,
        text: `You have a new message from your website contact form:\n\n
               Name: ${fullName}\n
               Date: ${date}\n
               Email: ${email}\n
               Phone: ${phone || "Not provided"}\n
               Message: ${comment}`,
      });

      res.status(200).json({ message: "Email sent successfully!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Email could not be sent", error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}