import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import { useInbox } from '../../hooks/useMessages';
import { useCall } from '../../hooks/useCall';
import { getStoredUser } from '../../utils/helpers';
import ConversationSidebar from './ConversationSidebar';
import ChatWindow from './ChatWindow';
import IncomingCallBanner from './IncomingCallBanner';
import { ChatBubbleIcon } from '../../icons/MessageIcons';

/* ── Empty State ── */
function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#333]">
            <div className="w-20 h-20 rounded-full bg-[#111120] border border-[#1e1e2e] flex items-center justify-center">
                <ChatBubbleIcon size={32} color="#444" />
            </div>
            <div className="text-center">
                <p className="text-[#555] text-[14px] font-body font-semibold mb-1">Chọn một cuộc trò chuyện</p>
                <p className="text-[#333] text-[12px] font-body">hoặc bắt đầu chat từ trang hồ sơ của người dùng</p>
            </div>
        </div>
    );
}

/* ── Main MessagesPage ── */
export default function MessagesPage() {
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

    // Global incoming call (hiện ở mọi trang)
    const globalCall = useCall({
        partnerId: activeConv?.partnerId,
        partnerInfo: activeConv,
    });

    const handleSelect = (username) => {
        setSearchParams({ u: username }, { replace: true });
        refresh();
    };

    return (
        <PageLayout noPadding>
            <div className="flex h-full overflow-hidden">

                {/* ── Sidebar: Danh sách conversations ── */}
                <div className={`flex flex-col border-r border-[#1a1a2a] bg-[#0d0d18] transition-all shrink-0
                    ${activeUsername ? 'w-0 md:w-[320px] overflow-hidden' : 'w-full md:w-[320px]'}`}>
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
                <div className={`flex-1 flex flex-col overflow-hidden bg-[#08080f]
                    ${activeUsername ? 'flex' : 'hidden md:flex'}`}>
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

            {/* ── Incoming call banner (global) ── */}
            {globalCall.incomingCall && (
                <IncomingCallBanner
                    incomingCall={globalCall.incomingCall}
                    onAccept={globalCall.acceptCall}
                    onReject={globalCall.rejectCall}
                />
            )}
        </PageLayout>
    );
}
