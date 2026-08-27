import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useTheme } from '../../contexts/ThemeContext';

export default function PrivacyPolicyPage() {
  const { isDark } = useTheme();

  return (
    <PageLayout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto text-body font-body leading-relaxed">
        <div
          className="rounded-2xl p-6 md:p-10 border border-border shadow-sm mb-12"
          style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)' }}
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
            Chính Sách Quyền Riêng Tư (Privacy Policy)
          </h1>
          

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">1. Giới thiệu</h2>
            <p className="mb-3">
              Chào mừng bạn đến với <strong>VibeTok</strong> ("chúng tôi", "nền tảng"). Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng khi truy cập và sử dụng dịch vụ chia sẻ video ngắn VibeTok.
            </p>
            <p>
              Chính sách quyền riêng tư này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi bạn truy cập trang web hoặc sử dụng các tính năng của chúng tôi.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">2. Thông tin chúng tôi thu thập</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Thông tin tài khoản:</strong> Khi bạn đăng ký tài khoản, chúng tôi thu thập tên người dùng, địa chỉ email, ảnh đại diện và ngày sinh.
              </li>
              <li>
                <strong>Nội dung người dùng tạo:</strong> Các video, hình ảnh, âm thanh, bình luận và tin nhắn do bạn tải lên hoặc chia sẻ công khai.
              </li>
              <li>
                <strong>Dữ liệu nhật ký & thiết bị:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành, thời gian truy cập và các tương tác trên trang.
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">3. Cookie và Công nghệ Theo dõi</h2>
            <p className="mb-3">
              Chúng tôi sử dụng Cookie và các công nghệ tương tự để duy trì trạng thái đăng nhập, ghi nhớ tùy chọn giao diện (Sáng/Tối) và tối ưu hóa trải nghiệm người dùng.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">4. Quảng cáo của bên thứ ba (Google AdSense)</h2>
            <p className="mb-3">
              Chúng tôi có thể sử dụng các nhà cung cấp bên thứ ba, bao gồm <strong>Google AdSense</strong>, để phân phát quảng cáo khi bạn truy cập trang web của chúng tôi.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Google sử dụng cookie để phân phát quảng cáo dựa trên các lượt truy cập trước đó của bạn vào trang web này hoặc các trang web khác trên Internet.
              </li>
              <li>
                Người dùng có thể chọn không tham gia sử dụng cookie DART bằng cách truy cập <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Chính sách quyền riêng tư của mạng nội dung và quảng cáo Google</a>.
              </li>
              <li>
                Bạn cũng có thể tùy chỉnh hoặc tắt quảng cáo được cá nhân hóa tại <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a>.
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">5. Bảo vệ & Bảo mật thông tin</h2>
            <p>
              Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành (mã hóa mật khẩu, kiểm soát truy cập, chứng chỉ bảo mật SSL) để bảo vệ dữ liệu người dùng khỏi việc truy cập, sửa đổi hoặc tiết lộ trái phép.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">6. Liên hệ chúng tôi</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về Chính sách quyền riêng tư này hoặc cách chúng tôi xử lý dữ liệu của bạn, vui lòng liên hệ với chúng tôi qua email: <span className="text-primary font-medium">trongphuc171104@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
