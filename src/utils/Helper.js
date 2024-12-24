import crypto from "crypto";
import nodemailer from "nodemailer";

const generateOtp = () => {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    return { otp, otpExpiry };
};

const sendEmail = async (email, { subject, text, body }) => {

    try {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SERVER_EMAIL,
                pass: process.env.SERVER_EMAIL_PASSKEY

            }
        });


        const mailOptions = {
            from: 'demo.email.test07@gmail.com',
            to: email,

            subject: subject,
            text: text,
            html: body
        };



        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                throw new ApiError(500, "Something went wrong while sending email")
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        });
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something went wrong while sending email")

    }

}

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
}


export {
    generateOtp,
    sendEmail,
    cookieOptions
}