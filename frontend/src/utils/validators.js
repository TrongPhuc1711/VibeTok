//validation library đầy đủ
import {
    MIN_AGE, MAX_AGE,
    MIN_PASSWORD_LENGTH,
    MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH,
    MAX_CAPTION_LENGTH, MAX_COMMENT_LENGTH, MAX_BIO_LENGTH,
  } from './constants';
  
  // 1.VALIDATION KIỂU SỐ
  /* Kiểm tra có phải là số không */
  export const isNumeric = (v) =>
    v !== null && v !== undefined && v !== '' && !isNaN(Number(v));
  
  /* Kiểm tra khoảng giá trị */
  export const isInRange = (v, min, max) =>
    isNumeric(v) && Number(v) >= min && Number(v) <= max;
  
  /* Kiểm tra số nguyên */
  export const isInteger = (v) =>
    isNumeric(v) && Number.isInteger(Number(v));
  
  /* Kiểm tra số thập phân (tuỳ chọn: số chữ số thập phân tối đa) */
  export const isDecimal = (v, places = null) => {
    if (!isNumeric(v)) return false;
    if (places !== null) return new RegExp(`^-?\\d+\\.\\d{1,${places}}$`).test(String(v));
    return String(v).includes('.');
  };
  
  /* Kiểm tra số dương */
  export const isPositive = (v) => isNumeric(v) && Number(v) > 0;
  
  /* Kiểm tra số âm */
  export const isNegative = (v) => isNumeric(v) && Number(v) < 0;
  
  /* Kiểm tra định dạng số */
  export const isValidNumberFormat = (v, format = 'standard') => {
    const patterns = {
      standard:   /^-?\d+(\.\d+)?$/,
      currency:   /^\d{1,3}(,\d{3})*(\.\d{2})?$/,
      percentage: /^\d+(\.\d+)?%?$/,
      scientific: /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i,
    };
    return (patterns[format] ?? patterns.standard).test(String(v));
  };
  
  //2.VALIDATION KIỂU CHUỖI  
  /* Kiểm tra không rỗng */
  export const isNotEmpty = (v) =>
    v !== null && v !== undefined && String(v).trim().length > 0;
  
  /* Kiểm tra độ dài tối thiểu */
  export const hasMinLength = (v, min) =>
    isNotEmpty(v) && String(v).length >= min;
  
  /* Kiểm tra độ dài tối đa */
  export const hasMaxLength = (v, max) =>
    v == null ? true : String(v).length <= max;
  
  /* Kiểm tra khoảng độ dài */
  export const isLengthInRange = (v, min, max) =>
    hasMinLength(v, min) && hasMaxLength(v, max);
  
  /* Kiểm tra regex */
  export const matchesPattern = (v, pattern) => {
    if (!isNotEmpty(v)) return false;
    const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    return re.test(String(v));
  };
  
  /* Kiểm tra ký tự cho phép */
  export const hasOnlyAllowedChars = (v, chars) =>
    isNotEmpty(v) && new RegExp(`^[${chars}]+$`).test(String(v));
  
  // 3.VALIDATION NGÀY THÁNG
  
  const FORMAT_PATTERNS = {
    'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
    'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
    'MM/DD/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
    'DD-MM-YYYY': /^\d{2}-\d{2}-\d{4}$/,
  };
  
  /* Kiểm tra định dạng ngày */
  export const isValidDateFormat = (v, format = 'YYYY-MM-DD') =>
    isNotEmpty(v) && (FORMAT_PATTERNS[format] ?? FORMAT_PATTERNS['YYYY-MM-DD']).test(String(v));
  
  /* Kiểm tra ngày hợp lệ */
  export const isValidDate = (v) => {
    if (!isNotEmpty(v)) return false;
    const d = new Date(v);
    return d instanceof Date && !isNaN(d.getTime());
  };

  /* Kiểm tra khoảng thời gian */
  export const isDateInRange = (v, minDate, maxDate) => {
    if (!isValidDate(v)) return false;
    const d = new Date(v);
    if (minDate && d < new Date(minDate)) return false;
    if (maxDate && d > new Date(maxDate)) return false;
    return true;
  };
  
  /* Kiểm tra start <= end */
  export const isStartBeforeEnd = (start, end) =>
    isValidDate(start) && isValidDate(end) && new Date(start) <= new Date(end);
  
  /* Kiểm tra ngày tương lai */
  export const isFutureDate = (v) => isValidDate(v) && new Date(v) > new Date();
  
  /* Kiểm tra ngày quá khứ */
  export const isPastDate = (v) => isValidDate(v) && new Date(v) < new Date();
  
  // 4. VALIDATION TUỔI
  
  /* Tính tuổi từ ngày sinh */
  export const calculateAge = (birthDate) => {
    if (!isValidDate(birthDate)) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };
  
  /* Tuổi tối thiểu */
  export const isMinAge = (birthDate, min = MIN_AGE) => {
    const age = calculateAge(birthDate);
    return age !== null && age >= min;
  };
  
  /* Tuổi tối đa */
  export const isMaxAge = (birthDate, max = MAX_AGE) => {
    const age = calculateAge(birthDate);
    return age !== null && age <= max;
  };
  
  /* Khoảng tuổi */
  export const isAgeInRange = (birthDate, min = MIN_AGE, max = MAX_AGE) =>
    isMinAge(birthDate, min) && isMaxAge(birthDate, max);
  
  /* Tuổi phải là số nguyên dương hợp lệ */
  export const isValidAgeNumber = (v) =>
    isNumeric(v) && isInteger(v) && isInRange(v, 1, MAX_AGE);
  
  // DOMAIN VALIDATORS  
  export const isValidEmail = (v) =>
    isNotEmpty(v) && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/.test(v);
  
  export const isValidPassword = (v) =>
    isNotEmpty(v) &&
    hasMinLength(v, MIN_PASSWORD_LENGTH) &&
    /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v);
  
  export const isValidUsername = (v) => {
    const clean = String(v || '').replace(/^@/, '');
    return isLengthInRange(clean, MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH) &&
      /^[a-zA-Z0-9_.]+$/.test(clean);
  };
  
  export const isValidUrl = (v) => {
    try { new URL(v); return true; } catch { return false; }
  };
  
  export const isValidVietnamPhone = (v) =>
    isNotEmpty(v) && /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(v);
  
  // FORM SCHEMA ENGINE  
  /*
    validateForm(data, schema) → { valid, errors }
    schema: { field: [{ validator: fn, message: string }] }
   */
  export const validateForm = (data, schema) => {
    const errors = {};
    let valid = true;
    for (const field in schema) {
      for (const rule of schema[field]) {
        if (!rule.validator(data[field], data)) {
          errors[field] = rule.message;
          valid = false;
          break;
        }
      }
    }
    return { valid, errors };
  };
  
  // Pre-built schemas
  
  export const loginSchema = {
    email: [
      { validator: (v) => isNotEmpty(v),      message: 'Email không được để trống' },
      { validator: (v) => isValidEmail(v),    message: 'Email không đúng định dạng' },
    ],
    password: [
      { validator: (v) => isNotEmpty(v),              message: 'Mật khẩu không được để trống' },
      { validator: (v) => hasMinLength(v, 6),         message: 'Mật khẩu tối thiểu 6 ký tự' },
    ],
  };
  
  export const registerSchema = {
    fullName: [
      { validator: (v) => isNotEmpty(v),         message: 'Họ tên không được để trống' },
      { validator: (v) => isLengthInRange(v,2,50),message: 'Họ tên từ 2–50 ký tự' },
    ],
    email: [
      { validator: (v) => isNotEmpty(v),          message: 'Email không được để trống' },
      { validator: (v) => isValidEmail(v),        message: 'Email không đúng định dạng' },
    ],
    password: [
      { validator: (v) => isNotEmpty(v),          message: 'Mật khẩu không được để trống' },
      { validator: (v) => isValidPassword(v),     message: `Tối thiểu ${MIN_PASSWORD_LENGTH} ký tự, gồm chữ hoa, chữ thường và số` },
    ],
    birthDate: [
      { validator: (v) => isNotEmpty(v),          message: 'Ngày sinh không được để trống' },
      { validator: (v) => isValidDate(v),         message: 'Ngày sinh không hợp lệ' },
      { validator: (v) => isPastDate(v),          message: 'Ngày sinh phải là ngày trong quá khứ' },
      { validator: (v) => isMinAge(v, MIN_AGE),   message: `Bạn phải từ ${MIN_AGE} tuổi trở lên` },
    ],
  };
  
  export const uploadSchema = {
    caption: [
      { validator: (v) => isNotEmpty(v),                  message: 'Mô tả không được để trống' },
      { validator: (v) => hasMaxLength(v, MAX_CAPTION_LENGTH), message: `Mô tả tối đa ${MAX_CAPTION_LENGTH} ký tự` },
    ],
  };
  
  export const commentSchema = {
    content: [
      { validator: (v) => isNotEmpty(v),                   message: 'Nội dung không được để trống' },
      { validator: (v) => hasMaxLength(v, MAX_COMMENT_LENGTH), message: `Bình luận tối đa ${MAX_COMMENT_LENGTH} ký tự` },
    ],
  };
  
  export const profileSchema = {
    fullName: [
      { validator: (v) => isNotEmpty(v),           message: 'Họ tên không được để trống' },
      { validator: (v) => isLengthInRange(v,2,50), message: 'Họ tên từ 2–50 ký tự' },
    ],
    username: [
      { validator: (v) => isNotEmpty(v),            message: 'Username không được để trống' },
      { validator: (v) => isValidUsername(v),       message: `Username ${MIN_USERNAME_LENGTH}–${MAX_USERNAME_LENGTH} ký tự, chỉ dùng a-z, 0-9, _ .` },
    ],
    bio: [
      { validator: (v) => hasMaxLength(v, MAX_BIO_LENGTH), message: `Bio tối đa ${MAX_BIO_LENGTH} ký tự` },
    ],
  };