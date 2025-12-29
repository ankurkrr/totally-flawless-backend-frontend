require('dotenv').config();
const nodemailer = require("nodemailer");

// Validate email configuration
if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
    console.error('WARNING: Email credentials not configured. Email functionality will not work.');
    console.error('Set MAIL_USER and MAIL_PASSWORD in your .env file');
}

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

// Common Data
const LogoUrl = "https://admin.totallyflawless.co/static/media/flawless.5b8b787b0b4c82186afd.png";
const commonStyles = `
    body, html {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        line-height: 1.4;
        height: 100%;
        width: 100%;
        background-color: #ffffff;
        color: #718096;
    }

    .container {
        width: 100%;
        background-color: #edf2f7;
        margin: 0;
        padding: 60px 0!important;
    }

    .content-table {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border: 1px solid #e8e5ef;
        border-radius: 2px;
        padding: 0;
    }

    .header {
        padding: 25px 0;
        text-align: center;
    }

    .header img {
        max-width: 100%;
        height: auto;
        border: none;
        max-height: 45px;
    }

    .body-content {
        padding: 32px;
    }

    .body-content h1 {
        color: #3d4852;
        font-size: 18px;
        font-weight: bold;
        margin-top: 0;
        text-align: left;
    }

    .body-content p {
        font-size: 16px;
        line-height: 1.5em;
        margin-top: 0;
        text-align: left;
    }

    .body-content p b {
        font-weight: bold;
    }

    .btn {
        display: inline-block;
        background-color: #008081;
        color: #ffffff!important;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 4px;
        margin-top: 20px;
    }

    .footer {
        padding: 0px 32px 32px 32px;
        text-align: center;
    }

    .footer p {
        color: #b0adc5;
        font-size: 12px;
        line-height: 1.5em;
        margin-top: 17px;
        text-align: center;
    }
`;

// Contact Us Mail
const contactUsMail = (to, subject, name, email, phone, message) => {
  if (!to) {
    console.log("No recipients defined");
    return;
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER || "noreply@totallyflawless.com",
    to,
    subject,
    html: `
            <!DOCTYPE html>
            <html lang="en">

            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Contact Us Form</title>
                <style>
                    ${commonStyles} 
                </style>
            </head>

            <body>
                <div class="container">
                    <table class="content-table" cellpadding="0" cellspacing="0">
                        <tbody>
                            <tr>
                                <td class="header" align="center">
                                    <a href="#" target="_blank">
                                        <img src=${LogoUrl} alt="Savvyy">
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td class="body-content">
                                    <h1>New Contact Form Submission</h1>
                                    <p><strong>Name:</strong> ${name}</p>
                                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                                    <p><strong>Phone:</strong> ${phone}</p>
                                    <p><strong>Message:</strong></p>
                                    <p style="color:black;">${message}</p>
                                </td>
                            </tr>
                            <tr>
                                <td class="footer">
                                    <p>&copy; 2025 Flawless. All rights reserved.</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </body>

            </html>`
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error sending contact mail:", error);
    } else {
      console.log("Contact mail sent: " + info.response);
    }
  });
};


module.exports = {
  contactUsMail
};
