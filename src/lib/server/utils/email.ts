import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '$env/dynamic/private';

export interface EmailOptions {
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
	
	from?: string;
	
	fromName?: string;
	
	fromEmail?: string;
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string;
	attachments?: Array<{
		filename: string;
		content?: string | Buffer;
		path?: string;
		contentType?: string;
	}>;
}

/**
 * Create and configure nodemailer transporter
 */
function createTransporter(): Transporter {
	const requireEnv = (name: string, value: string | undefined) => {
		if (!value || value.length === 0) {
			throw new Error(`${name} is not set`);
		}
		return value;
	};

	
	const host = requireEnv('SMTP_HOST', env.SMTP_HOST);
	const user = requireEnv('SMTP_USER', env.SMTP_USER);
	const pass = requireEnv('SMTP_PASSWORD', env.SMTP_PASSWORD);
	const portStr = env.SMTP_PORT ?? '587';
	const port = Number.parseInt(portStr);
	if (Number.isNaN(port) || port <= 0) {
		throw new Error(`SMTP_PORT is invalid: ${portStr}`);
	}
	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: {
			user,
			pass
		},
		pool: true,
		maxConnections: 5,
		maxMessages: 100,
		rateDelta: 1000,
		rateLimit: 10
	});
}

/**
 * Send an email using nodemailer
 * @param options Email options including to, subject, text/html content, etc.
 * @returns Promise with send result
 */
export async function sendEmail(options: EmailOptions): Promise<{
	success: boolean;
	messageId?: string;
	error?: string;
}> {
	try {
		const transporter = createTransporter();


		await transporter.verify();


		const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
		const cc = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined;
		const bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined;


		const fromHeader = options.from ?? (() => {
			const displayName = options.fromName ?? env.SMTP_FROM_NAME ?? 'Tukoo';
			const fromAddress = options.fromEmail ?? env.SMTP_FROM_EMAIL ?? env.SMTP_USER;
			return `"${displayName}" <${fromAddress}>`;
		})();

		const info = await transporter.sendMail({
			from: fromHeader,
			to,
			cc,
			bcc,
			subject: options.subject,
			text: options.text,
			html: options.html,
			replyTo: options.replyTo,
			attachments: options.attachments
		});
		console.log('Email sent successfully:', info.messageId);
		return {
			success: true,
			messageId: info.messageId
		};
	} catch (error) {
		console.error('Error sending email:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to send email'
		};
	}
}


/**
 * Send OTP verification email for registration
 */
