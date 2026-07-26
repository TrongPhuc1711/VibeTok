import nodemailer from 'nodemailer';

/**
 * Gửi email chứa mã OTP đặt lại mật khẩu.
 * Ưu tiên 1: Nodemailer (SMTP / Gmail App Password từ MAIL_USER & MAIL_PASS)
 * Ưu tiên 2: Brevo API (từ BREVO_API_KEY & BREVO_SENDER_EMAIL)
 */
export const sendOTPEmail = async (toEmail, otp) => {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #ff2d78; text-align: center;">Đặt Lại Mật Khẩu - VibeTok</h2>
            <p>Xin chào,</p>
            <p>Mã OTP đặt lại mật khẩu của bạn là:</p>
            <div style="text-align: center; margin: 20px 0;">
                <span style="color: #ff2d78; letter-spacing: 8px; font-size: 36px; font-weight: bold; background: #fff0f5; padding: 10px 20px; border-radius: 8px; display: inline-block;">${otp}</span>
            </div>
            <p>Mã có hiệu lực trong <strong>10 phút</strong>.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
        </div>
    `;

    // 1. Nodemailer (Gmail / SMTP)
    if (mailUser && mailPass) {
        const cleanPass = mailPass.replace(/\s+/g, '');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: mailUser,
                pass: cleanPass
            }
        });

        await transporter.sendMail({
            from: `"VibeTok Support" <${mailUser}>`,
            to: toEmail,
            subject: 'Mã OTP Đặt Lại Mật Khẩu - VibeTok',
            html: htmlContent
        });
        return;
    }

    // 2. Brevo API fallback
    if (brevoApiKey && brevoSenderEmail) {
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': brevoApiKey
            },
            body: JSON.stringify({
                sender: {
                    name: 'VibeTok Support',
                    email: brevoSenderEmail
                },
                to: [{ email: toEmail }],
                subject: 'Mã OTP Đặt Lại Mật Khẩu - VibeTok',
                htmlContent
            })
        });

        if (!brevoResponse.ok) {
            const errorData = await brevoResponse.json();
            console.error('❌ Brevo error:', errorData);
            throw new Error('Gửi email thất bại từ phía Brevo');
        }
        return;
    }

    throw new Error('Chưa cấu hình biến môi trường gửi email (MAIL_USER/MAIL_PASS hoặc BREVO_API_KEY)');
};
