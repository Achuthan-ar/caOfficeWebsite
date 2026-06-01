import nodemailer from 'nodemailer';

// Helper to create a nodemailer transporter
const getTransporter = async () => {
  // If SMTP configurations exist in .env, use them
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Create ethereal mail account for testing/demo
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log(`Ethereal email account created: ${testAccount.user}`);
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  } catch (error) {
    console.error('Error creating ethereal test account, returning mock transporter:', error.message);
    // return mock transporter that does nothing but prints to console
    return {
      sendMail: async (mailOptions) => {
        console.log('--- MOCK EMAIL SEND ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body:\n${mailOptions.text}`);
        console.log('------------------------');
        return { messageId: 'mock-id-12345', previewUrl: 'http://localhost' };
      }
    };
  }
};

export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"CA Office Support" <${process.env.FROM_EMAIL || 'support@caoffice.com'}>`,
    to: email,
    subject: 'Password Reset Request - CA Office',
    text: `Hello ${name},\n\nYou requested a password reset. Please click on the link below or copy and paste it into your browser to reset your password:\n\n${resetUrl}\n\nThis link is valid for 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nCA Office Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2563eb; text-align: center;">CA Office ERP</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset the password for your CA Office account. You can reset your password by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste the following link in your browser URL bar:</p>
        <p style="word-break: break-all; color: #4b5563;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          This link will expire in 10 minutes. If you did not request a password reset, please ignore this email.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  
  // If we are using ethereal, log the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Password reset email sent. Preview URL: ${previewUrl}`);
    return previewUrl;
  }

  return true;
};

export const sendApplicationReceivedEmail = async (email, name, jobTitle) => {
  const transporter = await getTransporter();
  const mailOptions = {
    from: `"CA Office Careers" <${process.env.FROM_EMAIL || 'careers@caoffice.com'}>`,
    to: email,
    subject: `Application Received: ${jobTitle} - CA Office`,
    text: `Hello ${name},\n\nThank you for applying for the ${jobTitle} opening at CA Office. We have successfully received your profile and cover letter. Our recruiting team will review details shortly.\n\nBest regards,\nCA Office HR Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2563eb; text-align: center;">CA Office Careers</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for submitting your application for the <strong>${jobTitle}</strong> position. We have received your details, and our human resources department is currently reviewing your resume.</p>
        <p>If your profile matches our requirements, we will reach out to schedule an interview.</p>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Best regards,<br><strong>CA Office HR Operations</strong>
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Application received email sent. Preview URL: ${previewUrl}`);
  }
  return true;
};

export const sendApplicationStatusUpdateEmail = async (email, name, jobTitle, status, remarks) => {
  const transporter = await getTransporter();
  const mailOptions = {
    from: `"CA Office Careers" <${process.env.FROM_EMAIL || 'careers@caoffice.com'}>`,
    to: email,
    subject: `Application Status Update: ${jobTitle} - CA Office`,
    text: `Hello ${name},\n\nYour application for the ${jobTitle} opening has been set to: ${status}.\nRemarks: ${remarks || 'None'}\n\nBest regards,\nCA Office HR Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2563eb; text-align: center;">CA Office Careers</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We would like to share an update regarding your application for the <strong>${jobTitle}</strong> position. Your application is now marked as:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="background-color: #2563eb; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 1.1rem;">
            ${status}
          </span>
        </div>
        ${remarks ? `<p><strong>Recruiter Notes:</strong> ${remarks}</p>` : ''}
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Best regards,<br><strong>CA Office HR Operations</strong>
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Application status update email sent. Preview URL: ${previewUrl}`);
  }
  return true;
};

export const sendInternCredentialsEmail = async (email, name, password) => {
  const transporter = await getTransporter();
  const mailOptions = {
    from: `"CA Office IT Support" <${process.env.FROM_EMAIL || 'admin@caoffice.com'}>`,
    to: email,
    subject: `Internship Welcome & Portal Login Credentials - CA Office`,
    text: `Hello ${name},\n\nWelcome to your internship at CA Office! Your account has been registered.\n\nLogin credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease login at http://localhost:5173/login to access your internship tasks and reports.\n\nBest regards,\nCA Office IT Support`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2563eb; text-align: center;">CA Office ERP</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Welcome to your internship! Your applicant account has been approved and converted to an Intern profile in our ERP system. You can now access your training, mentors, report uploads, and tasks.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0 0 8px 0;"><strong>Your Portal Login Details:</strong></p>
          <p style="margin: 0 0 5px 0;"><strong>Username / Email:</strong> ${email}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="http://localhost:5173/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Login to Portal</a>
        </div>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Best regards,<br><strong>CA Office IT Support</strong>
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Intern welcome credentials email sent. Preview URL: ${previewUrl}`);
  }
  return true;
};

export const sendLeaveStatusEmail = async (email, name, leaveType, status, remarks, diffDays) => {
  const transporter = await getTransporter();
  const mailOptions = {
    from: `"CA Office Leave Desk" <${process.env.FROM_EMAIL || 'leaves@caoffice.com'}>`,
    to: email,
    subject: `Leave Request Decision: ${status} - CA Office`,
    text: `Hello ${name},\n\nYour request for ${diffDays} day(s) of ${leaveType} has been ${status.toUpperCase()}.\nRemarks: ${remarks || 'None'}\n\nBest regards,\nCA Office HR Operations`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2563eb; text-align: center;">CA Office ERP</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>This is to inform you that your leave request has been evaluated. Your request for <strong>${diffDays} day(s)</strong> of <strong>${leaveType}</strong> is now:</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="background-color: ${status === 'Approved' ? '#10b981' : '#ef4444'}; color: white; padding: 10px 20px; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 1.1rem; text-transform: uppercase;">
            ${status}
          </span>
        </div>
        ${remarks ? `<p><strong>Supervisor Remarks:</strong> ${remarks}</p>` : ''}
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Best regards,<br><strong>CA Office HR Desk</strong>
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Leave status email sent. Preview URL: ${previewUrl}`);
  }
  return true;
};

