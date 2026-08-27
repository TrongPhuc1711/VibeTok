import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useTheme } from '../../contexts/ThemeContext';

export default function TermsPage() {
  const { isDark } = useTheme();

  return (
    <PageLayout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto text-body font-body leading-relaxed">
        <div
          className="rounded-2xl p-6 md:p-10 border border-border shadow-sm mb-12"
          style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)' }}
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
            Điều Khoản Sử Dụng Dịch Vụ (Terms of Service)
          </h1>
          

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">1. Chấp thuận điều khoản</h2>
            <p>
              Bằng việc truy cập hoặc sử dụng nền tảng <strong>VibeTok</strong>, bạn đồng ý tuân thủ và chịu sự ràng buộc bởi các Điều khoản dịch vụ này cùng Chính sách quyền riêng tư của chúng tôi. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">2. Tài khoản người dùng</h2>
            <p className="mb-3">
              Để sử dụng một số tính năng như đăng tải video, bình luận, yêu thích, bạn cần tạo tài khoản. Bạn có trách nhiệm:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký.</li>
              <li>Bảo mật mật khẩu và chịu trách nhiệm cho tất cả các hoạt động diễn ra dưới tài khoản của bạn.</li>
              <li>Thông báo ngay cho chúng tôi nếu phát hiện hành vi truy cập trái phép vào tài khoản.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">3. Quy định về nội dung và hành vi cộng đồng</h2>
            <p className="mb-3">
              Người dùng không được phép đăng tải hoặc chia sẻ bất kỳ nội dung nào có tính chất:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vi phạm pháp luật, thuần phong mỹ tục hoặc bản quyền sở hữu trí tuệ của người khác.</li>
              <li>Bạo lực, thù địch, đe dọa, xúc phạm hoặc quấy rối danh dự cá nhân/tổ chức.</li>
              <li>Nội dung khiêu dâm, không phù hợp với lứa tuổi hoặc gây nguy hiểm.</li>
              <li>Nội dung rác (spam), lừa đảo, phát tán mã độc hại.</li>
            </ul>
            <p className="mt-3">
              Chúng tôi có quyền gỡ bỏ nội dung hoặc khóa vĩnh viễn tài khoản vi phạm mà không cần thông báo trước.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">4. Quyền sở hữu trí tuệ</h2>
            <p>
              Bạn giữ toàn bộ quyền sở hữu đối với nội dung mà bạn tạo ra và tải lên VibeTok. Tuy nhiên, bằng việc đăng tải nội dung lên nền tảng, bạn cấp cho VibeTok giấy phép toàn cầu, miễn phí bản quyền để lưu trữ, hiển thị, phân phối và quảng bá nội dung đó trên hệ thống của chúng tôi.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">5. Thay đổi điều khoản</h2>
            <p>
              Chúng tôi có thể cập nhật các Điều khoản này theo thời gian. Mọi thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang này. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp thuận các điều khoản mới.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