export async function sendOtpReset(
	to: string,
	userName: string,
	otpCode: string,
	expiryMinutes: number = 10
): Promise<{ success: boolean; error?: string }> {
	const subject = 'Password Reset Requested - OTP Code';

	const html = `
		<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            background: linear-gradient(to right, #2563eb, #4f46e5);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
        }

        .header {
            padding: 30px 20px 0px 30px;
            text-align: left;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }

        .content {
            padding: 40px 30px;
        }

        .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .otp-code {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .footer {
            background-color: #f9fafb;
            padding: 20px 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }


        a {
            color: #3b82f6;
            text-decoration: none;
        }

        .highlight {
            color: #3b82f6;
            font-weight: 600;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">

            <svg width="120" height="auto" viewBox="0 0 563 143" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M204 0C187.167 14.5 153.5 43.6 153.5 44L152.5 45H177V106C177 109.2 176.667 113.333 176.5 115C173.5 126.5 170 129.6 168 132C166 134.4 158.5 140.167 155 142.5C157.333 142.5 163 141.8 167 141C172 140 173 139.5 177.5 137C182 134.5 185 133.5 192 126.5C197.6 120.9 200.5 116.5 203 102L204 0Z"
                    fill="url(#paint0_linear_340_27)" />
                <path
                    d="M190.5 41C192.5 28 199.167 11.167 204 0L203.5 98C202 110 202.5 108.5 198.5 118.5C188.5 137.3 164.667 142.5 154.5 142.5C161.5 139 176.7 127.1 181.5 107.5C187.622 82.5 188.5 54 190.5 41Z"
                    fill="url(#paint1_linear_340_27)" />
                <path
                    d="M131 32H103.5C104.5 32 103 93.5 104.753 104C106.505 114.5 108.753 117 111.753 122.5C114.753 128 120.5 132.25 122 133C123.5 133.75 134.5 140 144.5 137.5C154.5 135 156.5 133 162 124C167.5 115 166 116.5 166 116.5C140.8 123.7 133.167 108.833 132 100.5L131 32Z"
                    fill="url(#paint2_linear_340_27)" />
                <path d="M95 32H0V53.5H34.5V139H61V53.5H95V32Z" fill="url(#paint3_linear_340_27)" />
                <path d="M246 32H220V139.5H247V111L259.5 98L292 139.5H325L278 79.5L321 32H292L246.5 79.5L246 32Z"
                    fill="url(#paint4_linear_340_27)" />
                <path
                    d="M376.118 27.002C409.92 26.759 435.231 50.197 435.981 82.431C436.865 120.793 407.295 146.79 367.399 142.547C322.844 137.792 303.117 91.765 322.348 55.949C332.352 37.239 351.382 27.177 376.118 27.002ZM343.441 83.091C343.334 93.867 345.958 102.259 352.253 109.061C360.77 118.247 371.631 120.699 383.443 117.884C394.666 115.19 402.192 107.997 405.661 96.776C411.701 76.975 402.634 56.824 385.465 51.719C363.074 45.065 343.36 60.461 343.441 83.091Z"
                    fill="url(#paint5_linear_340_27)" />
                <path
                    d="M503.118 27.002C536.92 26.759 562.231 50.197 562.981 82.431C563.865 120.793 534.295 146.79 494.399 142.547C449.844 137.792 430.117 91.765 449.348 55.949C459.352 37.239 478.382 27.177 503.118 27.002ZM470.441 83.091C470.334 93.867 472.958 102.259 479.253 109.061C487.77 118.247 498.631 120.699 510.443 117.884C521.666 115.19 529.192 107.997 532.661 96.776C538.701 76.975 529.634 56.824 512.465 51.719C490.074 45.065 470.36 60.461 470.441 83.091Z"
                    fill="url(#paint6_linear_340_27)" />
                <defs>
                    <linearGradient id="paint0_linear_340_27" x1="178.25" y1="0" x2="178.25" y2="142"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.333757" stop-color="#42C6FF" />
                        <stop offset="0.569425" stop-color="#00A9F2" />
                    </linearGradient>
                    <linearGradient id="paint1_linear_340_27" x1="179" y1="1.5" x2="179" y2="142.5"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint2_linear_340_27" x1="134.744" y1="32" x2="134.744" y2="139.112"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint3_linear_340_27" x1="47.5" y1="32" x2="47.5" y2="139"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint4_linear_340_27" x1="272.5" y1="32" x2="272.5" y2="139.5"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint5_linear_340_27" x1="375.5" y1="27" x2="375.5" y2="143"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint6_linear_340_27" x1="502.5" y1="27" x2="502.5" y2="143"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                </defs>
            </svg>

        </div>
        <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>We received a request to reset your password. To proceed, please verify your email address using the One-Time Password (OTP) below:</p>
            <div class="otp-box">
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Your Verification Code</p>
                <div class="otp-code">${otpCode}</div>
                <p style="margin: 0; font-size: 12px; opacity: 0.8;">Enter this code to verify your email</p>
            </div>

           
            <p style="margin: 4px 0; color: #374151;">This code will expire in <span class="highlight">${expiryMinutes} minutes</span>. This is a one-time use code. <b>Do not share this code with anyone</b></p>


            <p style="margin: 18px 0 6px 0; color: #111827;"><strong>Security Notice</strong></p>
            <p>If you didn't request this verification code, please ignore this email. Your account will remain
                secure. And if you have any questions or need assistance, please contact our support team.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>Tukoo Team</strong></p>
        </div>
        <div class="footer">
            <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
            <p style="margin-top: 2px;">© ${new Date().getFullYear()} Tukoo. All rights reserved.</p>
        </div>
    </div>
</body>

</html>
	`;

	const text = `Reset Password Requested

Hi ${userName},

We received a request to reset your password. To proceed, please verify your email address using the One-Time Password (OTP) below:

VERIFICATION CODE: ${otpCode}

This code will expire in ${expiryMinutes} minutes. If you didn't request this code, please ignore this email.

---
This is an automated message, please do not reply.
© ${new Date().getFullYear()} Tukoo. All rights reserved.`;

	return await sendEmail({ fromEmail: "reset@tukoo.web.id", fromName: "Tukoo Reset Verification", to, subject, html, text });
}

