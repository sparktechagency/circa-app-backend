import { ICreateAccount, IResetPassword } from '../types/emailTamplate';

const createAccount = (values: ICreateAccount) => {
  const data = {
    to: values.email,
    subject: 'Verify your account',
    html: `  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #15131A; margin: 0; padding: 0;">
      <div style="width: 100%; background-color: #15131A; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1E1C26; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
          
          <!-- Header with logo -->
          <div style="background: linear-gradient(135deg, #99A0FD 0%, #7B83E8 100%); padding: 40px 20px; text-align: center;">
            <img src="https://res.cloudinary.com/dkbcx9amc/image/upload/v1770442848/image_1_e4os7b.png" alt="Circa" style="width: 90px; height: auto; margin-bottom: 16px;" />
            <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 600;">Verify Your Account</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; text-align: center;">
            <p style="color: #E5E5E5; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
              Hey <strong style="color: #99A0FD;">${values.name}</strong>! 👋
            </p>
            <p style="color: #B8B8B8; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
              You're almost there! Use the code below to verify your account and start connecting with your favorite celebrities.
            </p>
            
            <!-- OTP Code Box -->
            <div style="background: linear-gradient(135deg, #99A0FD 0%, #7B83E8 100%); padding: 24px; border-radius: 12px; margin: 0 auto 24px; max-width: 200px;">
              <div style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${values.otp}
              </div>
            </div>
            
            <p style="color: #B8B8B8; font-size: 14px; line-height: 1.5; margin: 0 0 32px 0;">
              ⏱️ This code expires in <strong style="color: #99A0FD;">3 minutes</strong>
            </p>
            
            <div style="background-color: #252330; border-left: 3px solid #99A0FD; padding: 16px; border-radius: 8px; text-align: left; margin-top: 32px;">
              <p style="color: #B8B8B8; font-size: 13px; line-height: 1.5; margin: 0;">
                <strong style="color: #E5E5E5;">Didn't request this?</strong><br/>
                If you didn't create a Circa account, you can safely ignore this email.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #15131A; padding: 24px 30px; text-align: center; border-top: 1px solid #252330;">
            <p style="color: #6B6B6B; font-size: 12px; line-height: 1.5; margin: 0;">
              © ${new Date().getFullYear()} Circa. All rights reserved.<br/>
              Where fans meet their icons.
            </p>
          </div>
        </div>
      </div>
    </body>`,
  };
  return data;
};

const resetPassword = (values: IResetPassword) => {
  const data = {
    to: values.email,
    subject: 'Reset your password',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
            <div style="background-color: #277E16; width: 80px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
                <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;text-align:left">If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};



const welcomeMessage = (values: {email: string,name: string}) => {
  return {
    to: values.email,
    subject: 'Welcome to Circa',
    html:`
     <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #15131A; margin: 0; padding: 0;">
      <div style="width: 100%; background-color: #15131A; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1E1C26; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
          
          <!-- Header with logo -->
          <div style="background: linear-gradient(135deg, #99A0FD 0%, #7B83E8 100%); padding: 50px 20px; text-align: center;">
            <img src="https://res.cloudinary.com/dkbcx9amc/image/upload/v1770442848/image_1_e4os7b.png" alt="Circa" style="width: 90px; height: auto; margin-bottom: 20px;" />
            <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 12px 0; font-weight: 600;">Welcome to Circa!</h1>
            <p style="color: #E8E9FF; font-size: 16px; margin: 0;">Where fans meet their icons ✨</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #E5E5E5; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
              Hi <strong style="color: #99A0FD;">${values.name}</strong>,
            </p>
            <p style="color: #B8B8B8; font-size: 16px; line-height: 1.7; margin: 0 0 28px 0;">
              We're thrilled to have you join our community! You're now part of a platform where the distance between fans and celebrities doesn't exist.
            </p>
            
            <!-- Feature Cards -->
            <div style="margin: 32px 0;">
              <div style="background-color: #252330; padding: 20px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #99A0FD;">
                <h3 style="color: #99A0FD; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">🌟 Follow Your Favorites</h3>
                <p style="color: #B8B8B8; font-size: 14px; line-height: 1.5; margin: 0;">
                  Discover and follow celebrities from around the world. Never miss an update!
                </p>
              </div>
              
              <div style="background-color: #252330; padding: 20px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #99A0FD;">
                <h3 style="color: #99A0FD; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">💬 Real Interactions</h3>
                <p style="color: #B8B8B8; font-size: 14px; line-height: 1.5; margin: 0;">
                  Comment, react, and engage directly with your favorite celebrities' posts.
                </p>
              </div>
              
              <div style="background-color: #252330; padding: 20px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #99A0FD;">
                <h3 style="color: #99A0FD; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">🔔 Stay Updated</h3>
                <p style="color: #B8B8B8; font-size: 14px; line-height: 1.5; margin: 0;">
                  Get instant notifications when your favorites post, go live, or share exclusive content.
                </p>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0 32px 0;">
              <a href="YOUR_APP_URL_HERE" style="display: inline-block; background: linear-gradient(135deg, #99A0FD 0%, #7B83E8 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 30px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(153, 160, 253, 0.4);">
                Explore Circa Now
              </a>
            </div>
            
            <!-- Tips Section -->
            <div style="background-color: #252330; padding: 24px; border-radius: 12px; margin-top: 32px;">
              <h3 style="color: #E5E5E5; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">👉 Quick Tips to Get Started:</h3>
              <ul style="color: #B8B8B8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Complete your profile to personalize your experience</li>
                <li>Browse trending celebrities and follow the ones you love</li>
                <li>Turn on notifications to never miss a moment</li>
                <li>Share your thoughts and connect with fellow fans</li>
              </ul>
            </div>
            
            <!-- Help Section -->
            <div style="text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid #252330;">
              <p style="color: #B8B8B8; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                Need help getting started?
              </p>
              <a href="YOUR_SUPPORT_URL_HERE" style="color: #99A0FD; text-decoration: none; font-size: 14px; font-weight: 500;">
                Visit our Help Center →
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #15131A; padding: 32px 30px; text-align: center; border-top: 1px solid #252330;">
            <p style="color: #E5E5E5; font-size: 14px; margin: 0 0 16px 0;">
              Follow us on social media
            </p>
            <div style="margin-bottom: 20px;">
              <!-- Add your social media links here -->
              <a href="#" style="display: inline-block; margin: 0 8px; color: #99A0FD; text-decoration: none; font-size: 14px;">Twitter</a>
              <a href="#" style="display: inline-block; margin: 0 8px; color: #99A0FD; text-decoration: none; font-size: 14px;">Instagram</a>
              <a href="#" style="display: inline-block; margin: 0 8px; color: #99A0FD; text-decoration: none; font-size: 14px;">Facebook</a>
            </div>
            <p style="color: #6B6B6B; font-size: 12px; line-height: 1.6; margin: 0;">
              © ${new Date().getFullYear()} Circa. All rights reserved.<br/>
              <a href="YOUR_TERMS_URL" style="color: #6B6B6B; text-decoration: none;">Terms of Service</a> • 
              <a href="YOUR_PRIVACY_URL" style="color: #6B6B6B; text-decoration: none;">Privacy Policy</a><br/>
              <a href="YOUR_UNSUBSCRIBE_URL" style="color: #6B6B6B; text-decoration: none;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    `
  }
};

export const emailTemplate = {
  createAccount,
  resetPassword,
  welcomeMessage
};
