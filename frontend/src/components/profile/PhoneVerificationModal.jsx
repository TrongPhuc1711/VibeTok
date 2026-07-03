import React, { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { updateUserPhone } from '../../services/userService';
import { useToast } from '../ui/Toast';

export default function PhoneVerificationModal({ onClose, onVerified }) {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');

  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Khởi tạo reCAPTCHA ẩn của Firebase
  const initRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (response) => {
            // reCAPTCHA solved, will proceed with signInWithPhoneNumber.
          },
          'expired-callback': () => {
            showWarning('reCAPTCHA hết hạn', 'Vui lòng xác minh lại reCAPTCHA');
          }
        });
      } catch (err) {
        console.error('Lỗi khởi tạo RecaptchaVerifier:', err);
      }
    }
  };

  const formatPhoneNumber = (num) => {
    let cleaned = num.trim().replace(/[\s\-\(\)]/g, '');
    // Nếu bắt đầu bằng 0, thay thế bằng +84 cho mã vùng Việt Nam
    if (cleaned.startsWith('0')) {
      cleaned = '+84' + cleaned.substring(1);
    }
    // Nếu chưa có dấu +, tự động thêm vào
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    setSendingOtp(true);
    setError('');
    
    try {
      initRecaptcha();
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const appVerifier = recaptchaVerifierRef.current;

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      window.confirmationResult = confirmationResult;
      setVerificationId(confirmationResult.verificationId);
      setTimer(60); // 60s đếm ngược
      showSuccess('Đã gửi mã OTP! 📨', `Mã OTP đã được gửi tới ${formattedPhone}`);
    } catch (err) {
      console.error('Lỗi gửi OTP Firebase:', err);
      let errMsg = 'Không thể gửi mã OTP. Vui lòng kiểm tra lại số điện thoại.';
      if (err.code === 'auth/invalid-phone-number') {
        errMsg = 'Số điện thoại không hợp lệ (Ví dụ đúng: 0912345678)';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Quá nhiều yêu cầu gửi SMS. Vui lòng thử lại sau.';
      }
      setError(errMsg);
      showError('Gửi OTP thất bại', errMsg);
      // Reset recaptcha
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã OTP 6 chữ số');
      return;
    }

    setVerifyingOtp(true);
    setError('');

    try {
      const confirmationResult = window.confirmationResult;
      if (!confirmationResult) {
        throw new Error('Không tìm thấy phiên xác thực OTP. Vui lòng gửi lại mã.');
      }

      // Xác minh OTP với Firebase
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const verifiedPhone = user.phoneNumber; // Lấy số điện thoại đã xác nhận định dạng +84...

      // Gửi số điện thoại lên Backend để lưu vào DB MySQL
      const apiRes = await updateUserPhone(verifiedPhone);
      
      showSuccess('Xác minh thành công! 🎉', 'Số điện thoại đã được liên kết với tài khoản');
      onVerified?.(apiRes.data.user);
      onClose();
    } catch (err) {
      console.error('Lỗi xác thực OTP:', err);
      let errMsg = err.message || 'Mã OTP không chính xác hoặc đã hết hạn';
      if (err.code === 'auth/invalid-verification-code') {
        errMsg = 'Mã OTP không chính xác. Vui lòng nhập lại.';
      } else if (err.code === 'auth/code-expired') {
        errMsg = 'Mã OTP đã hết hạn. Vui lòng nhấn gửi lại mã.';
      }
      setError(errMsg);
      showError('Xác thực thất bại', errMsg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Container reCAPTCHA ẩn */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-[420px] bg-[#121212] rounded-2xl border border-[#2a2a2a] shadow-2xl flex flex-col p-6 animate-fade-in text-white font-body">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2a2a2a] mb-5">
          <h3 className="text-[17px] font-semibold">Xác minh Số điện thoại</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#2a2a2a] hover:bg-[#333] border-none cursor-pointer flex items-center justify-center text-[#888] hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Form nhập Số điện thoại */}
        {!verificationId ? (
          <div className="flex flex-col gap-4">
            <p className="text-[#aaa] text-[13px] leading-relaxed">
              Nhập số điện thoại của bạn để nhận mã xác minh OTP qua tin nhắn SMS miễn phí bằng Firebase.
            </p>
            <div>
              <label className="text-[12px] text-[#888] block mb-1.5 font-semibold">Số điện thoại</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError('');
                }}
                placeholder="Ví dụ: 0987654321"
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-[14px] outline-none focus:border-[#444] transition-colors placeholder:text-[#555]"
                disabled={sendingOtp}
              />
            </div>

            {error && <p className="text-red-400 text-[12px]">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={sendingOtp || !phoneNumber.trim()}
              className="w-full py-3 rounded-lg bg-brand-gradient text-white text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sendingOtp ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
            </button>
          </div>
        ) : (
          /* Form nhập OTP */
          <div className="flex flex-col gap-4">
            <p className="text-[#aaa] text-[13px] leading-relaxed">
              Mã xác minh đã được gửi đến số điện thoại của bạn. Vui lòng nhập mã gồm 6 chữ số dưới đây.
            </p>
            <div>
              <label className="text-[12px] text-[#888] block mb-1.5 font-semibold">Mã OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Nhập 6 số OTP"
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-3 text-center tracking-[10px] font-bold text-white text-[18px] outline-none focus:border-[#444] transition-colors placeholder:text-[#555] placeholder:tracking-normal placeholder:font-normal placeholder:text-[14px]"
                disabled={verifyingOtp}
              />
            </div>

            {error && <p className="text-red-400 text-[12px]">{error}</p>}

            <div className="flex items-center justify-between text-[13px] text-[#888]">
              <span>Không nhận được mã?</span>
              {timer > 0 ? (
                <span>Gửi lại sau {timer}s</span>
              ) : (
                <button
                  onClick={handleSendOtp}
                  className="bg-transparent border-none text-[#ff2d78] cursor-pointer hover:underline font-semibold"
                >
                  Gửi lại mã
                </button>
              )}
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setVerificationId(null)}
                className="flex-1 py-3 rounded-lg bg-transparent border border-[#333] text-[#aaa] text-[14px] font-semibold cursor-pointer hover:border-[#555] hover:text-white transition-colors"
                disabled={verifyingOtp}
              >
                Quay lại
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otp.length !== 6}
                className="flex-1 py-3 rounded-lg bg-brand-gradient text-white text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {verifyingOtp ? 'Đang xác minh...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
