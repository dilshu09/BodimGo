import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import SeekerProfile from '../models/SeekerProfile.js';
import { sendEmail } from '../utils/email.service.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: role || 'seeker',
      otp,
      otpExpires,
      isVerified: false
    });

    if (user.role === 'provider') {
      await ProviderProfile.create({ user: user._id });
    } else if (user.role === 'seeker') {
      await SeekerProfile.create({ user: user._id });
    }

    try {
      await sendEmail(email, 'BodimGo Verification Code', `Your verification code is: ${otp}`);
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email.',
      email: user.email
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      token
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(email, 'BodimGo Verification Code (Resent)', `Your new verification code is: ${otp}`);

    res.json({ message: 'OTP resent successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {

      if (!user.isVerified) {
        return res.status(401).json({ message: 'Email not verified. Please verify your email first.' });
      }

      const token = generateToken(user._id);

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'Lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      user.lastLogin = Date.now();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
export const logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'Lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get profile
// @route   GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profileData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled || false
    };

    if (user.role === 'provider') {
      const providerProfile = await ProviderProfile.findOne({ user: user._id });
      if (providerProfile) {
        profileData = {
          ...profileData,
          businessName: providerProfile.businessName,
          bio: providerProfile.bio, // Using 'bio' as Address/Desc based on UI
          payoutSettings: providerProfile.payoutSettings,
          stripeAccountId: providerProfile.stripeAccountId,
          stripeOnboardingComplete: providerProfile.stripeOnboardingComplete
        };
      }
    }

    res.json(profileData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update User fields
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    if (req.body.profileImage) user.profileImage = req.body.profileImage;

    // Check if email is being changed (might require specialized verification logic usually, skipping for now)
    // if (req.body.email && req.body.email !== user.email) user.email = req.body.email; 

    await user.save();

    let updatedProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage
    };

    // Update Provider Profile fields
    if (user.role === 'provider') {
      let providerProfile = await ProviderProfile.findOne({ user: user._id });

      // Create if doesn't exist (safety net)
      if (!providerProfile) {
        providerProfile = new ProviderProfile({ user: user._id });
      }

      if (req.body.businessName) providerProfile.businessName = req.body.businessName;
      if (req.body.bio) providerProfile.bio = req.body.bio; // storing Address in bio/desc

      // Update Bank Details
      if (req.body.bankName || req.body.accountNumber || req.body.branchName || req.body.accountHolderName) {
        providerProfile.payoutSettings = {
          bankName: req.body.bankName || providerProfile.payoutSettings?.bankName,
          branchName: req.body.branchName || providerProfile.payoutSettings?.branchName,
          accountHolderName: req.body.accountHolderName || providerProfile.payoutSettings?.accountHolderName,
          accountNumber: req.body.accountNumber || providerProfile.payoutSettings?.accountNumber
        };
      }

      await providerProfile.save();

      updatedProfile = {
        ...updatedProfile,
        businessName: providerProfile.businessName,
        bio: providerProfile.bio,
        payoutSettings: providerProfile.payoutSettings
      };
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Request Password Change OTP
// @route   POST /api/auth/password-otp
export const requestPasswordOtp = async (req, res) => {
  const { currentPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendEmail(user.email, 'Security Verification Code', `Your verification code for password change is: ${otp}`);

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Request OTP for Enabling/Disabling 2FA
// @route   POST /api/auth/2fa-otp
export const requestTwoFactorOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(user.email, '2FA Verification Code', `Your verification code for Two-Factor Authentication is: ${otp}`);

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Verify OTP and Toggle 2FA
// @route   POST /api/auth/2fa-toggle
export const toggleTwoFactor = async (req, res) => {
  const { otp, enabled } = req.body; // enabled: true = enable, false = disable

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Code expired' });
    }

    user.twoFactorEnabled = enabled;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: `Two-Factor Authentication ${enabled ? 'enabled' : 'disabled'} successfully`, twoFactorEnabled: user.twoFactorEnabled });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Change Password with Conditional OTP
// @route   PUT /api/auth/password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, otp } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Only check OTP if 2FA is ENABLED
    if (user.twoFactorEnabled) {
      if (!user.otp || user.otp !== otp) {
        return res.status(400).json({ message: 'Invalid code' });
      }

      if (user.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'Code expired' });
      }

      // Clear OTP after successful use
      user.otp = undefined;
      user.otpExpires = undefined;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Forgot Password - Send Reset Email
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate Verification Code (OTP style for simplicity)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store hashed version? For simplicity now we store direct or temporary field
    // We can reuse 'otp' field logic or add 'resetPasswordToken' in User model
    // Let's use 'otp' field for simplicity as it serves same verification purpose
    user.otp = resetCode;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(email, 'BodimGo Password Reset', `Your password reset code is: ${resetCode}`);

    res.json({ message: 'Password reset code sent to email' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Code expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now login.' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
