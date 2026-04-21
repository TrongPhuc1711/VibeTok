import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageLayout from '../../components/layout/PageLayout/PageLayout';
import FormInput from '../../components/common/FormInput/FormInput';
import Button from '../../components/ui/Button';
import UserDropdown from '../../components/layout/UserDropdown/UserDropdown';
import DropZone from './DropZone';
import VideoPreview from './VideoPreview';
import SelectField from './SelectField';
import SoundPanel from './SoundPanel';

import { useUpload } from '../../hooks/useUpload';
import { VIDEO_PRIVACY_LABELS, DUET_LABELS, DUET_OPTIONS, ROUTES } from '../../utils/constants';
import { LocIcon } from '../../icons/CommonIcons';
import { useToast } from '../../components/ui/Toast';

export default function UploadPage() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  // Sound state
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [useOriginalSound, setUseOriginalSound] = useState(true);
  const [originalVolume, setOriginalVolume] = useState(1.0);
  const [musicVolume, setMusicVolume] = useState(0.5);

  const { form, file, errors, uploading, progress, setField, selectFile, submit } = useUpload({
    onSuccess: () => {
      showSuccess('Đăng video thành công! 🎬', 'Video của bạn đang được xử lý và sẽ hiển thị trên feed sớm nhất');
      setTimeout(() => navigate(ROUTES.HOME), 800);
    },
  });

  const handleMusicSelect = (track) => {
    if (!track) {
      setSelectedMusic(null);
      setField('music')(null);
      return;
    }
    setSelectedMusic(track);
    setField('music')(track);
    showInfo('Đã chọn nhạc nền', `${track.title} — ${track.artist}`);
    // Auto enable original sound if not set
    if (!useOriginalSound && file) setUseOriginalSound(true);
  };

  const handleFileSelect = (f) => {
    selectFile(f);
    if (f && f.type.startsWith('video/')) {
      setUseOriginalSound(true); // auto enable original sound
      showInfo('Đã chọn video', f.name);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (!file && !isDraft) {
      showWarning('Chưa chọn video', 'Vui lòng chọn file video trước khi đăng');
      return;
    }
    const ok = await submit(isDraft, {
      originalVolume: useOriginalSound ? originalVolume : 0,
      musicVolume
    });
    if (isDraft && ok) showSuccess('Đã lưu nháp', 'Video của bạn đã được lưu vào bản nháp');
    else if (!ok && errors.submit) showError('Đăng video thất bại', errors.submit);
  };

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
        <div>
          <h1 className="font-display font-bold text-[22px] text-white m-0">Đăng video mới</h1>
          {file && (
            <p className="text-text-faint text-[12px] font-body mt-0.5">
              {selectedMusic
                ? `${selectedMusic.title} · ${useOriginalSound ? 'Mix với âm gốc' : 'Chỉ nhạc nền'}`
                : useOriginalSound
                  ? 'Dùng âm thanh gốc từ video'
                  : 'Không có âm thanh'
              }
            </p>
          )}
        </div>
        <UserDropdown />
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — video + form */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-6 items-start">
            {/* Drop zone / preview */}
            <div className="shrink-0">
              {file
                ? <VideoPreview 
                    file={file} 
                    selectedMusic={selectedMusic}
                    originalVolume={originalVolume}
                    musicVolume={musicVolume}
                    useOriginalSound={useOriginalSound}
                  />
                : <DropZone error={errors.file} onSelect={handleFileSelect} />
              }
            </div>

            {/* Form */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Caption */}
              <div>
                <label className="block text-text-secondary text-[13px] font-medium mb-2 font-body">
                  Thông tin video
                </label>
                <div
                  className={`bg-elevated border rounded-lg overflow-hidden ${errors.caption ? 'border-primary' : 'border-border2'}`}
                >
                  <textarea
                    value={form.caption}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) setField('caption')(e.target.value);
                    }}
                    placeholder="Mô tả video, #hashtag..."
                    rows={3}
                    className="w-full bg-transparent border-none outline-none text-white text-[13px] font-body p-3.5 resize-none"
                  />
                  {form.caption && (
                    <div className="px-3.5 pb-2.5 flex flex-wrap gap-1.5">
                      {(form.caption.match(/#[\w]+/g) || []).map((tag) => (
                        <span
                          key={tag}
                          className="bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 text-primary text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={`px-3.5 pb-2.5 text-right text-[11px] ${form.caption.length > 450 ? 'text-primary' : 'text-text-subtle'}`}>
                    {form.caption.length}/500
                  </div>
                </div>
              </div>

              {/* Privacy + Duet */}
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Quyền xem"
                  value={form.privacy}
                  options={Object.entries(VIDEO_PRIVACY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                  onChange={setField('privacy')}
                />
                <SelectField
                  label="Cho phép"
                  value={
                    form.allowDuet && form.allowStitch ? 'both'
                    : form.allowDuet ? 'duet'
                    : form.allowStitch ? 'stitch' : 'none'
                  }
                  options={Object.entries(DUET_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                  onChange={(v) => {
                    setField('allowDuet')(v === DUET_OPTIONS.BOTH || v === DUET_OPTIONS.DUET);
                    setField('allowStitch')(v === DUET_OPTIONS.BOTH || v === DUET_OPTIONS.STITCH);
                  }}
                />
              </div>

              <FormInput
                label="Vị trí"
                value={form.location}
                onChange={setField('location')}
                placeholder="Đà Lạt, Lâm Đồng, Việt Nam"
                icon={<LocIcon />}
              />

              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Lên lịch đăng"
                  value={form.scheduleType || 'now'}
                  options={[
                    { value: 'now', label: 'Đăng ngay' },
                    { value: 'schedule', label: 'Lên lịch' },
                  ]}
                  onChange={setField('scheduleType')}
                />
                <SelectField
                  label="Thumbnail"
                  value={form.thumbnail || 'auto'}
                  options={[
                    { value: 'auto', label: 'Tự động' },
                    { value: 'custom', label: 'Tuỳ chỉnh' },
                  ]}
                  onChange={setField('thumbnail')}
                />
              </div>

              {/* Sound summary badge */}
              {file && (
                <div className="flex items-center gap-3 bg-elevated border border-border2 rounded-lg px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                    {selectedMusic ? (
                      <img src={selectedMusic.cover} alt="cover" className="w-full h-full object-cover" />
                    ) : useOriginalSound ? '📹' : '🔇'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[12px] font-semibold font-body m-0 truncate">
                      {selectedMusic
                        ? selectedMusic.title
                        : useOriginalSound
                          ? 'Âm thanh gốc từ video'
                          : 'Không có âm thanh'
                      }
                    </p>
                    <p className="text-text-faint text-[11px] font-body m-0 truncate">
                      {selectedMusic && useOriginalSound
                        ? `Video: ${Math.round(originalVolume * 100)}% · Nhạc: ${Math.round(musicVolume * 100)}%`
                        : selectedMusic
                          ? selectedMusic.artist
                          : useOriginalSound
                            ? 'Trích xuất từ video đã tải lên'
                            : 'Tắt âm thanh'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Upload progress */}
              {uploading && (
                <div>
                  <div className="h-1 bg-border rounded overflow-hidden">
                    <div
                      className="h-full bg-brand-gradient rounded transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-text-faint text-xs mt-1.5 font-body">
                    Đang đăng... {Math.round(progress)}%
                  </p>
                </div>
              )}

              {errors.submit && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2.5 text-primary text-[13px] font-body">
                  {errors.submit}
                </div>
              )}

              {/* Submit buttons */}
              <div className="flex gap-3 mt-1">
                <Button variant="ghost" onClick={() => handleSubmit(true)} disabled={uploading} className="flex-1">
                  Lưu nháp
                </Button>
                <Button onClick={() => handleSubmit(false)} loading={uploading} className="flex-[2]">
                  Đăng lên VibeTok
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Sound panel */}
        <SoundPanel
          videoFile={file}
          selectedMusic={selectedMusic}
          onMusicSelect={handleMusicSelect}
          originalVolume={originalVolume}
          musicVolume={musicVolume}
          onOriginalVolumeChange={setOriginalVolume}
          onMusicVolumeChange={setMusicVolume}
          useOriginalSound={useOriginalSound}
          onUseOriginalSoundChange={setUseOriginalSound}
        />
      </div>
    </PageLayout>
  );
}