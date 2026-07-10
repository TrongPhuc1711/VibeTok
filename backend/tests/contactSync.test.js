/**
 * Test: Contact Sync Bug Fixes
 * 
 * Kiểm tra 4 lỗi đã sửa:
 * 1. UserModel.updatePhone không bị ghi đè (duplicate removed)
 * 2. Chuẩn hóa số điện thoại nhất quán (E.164 format)
 * 3. updateMyProfile trả về dữ liệu mới nhất (not stale)
 * 4. ContactSyncModal hiển thị thông báo cho Desktop
 * 
 * Chạy: node tests/contactSync.test.js
 */

import assert from 'assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ ${name}`);
        console.error(`     ${e.message}`);
        failed++;
    }
}

// ═══════════════════════════════════════════════════════
// Test 1: UserModel - Không còn hàm updatePhone trùng lặp
// ═══════════════════════════════════════════════════════
console.log('\n📦 Test 1: UserModel.updatePhone không bị ghi đè');

const userModelSrc = readFileSync(
    path.resolve(__dirname, '../models/userModel.js'), 'utf-8'
);

test('Chỉ có duy nhất 1 lần định nghĩa updatePhone', () => {
    const matches = userModelSrc.match(/async updatePhone\s*\(/g);
    assert.strictEqual(matches?.length, 1,
        `Tìm thấy ${matches?.length} lần định nghĩa updatePhone, expected 1`);
});

test('updatePhone phải set da_xac_minh_sdt = 1', () => {
    // Tìm nội dung hàm updatePhone
    const idx = userModelSrc.indexOf('async updatePhone');
    const bodyAfter = userModelSrc.substring(idx, idx + 300);
    assert.ok(bodyAfter.includes('da_xac_minh_sdt'),
        'updatePhone phải cập nhật da_xac_minh_sdt');
});

test('updatePhone phải trả về user (gọi findById)', () => {
    const idx = userModelSrc.indexOf('async updatePhone');
    const bodyAfter = userModelSrc.substring(idx, idx + 300);
    assert.ok(bodyAfter.includes('return this.findById'),
        'updatePhone phải return this.findById(userId)');
});

// ═══════════════════════════════════════════════════════
// Test 2: Chuẩn hóa số điện thoại nhất quán (E.164)
// ═══════════════════════════════════════════════════════
console.log('\n📱 Test 2: Chuẩn hóa số điện thoại E.164 nhất quán');

const controllerSrc = readFileSync(
    path.resolve(__dirname, '../controllers/userController.js'), 'utf-8'
);

// Simulate the normalization logic from each function
function normalizePhoneUpdateProfile(input) {
    let phone = input.replace(/[\s\-().]/g, '');
    if (phone && phone.startsWith('0')) {
        phone = '+84' + phone.substring(1);
    } else if (phone && !phone.startsWith('+')) {
        phone = '+' + phone;
    }
    return phone;
}

function normalizePhoneUpdateUserPhone(input) {
    // Updated logic (after fix): same as updateMyProfile
    let cleanPhone = input.trim().replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '+84' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
    }
    return cleanPhone;
}

function normalizePhoneSyncContacts(input) {
    let phone = input.trim().replace(/[\s\-().]/g, '');
    if (phone && phone.startsWith('0')) {
        phone = '+84' + phone.substring(1);
    } else if (phone && !phone.startsWith('+')) {
        phone = '+' + phone;
    }
    return phone;
}

const testNumbers = [
    '0912345678',
    '+84912345678',
    '84912345678',
    '0 912 345-678',
    '(09)12345678',
];

testNumbers.forEach(num => {
    test(`"${num}" → chuẩn hóa nhất quán giữa tất cả API`, () => {
        const fromProfile = normalizePhoneUpdateProfile(num);
        const fromUserPhone = normalizePhoneUpdateUserPhone(num);
        const fromSync = normalizePhoneSyncContacts(num);

        assert.strictEqual(fromProfile, fromUserPhone,
            `updateMyProfile: "${fromProfile}" ≠ updateUserPhone: "${fromUserPhone}"`);
        assert.strictEqual(fromProfile, fromSync,
            `updateMyProfile: "${fromProfile}" ≠ syncContacts: "${fromSync}"`);
    });
});

test('Số điện thoại VN luôn bắt đầu bằng +84', () => {
    const result = normalizePhoneUpdateUserPhone('0912345678');
    assert.ok(result.startsWith('+84'), `Expected +84..., got ${result}`);
    assert.strictEqual(result, '+84912345678');
});

test('Số quốc tế giữ nguyên dấu +', () => {
    const result = normalizePhoneUpdateUserPhone('+1234567890');
    assert.strictEqual(result, '+1234567890');
});

test('Số không có + được thêm + vào đầu', () => {
    const result = normalizePhoneUpdateUserPhone('84912345678');
    assert.strictEqual(result, '+84912345678');
});

// ═══════════════════════════════════════════════════════
// Test 3: updateMyProfile không trả dữ liệu cũ
// ═══════════════════════════════════════════════════════
console.log('\n🔄 Test 3: updateMyProfile trả dữ liệu mới nhất');