export const sendTaskAssignmentEmail = async (email, name, taskTitle, dueDate, creatorName) => {
  const transporter = await getTransporter();
  const formattedDueDate = new Date(dueDate).toLocaleDateString();
  const mailOptions = {
    from: `"CA Office Task Manager" <${process.env.FROM_EMAIL || 'tasks@caoffice.com'}>`,
    to: email,
    subject: `New Compliance Task Assigned: "${taskTitle}" - CA Office`,
    text: `Hello ${name},\n\nYou have been assigned a new task: "${taskTitle}" by ${creatorName}.\nDue Date: ${formattedDueDate}\n\nPlease log in to review task requirements and track progress.\n\nBest regards,\nCA Office Operations`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2563eb; text-align: center;">CA Office ERP</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been assigned a new task on the Compliance Task Board:</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0 0 8px 0; font-size: 1.1rem;"><strong>${taskTitle}</strong></p>
          <p style="margin: 0 0 5px 0; color: #4b5563;"><strong>Assigned By:</strong> ${creatorName}</p>
          <p style="margin: 0; color: #ef4444;"><strong>Due Date:</strong> ${formattedDueDate}</p>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="http://localhost:5173/tasks" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View Task Board</a>
        </div>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Best regards,<br><strong>CA Office Operations Team</strong>
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Task assignment email sent. Preview URL: ${previewUrl}`);
  }
  return true;
};

export const sendReminderEmail = async (email, name, reminderType, details) => {
  const transporter = await getTransporter();
  const mailOptions = {
    from: `"CA Office Notifications" <${process.env.FROM_EMAIL || 'reminders@caoffice.com'}>`,
    to: email,
    subject: `Urgent Reminder: ${reminderType} - CA Office`,
    text: `Hello ${name},\n\nThis is a reminder regarding: ${reminderType}.\n\nDetails: ${details}\n\nPlease take appropriate action as soon as possible.\n\nBest regards,\nCA Office Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #ef4444; text-align: center;">CA Office ERP Reminder</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>This is an automated system reminder regarding outstanding compliance items:</p>
        <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; color: #b45309;">
          <p style="margin: 0 0 5px 0; font-size: 1.05rem;"><strong>Reminder: ${reminderType}</strong></p>
          <p style="margin: 0; font-size: 0.95rem; color: #4b5563;">${details}</p>
        </div>
        <p>Please log in to the ERP portal to resolve this item.</p>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Best regards,<br><strong>CA Office Notifications Desk</strong>
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Reminder email sent. Preview URL: ${previewUrl}`);
  }
  return true;
};

export const sendOtpEmail = async (email, otp) => {
  const transporter = await getTransporter();
  const mailOptions = {
    from: `"CA Office Support" <${process.env.FROM_EMAIL || 'support@caoffice.com'}>`,
    to: email,
    subject: 'Email Verification Code - CA Office',
    text: `Hello,\n\nYour one-time verification code is: ${otp}\n\nThis code is valid for 5 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nCA Office Support`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2563eb; text-align: center;">CA Office ERP</h2>
        <p>Hello,</p>
        <p>Thank you for registering with CA Office ERP. Please use the following one-time verification code (OTP) to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 2.2rem; font-weight: 950; letter-spacing: 6px; color: #2563eb; background-color: #f3f4f6; padding: 12px 30px; border-radius: 8px; border: 1px dashed #2563eb; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 0.85rem; color: #ef4444; font-weight: bold; text-align: center;">
          * This verification code is valid for 5 minutes only.
        </p>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`OTP verification email sent. Preview URL: ${previewUrl}`);
  }
  return true;
};

export const sendOneTimeRegistrationEmail = async (email, name, password, managerName, managerEmail, roleName) => {
  const transporter = await getTransporter();
  const mailOptions = {
    from: `"${managerName} (via CA Office)" <${managerEmail}>`,
    to: email,
    replyTo: managerEmail,
    subject: 'One-Time ERP Portal Registration - CA Office',
    text: `Hello ${name},\n\nYou have been registered as a ${roleName} at CA Office by your Manager, ${managerName}.\n\nYour one-time login credentials:\nEmail: ${email}\nTemporary Password: ${password}\n\nPlease login at http://localhost:5173/login to access the portal and update your password immediately.\n\nBest regards,\nCA Office HR Operations`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2563eb; text-align: center;">CA Office ERP</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been registered as an active <strong>${roleName}</strong> in our ERP system by your Manager, <strong>${managerName}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0 0 8px 0;"><strong>Your Temporary Credentials:</strong></p>
          <p style="margin: 0 0 5px 0;"><strong>Username / Email:</strong> ${email}</p>
          <p style="margin: 0;"><strong>One-Time Password:</strong> ${password}</p>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="http://localhost:5173/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Login to Portal</a>
        </div>
        <p style="font-size: 0.85rem; color: #ef4444; font-weight: bold;">
          * Please change your password immediately after logging in for security.
        </p>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Sent on behalf of:<br><strong>${managerName}</strong> (<a href="mailto:${managerEmail}">${managerEmail}</a>)
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`One-time registration credentials email sent. Preview URL: ${previewUrl}`);
  }
  return true;
};

