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
  const { ip, city, region, country, loc, org } = userLocationData;

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
            <strong>Location:</strong> ${city || "Unknown location"}, ${region}, ${country} <br />
            <strong>Coordinates:</strong> ${loc || "Unknown"} <br />
            <strong>Organization:</strong> ${org || "Unknown"} <br />
        </p>

        <p style="font-size: 16px;">If you didn't request this, please ignore this email or contact our support team.</p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 14px; color: #888;">
            <p>Thank you for taking the first step towards a cleaner, greener world!</p>
            <p><strong>Scrap Dai Team</strong></p>
        </div>
    </div>
    `;
}

const forgotPasswordEmail = (resetLink, otp, userLocationData) => {
  const { city, region, country, ip, timezone } = userLocationData;

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; background-color: #f9fdf9; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://static.vecteezy.com/system/resources/previews/028/671/106/non_2x/recycling-icon-leaf-symbol-design-and-circular-arrow-environmental-concept-in-isolation-on-white-background-free-vector.jpg" alt="Scrap Dai Logo" style="width: 60px;"/>
    </div>
    <h2 style="text-align: center; color: #4CAF50; margin-bottom: 20px;">Reset Your Password</h2>
    <p style="font-size: 16px; color: #333; text-align: center;">
      Hello, we received a request to reset your password for your <strong>Scrap Dai</strong> account. Use the OTP below or click the reset link to set a new password.
    </p>
  
    <!-- OTP Section -->
    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; background-color: #e6ffe6; padding: 15px 30px; border: 1px solid #4CAF50; border-radius: 8px; font-size: 22px; font-weight: bold; letter-spacing: 2px; color: #4CAF50;">${otp}</span>
    </div>
    <p style="text-align: center; font-size: 14px; color: #666;">This OTP is valid for 5 minutes. Keep it secure.</p>
  
    <!-- Reset Link Section -->
    <div style="text-align: center; margin-top: 20px;">
      <a href="${resetLink}" style="display: inline-block; background-color: #4CAF50; color: #fff; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
  
    <!-- Location Information -->
    <div style="margin-top: 30px; padding: 15px; background-color: #f4f4f4; border-radius: 8px; text-align: left; font-size: 14px; color: #555;">
      <p><strong>Account Activity Details:</strong></p>
      <p><strong>IP Address:</strong> ${ip || "Unknown"}</p>
      <p><strong>Location:</strong> ${city || "Unknown"}, ${region || "Unknown"}, ${country || "Unknown"}</p>
      <p><strong>Timezone:</strong> ${timezone || "Unknown"}</p>
      <p style="font-size: 12px; color: #999;">If this wasn't you, please secure your account immediately by contacting support.</p>
    </div>
  
    <!-- Security Notice -->
    <p style="font-size: 14px; color: #888; margin-top: 30px; text-align: center;">
      If you didn't request this, no action is required. If you suspect unauthorized access, please secure your account immediately.
    </p>
  
    <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 14px; color: #aaa;">
      <p>Thank you for using Scrap Dai!</p>
      <p><strong>The Scrap Dai Team</strong></p>
    </div>
  </div>
    `;
};


const accountDeletionEmail = (cancelLink, cancellationExpiry) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; background-color: #f9fdf9; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://static.vecteezy.com/system/resources/previews/028/671/106/non_2x/recycling-icon-leaf-symbol-design-and-circular-arrow-environmental-concept-in-isolation-on-white-background-free-vector.jpg" alt="Scrap Dai Logo" style="width: 60px;"/>
      </div>
      <h2 style="text-align: center; color: #4CAF50;">Account Deletion Request</h2>
      <p style="font-size: 16px; text-align: center;">
        You have requested to delete your account. If you change your mind, click the link below to cancel the request. This link is valid for 
        <span style="font-weight: bold; color: #4CAF50;">${cancellationExpiry}</span>.
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${cancelLink}" target="_blank" style="
          display: inline-block; 
          background-color: #4CAF50; 
          color: #fff; 
          text-decoration: none; 
          padding: 12px 24px; 
          font-size: 16px; 
          border-radius: 5px; 
          font-weight: bold;
        ">
          Cancel Deletion Request
        </a>
      </div>
      <p style="font-size: 14px; text-align: center;">
        After <span style="font-weight: bold; color: #4CAF50;">${cancellationExpiry}</span>, your account will be permanently deleted.
      </p>
      <p style="color: #888; font-size: 14px; text-align: center; margin-top: 20px;">
        Thank you for using Scrap Dai! If you have any concerns, feel free to contact us.
      </p>
    </div>
  `;
};

const orderConfirmationEmail = (order, userName) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9fdf9;">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://static.vecteezy.com/system/resources/previews/028/671/106/non_2x/recycling-icon-leaf-symbol-design-and-circular-arrow-environmental-concept-in-isolation-on-white-background-free-vector.jpg" alt="Recycling Logo" style="width: 80px;"/>
        </div>

        <h2 style="color: #4CAF50; text-align: center;">Order Confirmation</h2>
        <p style="font-size: 16px;">Hello, <strong>${userName || "Customer"}</strong></p>
        <p style="font-size: 16px;">Thank you for placing your scrap collection order with <strong>Scrap Dai</strong>. Below are your order details:</p>
        
        <div style="background-color: #e6ffe6; padding: 15px; border-radius: 8px; border: 1px solid #4CAF50;">
            <p style="font-size: 16px;"><strong>Order ID:</strong> ${order._id}</p>
            <p style="font-size: 16px;"><strong>Pickup Address:</strong> ${order.pickupAddress.formattedAddress}</p>
            <p style="font-size: 16px;"><strong>Pickup Date:</strong> ${new Date(order.pickUpDate).toLocaleDateString()}</p>
            <p style="font-size: 16px;"><strong>Status:</strong> <span style="color: #4CAF50;">${order.status}</span></p>
        </div>

        <p style="font-size: 16px; text-align: center; margin-top: 20px;">A collector will be assigned soon. Stay tuned!</p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 14px; color: #888;">
            <p>Thank you for contributing to a cleaner, greener planet!</p>
            <p><strong>Scrap Dai Team</strong></p>
        </div>
    </div>
  `;
};


export {
  verifyOtpText,
  WelcomeText,
  verifyOtpTextWithIP,
  forgotPasswordEmail,
  accountDeletionEmail,
  orderConfirmationEmail
}