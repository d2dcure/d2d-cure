// pages/api/contact.js

import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { fullName, date, email, phone, comment } = req.body;

    // Configure NodeMailer
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    try {
      // Format date as YYYY-MM-DD
      const formattedDate = new Date().toISOString().split('T')[0];
      // Create reference ID using name and date
      const referenceId = `${fullName.replace(/\s+/g, '-').toUpperCase()}-${formattedDate}`;

      await transporter.sendMail({
        from: email,
        to: process.env.GMAIL_RECEIVING_EMAIL,
        subject: `Contact Form Submission from ${fullName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.LOGO_URL}" alt="D2D Cure Logo" style="max-width: 200px; margin-bottom: 20px;">
              <h1 style="color: #06B7DB; margin: 0;">New Contact Form Submission</h1>
              <p style="color: #525252; font-size: 14px;">Received on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="background-color: #F5F5F5; padding: 24px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #000000; margin-top: 0; margin-bottom: 24px; font-size: 24px;">Contact Details</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; color: #666666; width: 120px;">Name:</td>
                  <td style="padding: 12px 0; color: #000000;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666666;">Date:</td>
                  <td style="padding: 12px 0; color: #000000;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666666;">Email:</td>
                  <td style="padding: 12px 0; color: #000000;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666666;">Phone:</td>
                  <td style="padding: 12px 0; color: #000000;">${phone || "Not provided"}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #666666;">Reference:</td>
                  <td style="padding: 12px 0; color: #000000;">${referenceId}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #F5F5F5; padding: 24px; border-radius: 8px;">
              <h2 style="color: #000000; margin-top: 0; margin-bottom: 24px; font-size: 24px;">Message</h2>
              <p style="color: #000000; line-height: 1.6; margin: 0;">${comment}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${email}?subject=Re: ${encodeURIComponent(`Contact Form Submission Response - ${referenceId}`)}&body=${encodeURIComponent(`Dear ${fullName},

This is regarding your contact inquiry submitted on ${date} where you wrote:

"${comment}"

[Your response here]

Best regards,
D2D Cure Team

Reference ID: ${referenceId}`)}"
                style="display: inline-block; padding: 12px 24px; background-color: #06B7DB; color: white; text-decoration: none; border-radius: 12px; font-weight: 500;">
                Reply to ${fullName}
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E4E4E7;">
              <p style="color: #525252; font-size: 12px;">This is an automated message from D2D Cure's website contact form.</p>
              <p style="color: #525252; font-size: 12px;">Reference ID: ${referenceId}</p>
            </div>
          </div>
        `,
      });

      // Store the reference ID in your response
      res.status(200).json({ 
        message: "Email sent successfully!", 
        referenceId 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Email could not be sent", error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}