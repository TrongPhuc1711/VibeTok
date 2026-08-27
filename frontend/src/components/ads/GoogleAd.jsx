import React, { useEffect } from 'react';


export default function GoogleAd({
  slot,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block', margin: '16px auto', textAlign: 'center' }
}) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('AdSense render warning:', err);
    }
  }, []);

  if (!slot) return null;

  return (
    <div className="adsense-wrapper overflow-hidden my-4 max-w-full flex justify-center">
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-9294440558776652"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
