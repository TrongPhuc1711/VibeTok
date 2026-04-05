import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-base flex flex-col items-center justify-center px-5 font-body">
            {/* Decorative rings */}
            {[360, 260, 180].map((s, i) => (
                <div
                    key={s}
                    className="absolute rounded-full border border-primary/[0.08] pointer-events-none"
                    style={{ width: s, height: s, opacity: 1 - i * 0.25 }}
                />
            ))}

            <div className="relative z-10 text-center flex flex-col items-center gap-4">
                <div className="font-display font-extrabold text-[96px] leading-none text-primary opacity-20 select-none">
                    404
                </div>

                <div className="-mt-8">
                    <h1 className="font-display font-bold text-[28px] text-white mb-2">
                        Trang không tồn tại
                    </h1>
                    <p className="text-text-faint text-sm max-w-[320px] leading-relaxed">
                        Trang bạn đang tìm kiếm đã bị xóa, đổi tên, hoặc chưa bao giờ tồn tại.
                    </p>
                </div>

                <div className="flex gap-3 mt-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-5 py-2.5 rounded-lg border border-border2 text-text-secondary text-sm font-body cursor-pointer bg-transparent hover:border-primary/40 hover:text-white transition-colors"
                    >
                        ← Quay lại
                    </button>
                    <button
                        onClick={() => navigate(ROUTES.HOME)}
                        className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold font-body cursor-pointer border-none hover:bg-primary/90 transition-colors"
                    >
                        Về trang chủ
                    </button>
                </div>

                <p className="text-text-dim text-xs mt-4">
                    Bạn có thể{' '}
                    <span
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => navigate(ROUTES.EXPLORE)}
                    >
                        khám phá nội dung
                    </span>
                    {' '}hoặc{' '}
                    <span
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => navigate(ROUTES.HOME)}
                    >
                        xem feed
                    </span>
                </p>
            </div>
        </div>
    );
}