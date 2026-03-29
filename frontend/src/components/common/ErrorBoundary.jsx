import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Cập nhật state để UI hiển thị fallback UI ở lần render tiếp theo
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Bạn có thể log lỗi ra một service như Sentry tại đây
  componentDidCatch(error, errorInfo) {
    console.error("Lỗi giao diện (Đã bị bắt bởi ErrorBoundary):", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Giao diện dự phòng (Fallback UI) khi app bị sập
      return (
        <div className="min-h-screen w-full bg-base flex flex-col items-center justify-center text-center px-5 font-body">
          <span className="text-[64px] mb-4">😵</span>
          <h1 className="font-display font-bold text-[28px] text-white mb-2">
            Ối! Có lỗi xảy ra
          </h1>
          <p className="text-text-secondary text-sm max-w-[350px] leading-relaxed mb-6">
            Rất xin lỗi vì sự cố này. Giao diện đang gặp chút vấn đề, bạn vui lòng tải lại trang nhé.
          </p>
          
          <button 
            onClick={() => window.location.href = '/'} 
            className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg px-6 py-3 transition-all cursor-pointer border-none"
          >
            Tải lại trang chủ
          </button>

          {/*Nút hiện chi tiết lỗi */}
          {process.env.NODE_ENV === 'development' && (
             <details className="mt-8 text-left bg-surface border border-border2 p-4 rounded-lg w-full max-w-2xl overflow-auto text-xs text-red-400">
               <summary className="cursor-pointer mb-2 font-semibold">Xem chi tiết lỗi (Chỉ hiển thị ở chế độ Dev)</summary>
               <pre>{this.state.error?.toString()}</pre>
             </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}