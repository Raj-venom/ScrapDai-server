import crypto from "crypto";
import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

const generateOtp = () => {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000);
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
        console.error("Failed to send email:", error.message);
        throw new ApiError(500, error.message)

    }

}

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
}


const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;
    return emailRegex.test(email);
};


export {
    generateOtp,
    sendEmail,
    cookieOptions,
    validateEmail
}