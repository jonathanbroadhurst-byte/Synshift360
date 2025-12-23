# SyncShift360 Admin User Guide

Welcome to SyncShift360! This guide will help you manage 360-degree feedback surveys for your organization.

---

## Getting Started

### Logging In
1. Go to the SyncShift360 homepage
2. Click **"Admin Login"** (blue button)
3. Enter your email and password
4. Click **"Sign In"**

You'll be automatically directed to your dashboard based on your role:
- **Platform Owner** → Owner Dashboard
- **Admin / Org Admin** → Admin Dashboard

---

## Role Overview

| Role | Access Level |
|------|--------------|
| **Owner** | Full platform access, all organizations, billing, assign org admins |
| **Admin** | Full access to all surveys and reports |
| **Org Admin** | Manage surveys for their specific organization only |
| **Leader** | Create and view their own surveys |

---

## Creating a Survey

### Step 1: Navigate to Surveys
Click **"Surveys"** in the left sidebar to open the Survey Management page.

### Step 2: Start a New Survey
Click the blue **"Start New Survey"** button in the top right.

### Step 3: Fill in Survey Details
- **Survey Title**: Give your survey a descriptive name (e.g., "Q1 2024 Leadership Review - Marketing Team")
- **Organization**: Select the organization this survey is for
- **Survey Template**: Choose between:
  - **SyncShift Personal** (1-7 scale, 29 questions, 7 competencies)
  - **Quantum Leadership Calibration 360** (1-10 scale, 30 questions, 10 competencies)
- **End Date**: Set when the survey should close

### Step 4: Add Participants

**Option A: Upload a Spreadsheet (Recommended for large groups)**
1. Click **"Template"** to download the CSV template
2. Open in Excel or Google Sheets and fill in participant details:
   - **name**: Participant's full name
   - **jobTitle**: Their job title/position
   - **department**: Their department
   - **email**: Their email address
   - **relationship**: Their relationship to the leader (Self, Manager, Peer, Direct Report)
3. Save as CSV
4. Click **"Choose File"** and select your file
5. Review the imported participants

**Option B: Enter Emails Manually**
- Type email addresses separated by commas
- Example: `john@company.com, jane@company.com, alex@company.com`

### Step 5: Create the Survey
Click **"Create Survey"** to generate the survey and invitation links.

---

## Sharing Surveys with Participants

After creating a survey, you'll see:
- **Survey Code**: A short code participants can enter at `/survey-access`
- **Direct Link**: A URL participants can click to go directly to the survey

### How to Share
1. **Email the direct link** to participants (recommended)
2. Or share the **survey code** for participants to enter manually

Example message to participants:
> Hi [Name],
> 
> You've been invited to provide anonymous feedback. Please complete the survey by [date].
> 
> Click here to start: [Direct Link]
> 
> Or go to [your-domain]/survey-access and enter code: [Survey Code]

---

## Monitoring Survey Progress

### View Active Surveys
The **"Active Survey Cycles"** section shows all ongoing surveys with:
- Survey title and code
- Organization name
- Response count (completed / invited)
- End date

### Check Completion Status
The Dashboard homepage shows:
- **Total Responses** received
- **Active Surveys** count
- **Completion Rate** percentage
- Individual survey progress bars

---

## Managing Reports

### Viewing Reports
1. Go to **Dashboard** or **Reports** section
2. Find the survey cycle
3. Click to view the compiled report

### Report Contents
- Executive summary
- Competency scores (radar chart visualization)
- Strengths and development areas
- Anonymous feedback highlights
- Recommended action items

### Report Workflow
1. **Pending** - Report is being compiled
2. **Approved** - Admin has reviewed and approved
3. **Released** - Report is available to the leader

---

## Bulk Upload Template Fields

| Field | Required | Description | Examples |
|-------|----------|-------------|----------|
| name | Optional | Participant's full name | John Smith |
| jobTitle | Optional | Job title/position | Software Engineer, VP Sales |
| department | Optional | Department name | Engineering, Marketing, HR |
| email | **Yes** | Email address | john@company.com |
| relationship | Optional | Relationship to leader | Self, Manager, Peer, Direct Report |

**Note**: The only required field is email. Other fields help categorize responses in reports.

---

## For Platform Owners

### Accessing Owner Dashboard
Log in with owner credentials to access `/owner` dashboard.

### Managing Organizations
- View all organizations and their usage
- See active surveys per organization
- Monitor participant counts

### Assigning Org Admins
1. Find the organization
2. Click **"Manage Roles"**
3. Select users and change role to **"Org Admin"**

### Billing Overview
Track usage metrics for billing:
- Active surveys per organization
- Total participants
- Response counts

---

## Troubleshooting

### Survey Not Showing Responses
- Verify the survey is still **Active** (check end date)
- Confirm participants used the correct code/link
- Check the invite count matches expected participants

### Can't Create Survey
- Ensure you have Admin or Org Admin role
- Verify an organization is selected
- Check all required fields are filled

### Forgot Password
Contact your platform administrator to reset your password.

---

## Best Practices

1. **Set reasonable deadlines** - Give participants 1-2 weeks to complete surveys
2. **Send reminders** - Follow up with participants who haven't completed
3. **Keep surveys anonymous** - Reassure participants their responses are confidential
4. **Review reports promptly** - Release reports while feedback is fresh
5. **Use the bulk upload** - For groups of 5+ participants, spreadsheet upload saves time

---

## Support

For technical issues or questions, contact your SyncShift360 administrator.

---

*SyncShift360 - Shift your thinking, Change your world*
