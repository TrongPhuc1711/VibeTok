/**
 * Khởi tạo Facebook SDK với App ID từ biến môi trường Vite.
 * Gọi hàm này một lần khi app mount (ví dụ trong main.jsx).
 */
export function initFacebookSDK() {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
        console.warn('[FB SDK] VITE_FACEBOOK_APP_ID chưa được cấu hình');
        return;
    }

    // fbAsyncInit sẽ được gọi khi SDK load xong (từ index.html)
    window.fbAsyncInit = function () {
        window.FB.init({
            appId,
            cookie: true,
            xfbml: true,
            version: 'v21.0',
        });
    };

    // Nếu SDK đã load trước khi module này chạy → init ngay
    if (window.FB) {
        window.FB.init({
            appId,
            cookie: true,
            xfbml: true,
            version: 'v21.0',
        });
    }
}
