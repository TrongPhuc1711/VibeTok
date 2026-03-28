import React from 'react';
import { VideoSearchIcon } from '../../../icons/CommonIcons';

const TABS = ['Following', 'For You', 'Live'];
/*
  VideoCardTopBar — tab "Following / For You / Live" + search button
  Props:
   activeTab  – string (mặc định 'For You')
   onTabChange – (tab: string) => void
 */
export default function VideoCardTopBar({ activeTab = 'For You', onTabChange }) {
  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 pb-10 z-10"
      style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,.5),transparent)' }}
    >
      <div className="flex gap-5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange?.(tab)}
            className={`
              bg-transparent border-none font-body text-[15px] cursor-pointer pb-1 transition-all
              ${tab === activeTab
                ? 'text-white font-bold border-b-2 border-white'
                : 'text-white/50 font-normal'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      <button className="bg-transparent border-none cursor-pointer p-0">
        <VideoSearchIcon />
      </button>
    </div>
  );
}