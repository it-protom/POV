import nodemailer from 'nodemailer';

// Configurazione SMTP Aruba
const SMTP_CONFIG = {
  host: 'smtps.aruba.it',
  port: 465,
  secure: true, // true per porta 465, false per altre porte
  auth: {
    user: 'pulse.survey@protomgroup.com',
    pass: 'P.surv3y@2024'
  }
};

// Crea transporter riutilizzabile
const transporter = nodemailer.createTransport(SMTP_CONFIG);

// Verifica la connessione SMTP
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready to send emails');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection error:', error);
    return false;
  }
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

/**
 * Invia un'email tramite SMTP Aruba
 */
export async function sendEmail(options: SendEmailOptions) {
  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const mailOptions = {
      from: 'pulse.survey@protomgroup.com',
      to: recipients.join(', '),
      subject: options.subject,
      html: options.html || options.text,
      text: options.text || options.html?.replace(/<[^>]*>/g, ''),
      replyTo: options.replyTo || 'pulse.survey@protomgroup.com'
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: recipients,
      subject: options.subject
    });

    return {
      success: true,
      messageId: info.messageId,
      recipients
    };
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Invia email di invito per un form
 */
export async function sendFormInvite(
  recipients: string[],
  formTitle: string,
  formUrl: string,
  customMessage?: string
) {
  const subject = `Invito a compilare il form: ${formTitle}`;
  
  const defaultMessage = `Gentile utente,

Ti invitiamo a compilare il seguente form: ${formTitle}

Puoi accedere al form al seguente link:
${formUrl}

Grazie per il tuo contributo!

Cordiali saluti,
ProtomForms by Protom Group`;
  
  const message = customMessage || defaultMessage;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #FFCD00;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #FFCD00;
          color: #000;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          font-size: 12px;
          color: #666;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .form-title {
          font-size: 24px;
          font-weight: bold;
          color: #000;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="form-title">${formTitle}</div>
      </div>
      <div class="content">
        <p>Gentile utente,</p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <div style="text-align: center;">
          <a href="${formUrl}" class="button">Compila il Form</a>
        </div>
        <p>Oppure copia e incolla questo link nel tuo browser:</p>
        <p style="word-break: break-all; color: #0066cc;">${formUrl}</p>
      </div>
      <div class="footer">
        <p><strong>Protom Group S.p.A. a socio unico</strong></p>
        <p>Via Vittoria Colonna, 14 - 80121 Napoli</p>
        <p>T. +39 081 7873200 | F. +39 081 7873229</p>
        <p>info@protom.com | www.protom.com</p>
        <p>P.IVA/C.F. 06477661216 | REA NA-817681 | C.S. €2.100.000, i.v.</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: recipients,
    subject,
    html,
    text: message
  });
}

