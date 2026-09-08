const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendAppointmentEmail({ to, fullName, department, phone }) {
  try {
    await resend.emails.send({
      from: 'Nan Care Hospital <onboarding@resend.dev>', // switch to your verified domain later
      to,
      subject: 'New Appointment Request',
      html: `<p>${fullName} requested an appointment for ${department}. Phone: ${phone}</p>`,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

module.exports = { sendAppointmentEmail };