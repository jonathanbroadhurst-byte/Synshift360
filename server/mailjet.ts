import Mailjet from 'node-mailjet';

function getMailjetClient() {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const fromEmail = process.env.MAILJET_FROM_EMAIL || 'noreply@syncshift360.com';
  const fromName = process.env.MAILJET_FROM_NAME || 'SyncShift360';

  if (!apiKey || !secretKey) {
    throw new Error('Mailjet credentials not configured');
  }

  const client = new Mailjet({ apiKey, apiSecret: secretKey });
  return { client, fromEmail, fromName };
}

export async function sendSurveyConfirmationEmail(
  toEmail: string,
  firstName: string,
  surveyTitle: string,
  leaderName: string,
  surveyCode: string,
  baseUrl: string
): Promise<boolean> {
  try {
    const { client, fromEmail, fromName } = getMailjetClient();
    const surveyLink = `${baseUrl}/survey/${surveyCode}`;

    await client.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: toEmail, Name: firstName }],
          Subject: `Your SyncShift Personal Survey is Ready - ${surveyTitle}`,
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">SyncShift Personal</h1>
                <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">360-Degree Feedback Platform</p>
              </div>
              <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
                <h2 style="color: #1e293b; margin-top: 0;">Hello ${firstName}!</h2>
                <p style="color: #475569; line-height: 1.6;">
                  Your SyncShift Personal survey "<strong>${surveyTitle}</strong>" for <strong>${leaderName}</strong> has been created successfully.
                </p>
                <div style="background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                  <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your Survey Code</p>
                  <p style="color: #1e293b; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 0;">${surveyCode}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${surveyLink}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Share Survey Link
                  </a>
                </div>
                <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                  <p style="color: #1e40af; margin: 0; font-weight: bold;">How to Share:</p>
                  <p style="color: #3730a3; margin: 10px 0 0 0; font-size: 14px;">
                    Share this link with your participants: <br>
                    <a href="${surveyLink}" style="color: #2563eb;">${surveyLink}</a>
                  </p>
                </div>
                <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
                  All responses are completely anonymous. Participants will provide feedback across 7 key competency areas.
                </p>
              </div>
              <div style="background: #1e293b; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
                <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                  SyncShift360 - Professional 360-Degree Feedback Platform
                </p>
              </div>
            </div>
          `
        }
      ]
    });

    console.log(`Confirmation email sent via Mailjet to: ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send email via Mailjet:', error);
    return false;
  }
}

export async function sendQuantumSurveyConfirmationEmail(
  toEmail: string,
  firstName: string,
  surveyTitle: string,
  leaderName: string,
  surveyCode: string,
  baseUrl: string
): Promise<boolean> {
  try {
    const { client, fromEmail, fromName } = getMailjetClient();
    const surveyLink = `${baseUrl}/survey/${surveyCode}`;

    await client.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: toEmail, Name: firstName }],
          Subject: `Your Quantum Leadership Assessment is Ready - ${surveyTitle}`,
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f97316, #db2777, #1f2937); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Quantum Leadership Calibration</h1>
                <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">360-Degree Assessment</p>
              </div>
              <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
                <h2 style="color: #1e293b; margin-top: 0;">Hello ${firstName}!</h2>
                <p style="color: #475569; line-height: 1.6;">
                  Your Quantum Leadership Assessment "<strong>${surveyTitle}</strong>" for <strong>${leaderName}</strong> has been created successfully.
                </p>
                <div style="background: white; border: 2px solid #f97316; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                  <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your Assessment Code</p>
                  <p style="color: #1e293b; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 0;">${surveyCode}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${surveyLink}" style="background: linear-gradient(135deg, #f97316, #db2777); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Share Assessment Link
                  </a>
                </div>
                <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
                  <p style="color: #c2410c; margin: 0; font-weight: bold;">Assessment Details:</p>
                  <ul style="color: #9a3412; margin: 10px 0 0 0; font-size: 14px; padding-left: 20px;">
                    <li>30 behavioral questions across 10 competencies</li>
                    <li>1-10 rating scale for precise calibration</li>
                    <li>Maturity level classification (Reactive to Quantum)</li>
                    <li>9-Box performance grid analysis</li>
                  </ul>
                </div>
                <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
                  Share this link with participants: <br>
                  <a href="${surveyLink}" style="color: #f97316;">${surveyLink}</a>
                </p>
              </div>
              <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                  Quantum Leadership Calibration 360 - Advanced Leadership Assessment
                </p>
              </div>
            </div>
          `
        }
      ]
    });

    console.log(`Quantum confirmation email sent via Mailjet to: ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send Quantum email via Mailjet:', error);
    return false;
  }
}
