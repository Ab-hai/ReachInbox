import nodemailer from "nodemailer";
let transporter = null;
let etherealAccount = null;
export const initializeEthereal = async () => {
    // Create a test account on Ethereal
    const testAccount = await nodemailer.createTestAccount();
    etherealAccount = {
        user: testAccount.user,
        pass: testAccount.pass,
    };
    console.log("📧 Ethereal Email Credentials:");
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log(`   Preview URL: https://ethereal.email/login`);
    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    return transporter;
};
export const getTransporter = () => {
    if (!transporter) {
        throw new Error("Email transporter not initialized. Call initializeEthereal() first.");
    }
    return transporter;
};
export const getEtherealAccount = () => etherealAccount;
export const sendEmail = async (to, subject, body, from) => {
    const transport = getTransporter();
    // Check if body contains HTML tags (from rich text editor)
    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    // Create plain text version by stripping HTML
    const plainText = body
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    // Create HTML version - wrap in proper HTML structure
    const htmlBody = isHtml
        ? `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    blockquote { border-left: 3px solid #10b981; padding-left: 1rem; color: #666; font-style: italic; background: #f9fafb; padding: 0.5rem 1rem; margin: 0.5rem 0; }
    a { color: #10b981; }
    ul { list-style-type: disc; padding-left: 1.5rem; }
    ol { list-style-type: decimal; padding-left: 1.5rem; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`
        : `<div>${body.replace(/\n/g, "<br>")}</div>`;
    const info = await transport.sendMail({
        from: from || `"ReachInbox" <${etherealAccount?.user}>`,
        to,
        subject,
        text: plainText,
        html: htmlBody,
    });
    // Get preview URL for Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return {
        messageId: info.messageId,
        previewUrl,
    };
};
//# sourceMappingURL=email.js.map