import React, { useState } from 'react';
import { syncContacts, followUser, unfollowUser } from '../../services/userService';
import { useToast } from '../ui/Toast';
import { toggleFollowing } from '../../utils/following';

export default function ContactSyncModal({ onClose }) {
  const { showSuccess, showError, showWarning } = useToast();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [followStates, setFollowStates] = useState({}); // { userId: boolean }

  const handleSync = async () => {
    // Tách các số điện thoại từ text đầu vào
    const rawPhones = inputText
      .split(/[\n,;\s]+/)
      .map(p => p.trim())
      .filter(p => p.length >= 8); // Chỉ lấy chuỗi có độ dài hợp lệ của SĐT

    if (rawPhones.length === 0) {
      showWarning('Thiếu thông tin', 'Vui lòng nhập ít nhất một số điện thoại hợp lệ');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await syncContacts(rawPhones);
      const matchedUsers = res.data.users || [];
      setUsers(matchedUsers);

      // Cập nhật trạng thái follow ban đầu
      const initialStates = {};
      matchedUsers.forEach(u => {
        initialStates[u.id] = u.isFollowing;
      });
      setFollowStates(initialStates);

      if (matchedUsers.length === 0) {
        showSuccess('Tìm kiếm hoàn tất', 'Không tìm thấy người dùng nào trong danh bạ');
      } else {
        showSuccess('Thành công!', `Tìm thấy ${matchedUsers.length} người dùng từ danh bạ`);
      }
    } catch (err) {
      console.error('Lỗi đồng bộ danh bạ:', err);
      showError('Lỗi', 'Không thể đồng bộ danh bạ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (user) => {
    const isCurrentlyFollowing = followStates[user.id];
    const username = user.username || user.ten_dang_nhap;

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(username);
        setFollowStates(prev => ({ ...prev, [user.id]: false }));
        toggleFollowing(user.id, false);
      } else {
        await followUser(username);
        setFollowStates(prev => ({ ...prev, [user.id]: true }));
        toggleFollowing(user.id, true);
      }
    } catch (err) {
      showError('Thao tác thất bại', err.response?.data?.message || 'Không thể thực hiện follow');
    }
  };

  // Nạp danh bạ mẫu (Mock Contacts) để người dùng tiện test
  const handleLoadMockContacts = () => {
    setInputText('0912345678, 0987654321, 0905556666, 0388889999');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[500px] bg-[#121212] rounded-2xl border border-[#2a2a2a] shadow-2xl flex flex-col max-h-[85vh] animate-fade-in text-white font-body">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a2a] shrink-0">
          <h3 className="text-[17px] font-semibold">Tìm bạn qua Danh bạ</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#2a2a2a] hover:bg-[#333] border-none cursor-pointer flex items-center justify-center text-[#888] hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">
          
          {/* Nhập liệu danh bạ */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] text-[#888] font-semibold">Nhập danh sách số điện thoại</label>
              <button
                onClick={handleLoadMockContacts}
                className="text-[12px] text-[#ff2d78] bg-transparent border-none cursor-pointer hover:underline font-medium"
              >
                + Sử dụng danh bạ mẫu để test
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập các số điện thoại cách nhau bằng dấu phẩy hoặc xuống dòng..."
              rows={4}
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-[14px] outline-none focus:border-[#444] transition-colors resize-none placeholder:text-[#555] leading-relaxed"
            />
            <p className="text-[11px] text-[#666] leading-relaxed">
              * Hệ thống sẽ đối sánh các số điện thoại này với cơ sở dữ liệu để tìm ra tài khoản bạn bè tương ứng trên VibeTok.
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={loading || !inputText.trim()}
            className="w-full py-3 rounded-lg bg-brand-gradient text-white text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Đang tìm kiếm...' : 'Tìm bạn bè'}
          </button>

          {/* Hiển thị kết quả gợi ý */}
          {hasSearched && (
            <div className="flex flex-col gap-3 border-t border-[#2a2a2a] pt-4 flex-1 overflow-auto">
              <h4 className="text-[13px] text-[#888] font-semibold">
                {users.length > 0 ? `Kết quả đề xuất (${users.length})` : 'Không tìm thấy kết quả phù hợp'}
              </h4>
              
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[220px] pr-1">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <div className="w-[42px] h-[42px] rounded-full bg-brand-gradient flex items-center justify-center font-bold text-white overflow-hidden text-sm">
                        {u.anh_dai_dien ? (
                          <img src={u.anh_dai_dien} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          u.initials || u.fullName?.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-white line-clamp-1">{u.fullName}</span>
                        <span className="text-[12px] text-[#888] line-clamp-1">@{u.username}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleFollowToggle(u)}
                      className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all border
                        ${followStates[u.id]
                          ? 'bg-transparent border-[#333] text-[#aaa] hover:border-[#555] hover:text-white'
                          : 'bg-white border-transparent text-black hover:bg-[#eee]'
                        }`}
                    >
                      {followStates[u.id] ? 'Đang follow' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#2a2a2a] px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-transparent border border-[#333] text-[#aaa] text-[13px] font-semibold cursor-pointer hover:border-[#555] hover:text-white transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
