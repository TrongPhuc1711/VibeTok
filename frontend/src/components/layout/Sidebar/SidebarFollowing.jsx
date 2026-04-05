import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/api';
import { getStoredUser } from '../../../utils/helpers';

export default function SidebarFollowing() {
    const navigate = useNavigate();
    const me       = getStoredUser();
    const [users,   setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!me?.username) { setLoading(false); return; }

        // ✅ Lấy danh sách người mình đang follow từ API thật
        api.get(`/users/${me.username}/following`, { params: { limit: 10 } })
            .then(res => setUsers(res.data.users || []))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    }, [me?.username]);

    if (loading) {
        return (
            <div>
                <div className="px-5 pt-3 pb-1">
                    <div className="h-px bg-border" />
                    <p className="text-[11px] text-text-subtle tracking-[0.5px] mt-2.5 mb-1 font-body">
                        ĐANG THEO DÕI
                    </p>
                </div>
                {/* Skeleton */}
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2.5 px-5 py-2 animate-pulse">
                        <div className="w-[26px] h-[26px] rounded-full bg-border2 shrink-0" />
                        <div className="h-2.5 w-24 rounded bg-border2" />
                    </div>
                ))}
            </div>
        );
    }

    if (!users.length) return null;

    return (
        <div>
            <div className="px-5 pt-3 pb-1">
                <div className="h-px bg-border" />
                <p className="text-[11px] text-text-subtle tracking-[0.5px] mt-2.5 mb-1 font-body">
                    ĐANG THEO DÕI
                </p>
            </div>

            {users.map((user) => (
                <button
                    key={user.id}
                    onClick={() => navigate(`/profile/${user.username}`)}
                    className="flex items-center gap-2.5 w-full px-5 py-2 border-none bg-transparent cursor-pointer hover:bg-white/5 transition-colors"
                >
                    {/* Avatar */}
                    <div
                        className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
                    >
                        {user.anh_dai_dien ? (
                            <img
                                src={user.anh_dai_dien}
                                alt={user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user.initials || user.fullName?.[0]?.toUpperCase() || 'U'
                        )}
                    </div>

                    <span className="font-body text-[13px] text-text-secondary flex-1 text-left truncate">
                        @{user.username}
                    </span>

                    {/* Có thể thêm "LIVE" badge nếu backend hỗ trợ sau */}
                </button>
            ))}
        </div>
    );
}