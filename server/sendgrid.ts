// SendGrid email integration
import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email};
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableSendGridClient() {
  const {apiKey, email} = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

// Helper function to send survey confirmation email
export async function sendSurveyConfirmationEmail(
  toEmail: string,
  toName: string,
  surveyTitle: string,
  leaderName: string,
  inviteCode: string,
  baseUrl: string
) {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const emailContent = `
      <h2>Your SyncShift Personal Survey is Ready!</h2>
      <p>Hi ${toName},</p>
      <p>Your 360-degree feedback survey has been successfully created. Here are the details:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Survey Details:</h3>
        <ul>
          <li><strong>Survey Title:</strong> ${surveyTitle}</li>
          <li><strong>Leader:</strong> ${leaderName}</li>
          <li><strong>Survey Code:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${inviteCode}</code></li>
        </ul>
      </div>

      <h3>How to Share Your Survey:</h3>
      <p>1. Share the survey code: <strong>${inviteCode}</strong></p>
      <p>2. Direct participants to: <a href="${baseUrl}/survey-access">${baseUrl}/survey-access</a></p>
      <p>3. Or share this direct link: <a href="${baseUrl}/survey/${inviteCode}">${baseUrl}/survey/${inviteCode}</a></p>

      <h3>What's Next:</h3>
      <ul>
        <li>Share the survey with your team members</li>
        <li>Participants complete the anonymous 29-question assessment</li>
        <li>We'll compile responses into a comprehensive leadership report</li>
        <li>You'll receive your personalized feedback within 24-48 hours after survey completion</li>
      </ul>

      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Best regards,<br>The SyncShift Team</p>
    `;

    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `Your SyncShift Personal Survey is Ready! Code: ${inviteCode}`,
      html: emailContent,
    };

    await client.send(msg);
    console.log('Confirmation email sent via SendGrid to:', toEmail);
    return true;
  } catch (error) {
    console.error('Failed to send email via SendGrid:', error);
    return false;
  }
}

// Helper function to send Quantum survey confirmation email
export async function sendQuantumSurveyConfirmationEmail(
  toEmail: string,
  toName: string,
  surveyTitle: string,
  leaderName: string,
  inviteCode: string,
  baseUrl: string
) {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const emailContent = `
      <h2 style="color: #f97316;">Your Quantum Leadership Calibration 360 is Ready!</h2>
      <p>Hi ${toName},</p>
      <p>Your Quantum Leadership assessment has been successfully created. Here are the details:</p>
      
      <div style="background: linear-gradient(135deg, #fff7ed 0%, #fdf2f8 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fed7aa;">
        <h3>Assessment Details:</h3>
        <ul>
          <li><strong>Assessment Title:</strong> ${surveyTitle}</li>
          <li><strong>Leader:</strong> ${leaderName}</li>
          <li><strong>Assessment Code:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${inviteCode}</code></li>
        </ul>
      </div>

      <h3>How to Share Your Assessment:</h3>
      <p>1. Share the assessment code: <strong>${inviteCode}</strong></p>
      <p>2. Direct participants to: <a href="${baseUrl}/survey-access">${baseUrl}/survey-access</a></p>
      <p>3. Or share this direct link: <a href="${baseUrl}/survey/${inviteCode}">${baseUrl}/survey/${inviteCode}</a></p>

      <h3>What's Included:</h3>
      <ul>
        <li>30 behavioral questions across 10 core leadership competencies</li>
        <li>1-10 rating scale for precise calibration</li>
        <li>Maturity level classification (Reactive → Quantum)</li>
        <li>9-Box performance grid positioning</li>
        <li>Comprehensive development report</li>
      </ul>

      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Best regards,<br>The SyncShift Team</p>
    `;

    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `Your Quantum Leadership Assessment is Ready! Code: ${inviteCode}`,
      html: emailContent,
    };

    await client.send(msg);
    console.log('Quantum confirmation email sent via SendGrid to:', toEmail);
    return true;
  } catch (error) {
    console.error('Failed to send Quantum email via SendGrid:', error);
    return false;
  }
}