/**
 * Send OTP verification email for registration
 */
export async function sendOtpEmail(
	to: string,
	userName: string,
	otpCode: string,
	expiryMinutes: number = 10
): Promise<{ success: boolean; error?: string }> {
	const subject = 'Verify Your Email - OTP Code';

	const html = `
		<!DOCTYPE html>
<html>

<head>
     <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            background: linear-gradient(to right, #2563eb, #4f46e5);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
        }

        .header {
            padding: 30px 20px 0px 30px;
            text-align: left;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }

        .content {
            padding: 40px 30px;
        }

        .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .otp-code {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .footer {
            background-color: #f9fafb;
            padding: 20px 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }


        a {
            color: #3b82f6;
            text-decoration: none;
        }

        .highlight {
            color: #3b82f6;
            font-weight: 600;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">

            <svg width="120" height="auto" viewBox="0 0 563 143" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M204 0C187.167 14.5 153.5 43.6 153.5 44L152.5 45H177V106C177 109.2 176.667 113.333 176.5 115C173.5 126.5 170 129.6 168 132C166 134.4 158.5 140.167 155 142.5C157.333 142.5 163 141.8 167 141C172 140 173 139.5 177.5 137C182 134.5 185 133.5 192 126.5C197.6 120.9 200.5 116.5 203 102L204 0Z"
                    fill="url(#paint0_linear_340_27)" />
                <path
                    d="M190.5 41C192.5 28 199.167 11.167 204 0L203.5 98C202 110 202.5 108.5 198.5 118.5C188.5 137.3 164.667 142.5 154.5 142.5C161.5 139 176.7 127.1 181.5 107.5C187.622 82.5 188.5 54 190.5 41Z"
                    fill="url(#paint1_linear_340_27)" />
                <path
                    d="M131 32H103.5C104.5 32 103 93.5 104.753 104C106.505 114.5 108.753 117 111.753 122.5C114.753 128 120.5 132.25 122 133C123.5 133.75 134.5 140 144.5 137.5C154.5 135 156.5 133 162 124C167.5 115 166 116.5 166 116.5C140.8 123.7 133.167 108.833 132 100.5L131 32Z"
                    fill="url(#paint2_linear_340_27)" />
                <path d="M95 32H0V53.5H34.5V139H61V53.5H95V32Z" fill="url(#paint3_linear_340_27)" />
                <path d="M246 32H220V139.5H247V111L259.5 98L292 139.5H325L278 79.5L321 32H292L246.5 79.5L246 32Z"
                    fill="url(#paint4_linear_340_27)" />
                <path
                    d="M376.118 27.002C409.92 26.759 435.231 50.197 435.981 82.431C436.865 120.793 407.295 146.79 367.399 142.547C322.844 137.792 303.117 91.765 322.348 55.949C332.352 37.239 351.382 27.177 376.118 27.002ZM343.441 83.091C343.334 93.867 345.958 102.259 352.253 109.061C360.77 118.247 371.631 120.699 383.443 117.884C394.666 115.19 402.192 107.997 405.661 96.776C411.701 76.975 402.634 56.824 385.465 51.719C363.074 45.065 343.36 60.461 343.441 83.091Z"
                    fill="url(#paint5_linear_340_27)" />
                <path
                    d="M503.118 27.002C536.92 26.759 562.231 50.197 562.981 82.431C563.865 120.793 534.295 146.79 494.399 142.547C449.844 137.792 430.117 91.765 449.348 55.949C459.352 37.239 478.382 27.177 503.118 27.002ZM470.441 83.091C470.334 93.867 472.958 102.259 479.253 109.061C487.77 118.247 498.631 120.699 510.443 117.884C521.666 115.19 529.192 107.997 532.661 96.776C538.701 76.975 529.634 56.824 512.465 51.719C490.074 45.065 470.36 60.461 470.441 83.091Z"
                    fill="url(#paint6_linear_340_27)" />
                <defs>
                    <linearGradient id="paint0_linear_340_27" x1="178.25" y1="0" x2="178.25" y2="142"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.333757" stop-color="#42C6FF" />
                        <stop offset="0.569425" stop-color="#00A9F2" />
                    </linearGradient>
                    <linearGradient id="paint1_linear_340_27" x1="179" y1="1.5" x2="179" y2="142.5"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint2_linear_340_27" x1="134.744" y1="32" x2="134.744" y2="139.112"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint3_linear_340_27" x1="47.5" y1="32" x2="47.5" y2="139"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint4_linear_340_27" x1="272.5" y1="32" x2="272.5" y2="139.5"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint5_linear_340_27" x1="375.5" y1="27" x2="375.5" y2="143"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                    <linearGradient id="paint6_linear_340_27" x1="502.5" y1="27" x2="502.5" y2="143"
                        gradientUnits="userSpaceOnUse">
                        <stop offset="0.3" stop-color="#3AA6FF" />
                        <stop offset="0.75" stop-color="#5053FF" />
                    </linearGradient>
                </defs>
            </svg>

        </div>
        <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Thank you for registering! To complete your registration, please verify your email address using the
                One-Time Password (OTP) below:</p>

            <div class="otp-box">
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Your Verification Code</p>
                <div class="otp-code">${otpCode}</div>
                <p style="margin: 0; font-size: 12px; opacity: 0.8;">Enter this code to verify your email</p>
            </div>

           
            <p style="margin: 4px 0; color: #374151;">This code will expire in <span class="highlight">${expiryMinutes} minutes</span>. This is a one-time use code. <b>Do not share this code with anyone</b></p>


            <p style="margin: 18px 0 6px 0; color: #111827;"><strong>Security Notice</strong></p>
            <p>If you didn't request this verification code, please ignore this email. Your account will remain
                secure. And if you have any questions or need assistance, please contact our support team.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>Tukoo Team</strong></p>
        </div>
        <div class="footer">
            <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
            <p style="margin-top: 2px;">© ${new Date().getFullYear()} Tukoo. All rights reserved.</p>
        </div>
    </div>
</body>

</html>
	`;

	const text = `Verify Your Email

Hi ${userName},

Thank you for registering. Please use the verification code below to complete your registration:

VERIFICATION CODE: ${otpCode}

This code will expire in ${expiryMinutes} minutes. If you didn't request this code, please ignore this email.

---
This is an automated message, please do not reply.
© ${new Date().getFullYear()} Tukoo. All rights reserved.`;

	return await sendEmail({ fromEmail: "auth@tukoo.web.id", fromName: "Tukoo Auth Verification", to, subject, html, text });
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(
	to: string,
	userName: string,
	merchantName: string
): Promise<{ success: boolean; error?: string }> {
	const subject = `Welcome to ${merchantName} - Your Account is Ready!`;

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
				.content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
				.button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
				.footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Welcome to ${merchantName}!</h1>
				</div>
				<div class="content">
					<p>Hi ${userName},</p>
					<p>Your account has been successfully created! You can now access the POS system and start managing your tasks.</p>
					<p>If you have any questions or need assistance, please don't hesitate to contact your administrator.</p>
					<p>Best regards,<br>${merchantName} Team</p>
				</div>
				<div class="footer">
					<p>This is an automated email. Please do not reply to this message.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	const text = `Welcome to ${merchantName}!

Hi ${userName},

Your account has been successfully created! You can now access the POS system and start managing your tasks.

If you have any questions or need assistance, please don't hesitate to contact your administrator.

Best regards,
${merchantName} Team

---
This is an automated email. Please do not reply to this message.`;

	return await sendEmail({ to, subject, html, text });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
	to: string,
	userName: string,
	newPassword: string,
	merchantName: string
): Promise<{ success: boolean; error?: string }> {
	const subject = 'Your Password Has Been Reset';

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
				.content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
				.password-box { background-color: #fff; border: 2px solid #3b82f6; padding: 15px; border-radius: 5px; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 2px; }
				.warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
				.footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Password Reset</h1>
				</div>
				<div class="content">
					<p>Hi ${userName},</p>
					<p>Your password has been reset by an administrator. Your new temporary password is:</p>
					<div class="password-box">${newPassword}</div>
					<div class="warning">
						<strong>⚠️ Important Security Notice:</strong>
						<p>Please change this password immediately after logging in for security purposes.</p>
					</div>
					<p>If you did not request this password reset, please contact your administrator immediately.</p>
					<p>Best regards,<br>${merchantName} Team</p>
				</div>
				<div class="footer">
					<p>This is an automated email. Please do not reply to this message.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	const text = `Password Reset

Hi ${userName},

Your password has been reset by an administrator. Your new temporary password is:

${newPassword}

⚠️ IMPORTANT: Please change this password immediately after logging in for security purposes.

If you did not request this password reset, please contact your administrator immediately.

Best regards,
${merchantName} Team

---
This is an automated email. Please do not reply to this message.`;

	return await sendEmail({ to, subject, html, text });
}

/**
 * Send order notification email
 */
export async function sendOrderNotificationEmail(
	to: string,
	orderDetails: {
		orderNumber: string;
		tableName: string;
		items: Array<{ name: string; quantity: number; price: number }>;
		total: number;
	},
	merchantName: string
): Promise<{ success: boolean; error?: string }> {
	const subject = `New Order #${orderDetails.orderNumber} - ${merchantName}`;

	const itemsHtml = orderDetails.items.map(item => `
		<tr>
			<td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
			<td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
			<td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">Rp ${item.price.toLocaleString('id-ID')}</td>
		</tr>
	`).join('');

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
				.content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
				.order-info { background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; }
				table { width: 100%; border-collapse: collapse; margin: 20px 0; }
				.total { background-color: #3b82f6; color: white; padding: 15px; text-align: right; font-size: 18px; font-weight: bold; }
				.footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>New Order Received!</h1>
				</div>
				<div class="content">
					<div class="order-info">
						<p><strong>Order Number:</strong> #${orderDetails.orderNumber}</p>
						<p><strong>Table:</strong> ${orderDetails.tableName}</p>
					</div>
					<h3>Order Items:</h3>
					<table>
						<thead>
							<tr style="background-color: #f3f4f6;">
								<th style="padding: 10px; text-align: left;">Item</th>
								<th style="padding: 10px; text-align: center;">Qty</th>
								<th style="padding: 10px; text-align: right;">Price</th>
							</tr>
						</thead>
						<tbody>
							${itemsHtml}
						</tbody>
					</table>
					<div class="total">
						Total: Rp ${orderDetails.total.toLocaleString('id-ID')}
					</div>
				</div>
				<div class="footer">
					<p>This is an automated email. Please do not reply to this message.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	const itemsText = orderDetails.items.map(item =>
		`${item.name} x${item.quantity} - Rp ${item.price.toLocaleString('id-ID')}`
	).join('\n');

	const text = `New Order Received!

Order Number: #${orderDetails.orderNumber}
Table: ${orderDetails.tableName}

Order Items:
${itemsText}

Total: Rp ${orderDetails.total.toLocaleString('id-ID')}

---
This is an automated email. Please do not reply to this message.`;

	return await sendEmail({ to, subject, html, text });
}
