const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOtpEmail({ to, code }) {
  await resend.emails.send({
    from: 'Nan Care Hospital <onboarding@resend.dev>', // switch to your verified domain later
    to,
    subject: 'Your Nan Care Hospital login code',
    html: `<p>Your one-time login code is:</p>
           <h2 style="letter-spacing:4px;">${code}</h2>
           <p>This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

module.exports = { sendOtpEmail };