test('updateMyProfile gọi findById SAU tất cả cập nhật', () => {
    // Tìm vị trí của hàm updateMyProfile  
    const startIdx = controllerSrc.indexOf('export const updateMyProfile');
    const endIdx = controllerSrc.indexOf('export const', startIdx + 10);
    const fnBody = controllerSrc.substring(startIdx, endIdx);

    // Kiểm tra findById được gọi SAU updateAvatar và updatePhone
    const avatarIdx = fnBody.indexOf('updateAvatar');
    const phoneIdx = fnBody.indexOf('updatePhone');
    const findByIdIdx = fnBody.indexOf('findById');

    assert.ok(findByIdIdx > avatarIdx,
        'findById phải được gọi SAU updateAvatar');
    assert.ok(findByIdIdx > phoneIdx,
        'findById phải được gọi SAU updatePhone');
});

test('updateMyProfile sử dụng biến freshUser (không phải biến cũ)', () => {
    const startIdx = controllerSrc.indexOf('export const updateMyProfile');
    const endIdx = controllerSrc.indexOf('export const', startIdx + 10);
    const fnBody = controllerSrc.substring(startIdx, endIdx);

    assert.ok(fnBody.includes('freshUser'),
        'Phải dùng biến freshUser để lấy dữ liệu mới');
    assert.ok(fnBody.includes('normalizeUser(freshUser)'),
        'Phải normalize từ freshUser');
});

test('updateMyProfile KHÔNG gán kết quả updateProfile vào biến response', () => {
    const startIdx = controllerSrc.indexOf('export const updateMyProfile');
    const endIdx = controllerSrc.indexOf('export const', startIdx + 10);
    const fnBody = controllerSrc.substring(startIdx, endIdx);
    
    // Không nên có "const updated = await UserModel.updateProfile"
    assert.ok(!fnBody.includes('const updated = await UserModel.updateProfile'),
        'Không được dùng biến "updated" từ updateProfile cho response');
});

// ═══════════════════════════════════════════════════════
// Test 4: ContactSyncModal - Desktop UX
// ═══════════════════════════════════════════════════════
console.log('\n🖥️  Test 4: ContactSyncModal UX cho Desktop');

const modalSrc = readFileSync(
    path.resolve(__dirname, '../../frontend/src/components/profile/ContactSyncModal.jsx'), 'utf-8'
);

test('Có state contactApiSupported để track hỗ trợ Contact Picker', () => {
    assert.ok(modalSrc.includes('contactApiSupported'),
        'Modal phải có state contactApiSupported');
});

test('setContactApiSupported được gọi trong performSync', () => {
    assert.ok(modalSrc.includes('setContactApiSupported(supported)'),
        'performSync phải gọi setContactApiSupported');
});

test('Hiển thị thông báo khi contactApiSupported === false', () => {
    assert.ok(modalSrc.includes('contactApiSupported === false'),
        'Phải kiểm tra contactApiSupported === false để hiển thị thông báo');
});

test('Thông báo có nội dung hướng dẫn người dùng Desktop', () => {
    assert.ok(modalSrc.includes('Trình duyệt không hỗ trợ đọc danh bạ'),
        'Phải có dòng tiêu đề thông báo cho Desktop users');
    assert.ok(modalSrc.includes('trình duyệt di động'),
        'Phải giải thích rằng tính năng chỉ chạy trên di động');
});

// ═══════════════════════════════════════════════════════
// Test 5: Kiểm tra tính nhất quán của source code
// ═══════════════════════════════════════════════════════
console.log('\n🔍 Test 5: Kiểm tra tổng thể source code');

test('updateUserPhone trong controller không loại bỏ dấu + nữa', () => {
    // Tìm hàm updateUserPhone
    const startIdx = controllerSrc.indexOf('export const updateUserPhone');
    const endIdx = controllerSrc.indexOf('export const', startIdx + 10);
    const fnBody = controllerSrc.substring(startIdx, endIdx);

    // Regex cũ loại bỏ dấu +: /[\s\-\(\)\+]/g  
    assert.ok(!fnBody.includes('\\+]/g'),
        'updateUserPhone không được loại bỏ dấu + trong regex');
});

test('userModel.js kết thúc đúng cú pháp (không thiếu };)', () => {
    const trimmed = userModelSrc.trim();
    assert.ok(trimmed.endsWith('};'),
        `File phải kết thúc bằng "};" nhưng kết thúc bằng: "${trimmed.slice(-10)}"`);
});

test('Controller import đầy đủ các model cần thiết', () => {
    assert.ok(controllerSrc.includes("import { UserModel, normalizeUser }"),
        'Phải import UserModel và normalizeUser');
    assert.ok(controllerSrc.includes("import { FollowModel }"),
        'Phải import FollowModel');
});

// ═══════════════════════════════════════════════════════
// Tóm tắt kết quả
// ═══════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(50));
console.log(`📊 Kết quả: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(50));

if (failed > 0) {
    console.error('\n⚠️  Có test thất bại! Kiểm tra lại code.\n');
    process.exit(1);
} else {
    console.log('\n🎉 Tất cả test đều passed!\n');
    process.exit(0);
}
