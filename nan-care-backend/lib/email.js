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
async function sendScheduleEmail({ to, fullName, department, appointmentDate, appointmentTime }) {
  try {
    await resend.emails.send({
      from: 'Nan Care Hospital <onboarding@resend.dev>',
      to,
      subject: 'Your Appointment is Scheduled',
      html: `<p>Hi ${fullName},</p>
             <p>Your appointment for <b>${department}</b> has been scheduled.</p>
             <p><b>Date:</b> ${appointmentDate}<br/><b>Time:</b> ${appointmentTime}</p>
             <p>Payment received. See you at Nan Care Hospital.</p>`,
    });
  } catch (err) {
    console.error('Schedule email send failed:', err.message);
  }
}

module.exports = { sendAppointmentEmail, sendScheduleEmail };