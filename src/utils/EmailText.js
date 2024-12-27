const verifyOtpText = (otp) => {
    return `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); background-color: #f9fdf9;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://static.vecteezy.com/system/resources/previews/028/671/106/non_2x/recycling-icon-leaf-symbol-design-and-circular-arrow-environmental-concept-in-isolation-on-white-background-free-vector.jpg" alt="Recycling Logo" style="width: 80px;"/>
            </div>
            <h2 style="color: #4CAF50; text-align: center;">Verify Your Email</h2>
            <p style="font-size: 16px;">Hi there,</p>
            <p style="font-size: 16px;">Thank you for joining <strong>Scrap Dai</strong>, your partner in creating a greener planet! To complete your email verification and start recycling with us, please use the OTP below:</p>
            <div style="text-align: center; margin: 20px 0;">
                <span style="display: inline-block; background-color: #e6ffe6; padding: 15px 30px; border: 2px dashed #4CAF50; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #4CAF50;">${otp}</span>
            </div>
            <p style="text-align: center; color: #666; font-size: 14px;">This OTP is valid for 5 minutes. Keep it secure and do not share it with anyone.</p>
            <p style="font-size: 16px;">If you didn’t request this, please ignore this email or contact our support team.</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 14px; color: #888;">
                <p>Thank you for taking the first step towards a cleaner, greener world!</p>
                <p><strong>Scrap Dai Team</strong></p>
            </div>
        </div>
    `

}

const WelcomeText = () => {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9fdf9;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://static.vecteezy.com/system/resources/previews/028/671/106/non_2x/recycling-icon-leaf-symbol-design-and-circular-arrow-environmental-concept-in-isolation-on-white-background-free-vector.jpg" alt="Recycling Logo" style="width: 80px;"/>
            </div>
            <h2 style="color: #4CAF50; text-align: center;">Email Verified!</h2>
            <p style="font-size: 16px; text-align: center;">Your email has been successfully verified. Welcome to <strong>Scrap Dai</strong>!</p>
            <p style="font-size: 14px; text-align: center; color: #666;">Thank you for joining our mission to recycle and create a greener future.</p>
        </div>
        `
}

const verifyOtpTextWithIP = (otp, userLocationData) => {
    const { ip, city, region, country, loc, org, timezone } = userLocationData;

    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); background-color: #f9fdf9;">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://static.vecteezy.com/system/resources/previews/028/671/106/non_2x/recycling-icon-leaf-symbol-design-and-circular-arrow-environmental-concept-in-isolation-on-white-background-free-vector.jpg" alt="Recycling Logo" style="width: 80px;"/>
        </div>
        <h2 style="color: #4CAF50; text-align: center;">Verify Your Email</h2>
        <p style="font-size: 16px;">Hi there,</p>
        <p style="font-size: 16px;">Thank you for joining <strong>Scrap Dai</strong>, your partner in creating a greener planet! To complete your email verification and start recycling with us, please use the OTP below:</p>
        <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background-color: #e6ffe6; padding: 15px 30px; border: 2px dashed #4CAF50; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #4CAF50;">${otp}</span>
        </div>
        <p style="text-align: center; color: #666; font-size: 14px;">This OTP is valid for 5 minutes. Keep it secure and do not share it with anyone.</p>
        
        <h3 style="color: #333; text-align: center; margin-top: 20px;">Your Registration Details</h3>
        <p style="font-size: 14px; color: #555;">
            <strong>IP Address:</strong> ${ip || "Unknown IP"} <br />
            <strong>Location:</strong> ${city  || "Unknown location"}, ${region}, ${country} <br />
            <strong>Coordinates:</strong> ${loc || "Unknown"} <br />
            <strong>Organization:</strong> ${org || "Unknown"} <br />
            <strong>Timezone:</strong> ${timezone || "Unkonwn"}
        </p>

        <p style="font-size: 16px;">If you didn’t request this, please ignore this email or contact our support team.</p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 14px; color: #888;">
            <p>Thank you for taking the first step towards a cleaner, greener world!</p>
            <p><strong>Scrap Dai Team</strong></p>
        </div>
    </div>
    `;
}


export {
    verifyOtpText,
    WelcomeText,
    verifyOtpTextWithIP
}