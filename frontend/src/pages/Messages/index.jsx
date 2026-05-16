import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import { useInbox } from '../../hooks/useMessages';
import { getStoredUser } from '../../utils/helpers';
import ConversationSidebar from './ConversationSidebar';
import ChatWindow from './ChatWindow';
import { ChatBubbleIcon } from '../../icons/MessageIcons';
import { useTheme } from '../../contexts/ThemeContext';

/* ── Empty State ── */
function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: 'var(--vt-text-invisible)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'var(--vt-input)', border: '1px solid var(--color-border)' }}>
                <ChatBubbleIcon size={32} color="var(--vt-text-ghost)" />
            </div>
            <div className="text-center">
                <p className="text-[14px] font-body font-semibold mb-1" style={{ color: 'var(--vt-text-disabled)' }}>Chọn một cuộc trò chuyện</p>
                <p className="text-[12px] font-body" style={{ color: 'var(--vt-text-invisible)' }}>hoặc bắt đầu chat từ trang hồ sơ của người dùng</p>
            </div>
        </div>
    );
}

/* ── Main MessagesPage ── */
export default function MessagesPage() {
    const { isDark } = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();
    const me = getStoredUser();
    const { conversations, loading, refresh } = useInbox();
    const [activeUsername, setActiveUsername] = useState(searchParams.get('u') || null);
    const [searchQuery, setSearchQuery] = useState('');

    // Khi mở từ URL ?u=username
    const [fetchedPartner, setFetchedPartner] = useState(null);

    useEffect(() => {
        const u = searchParams.get('u');
        if (u) {
            setActiveUsername(u);
            const existing = conversations.find(c => c.partnerUsername === u);
            if (!existing) {
                setFetchedPartner(null); // Xóa dữ liệu cũ trước khi tải
                import('../../services/userService').then(({ getUserProfile }) => {
                    getUserProfile(u).then(res => {
                        const user = res.data.user;
                        setFetchedPartner({
                            partnerId: user.id,
                            partnerUsername: user.username,
                            partnerFullname: user.fullName,
                            anh_dai_dien: user.anh_dai_dien,
                            initials: user.initials
                        });
                    }).catch(console.error);
                });
            } else {
                setFetchedPartner(null);
            }
        } else {
            setActiveUsername(null);
        }
    }, [searchParams, conversations]);

    const activeConv = conversations.find(c => c.partnerUsername === activeUsername) || fetchedPartner;


    const handleSelect = (username) => {
        setSearchParams({ u: username }, { replace: true });
        refresh();
    };

    return (
        <PageLayout noPadding>
            <div className="flex h-full overflow-hidden">

                {/* ── Sidebar: Danh sách conversations ── */}
                <div className={`flex flex-col shrink-0 transition-all
                    ${activeUsername ? 'w-0 md:w-[320px] overflow-hidden' : 'w-full md:w-[320px]'}`}
                    style={{
                        borderRight: `1px solid var(--vt-divider)`,
                        background: isDark ? '#0d0d18' : '#fafafe',
                    }}>
                    <ConversationSidebar
                        conversations={conversations}
                        loading={loading}
                        activeUsername={activeUsername}
                        myId={me?.id}
                        onSelect={handleSelect}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                </div>

                {/* ── Chat area ── */}
                <div className={`flex-1 flex flex-col overflow-hidden
                    ${activeUsername ? 'flex' : 'hidden md:flex'}`}
                    style={{ background: isDark ? '#08080f' : '#f8f8fc' }}>
                    {activeUsername ? (
                        <ChatWindow
                            key={activeUsername}
                            partnerUsername={activeUsername}
                            partnerInfo={activeConv}
                            onBack={() => setActiveUsername(null)}
                        />
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
