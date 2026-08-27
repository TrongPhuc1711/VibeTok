import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useTheme } from '../../contexts/ThemeContext';

export default function AboutPage() {
  const { isDark } = useTheme();

  return (
    <PageLayout>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto text-body font-body leading-relaxed">
        <div
          className="rounded-2xl p-6 md:p-10 border border-border shadow-sm mb-12"
          style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)' }}
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
            Về VibeTok (About Us)
          </h1>
          <p className="text-sm text-subtext mb-8">
            Nền tảng chia sẻ video ngắn sáng tạo — Feel The Vibe
          </p>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">1. Sứ mệnh của chúng tôi</h2>
            <p className="mb-3">
              <strong>VibeTok</strong> là nền tảng giải trí và chia sẻ video ngắn trực tuyến, nơi mọi người có thể tự do thể hiện cá tính, chia sẻ những khoảnh khắc đáng nhớ và kết nối với cộng đồng sáng tạo trên toàn thế giới.
            </p>
            <p>
              Chúng tôi mang đến những công cụ hiện đại, giao diện trực quan và trải nghiệm mượt mà để các nhà sáng tạo nội dung có thể dễ dàng tạo dựng, biên tập và lan tỏa những câu chuyện đầy cảm hứng.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">2. Tính năng nổi bật</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="p-4 rounded-xl border border-border bg-base">
                <h3 className="font-bold text-primary mb-1">Feed Video Thông Minh</h3>
                <p className="text-sm text-subtext">Khám phá hàng ngàn video hấp dẫn mỗi ngày theo sở thích của bạn.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-base">
                <h3 className="font-bold text-primary mb-1">Kho Âm Nhạc Phong Phú</h3>
                <p className="text-sm text-subtext">Hàng triệu bản nhạc thịnh hành sẵn sàng lồng ghép vào video.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-base">
                <h3 className="font-bold text-primary mb-1">Nhắn tin & Gọi Trực Tiếp</h3>
                <p className="text-sm text-subtext">Trò chuyện, chia sẻ khoảnh khắc và gọi video với bạn bè theo thời gian thực.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-base">
                <h3 className="font-bold text-primary mb-1">Kiểm Duyệt An Toàn</h3>
                <p className="text-sm text-subtext">Hệ thống kiểm duyệt nội dung tự động và quản trị viên luôn giữ môi trường lành mạnh.</p>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold text-bright mb-3">3. Thông tin liên hệ & Hỗ trợ</h2>
            <p className="mb-2">Chúng tôi luôn lắng nghe ý kiến đóng góp từ người dùng và đối tác:</p>
            <ul className="space-y-1 text-sm">
              <li><strong>Email hỗ trợ:</strong> trongphuc171104@gmail.com</li>
              <li><strong>Hợp tác kinh doanh:</strong> trongphuc171104@gmail.com</li>
              <li><strong>Địa chỉ:</strong> Việt Nam</li>
            </ul>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
