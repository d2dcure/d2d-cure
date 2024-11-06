import nodemailer from 'nodemailer';
import multer from 'multer';
import { createRouter } from 'next-connect';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Create next-connect router
const router = createRouter();

// Add multer middleware
router.use(upload.single('file'));

router.post(async (req, res) => {
  try {
    const { fullName, date, email, phone, comment } = req.body;
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Format date and reference ID (keeping your existing logic)
    const formattedDate = new Date().toISOString().split('T')[0];
    const referenceId = `BUG-${fullName.replace(/\s+/g, '-').toUpperCase()}-${formattedDate}`;

    // Prepare email options
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_RECEIVING_EMAIL,
      subject: `Bug Report from ${fullName}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${process.env.LOGO_URL}" alt="D2D Cure Logo" style="max-width: 200px; margin-bottom: 20px;">
            <h1 style="color: #06B7DB; margin: 0;">New Bug Report Submission</h1>
            <p style="color: #525252; font-size: 14px;">Received on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: #F5F5F5; padding: 24px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #000000; margin-top: 0; margin-bottom: 24px; font-size: 24px;">Reporter Details</h2>
            
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
            <h2 style="color: #000000; margin-top: 0; margin-bottom: 24px; font-size: 24px;">Bug Description</h2>
            <p style="color: #525252; font-size: 14px;">${comment}</p>
          </div>

          ${req.file ? `
            <div style="background-color: #F5F5F5; padding: 24px; border-radius: 8px; margin-top: 20px;">
              <h2 style="color: #000000; margin-top: 0; margin-bottom: 24px; font-size: 24px;">Attached Screenshot</h2>
              <img src="cid:bugScreenshot" alt="Bug Screenshot" style="max-width: 100%; border-radius: 8px;">
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${email}?subject=Re: ${encodeURIComponent(`Bug Report Response - ${referenceId}`)}&body=${encodeURIComponent(`Dear ${fullName},

This is regarding your bug report submitted on ${date} where you wrote:

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
            <p style="color: #525252; font-size: 12px;">This is an automated message from D2D Cure's bug report system.</p>
            <p style="color: #525252; font-size: 12px;">Reference ID: ${referenceId}</p>
          </div>
        </div>
      `,
      attachments: req.file ? [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
          cid: 'bugScreenshot' // This links the attachment to the img src in the HTML
        }
      ] : [],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Bug report sent successfully!" });
  } catch (error) {
    console.error("Error sending bug report:", error);
    res.status(500).json({ message: "Failed to send bug report." });
  }
});

// Configure API route
export default router.handler({
  onError: (err, req, res) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  },
});

// Disable body parsing, we'll handle it with multer
export const config = {
  api: {
    bodyParser: false,
  },
}; 