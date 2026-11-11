import React, { useState } from 'react';
import { Play, Video, X } from 'lucide-react';
import { VideoItem } from '../types/news';
import { useLanguage } from '../context/LanguageContext';

interface VideoSectionProps {
  videos: VideoItem[];
}

export const VideoSection: React.FC<VideoSectionProps> = ({ videos }) => {
  const { lang, t } = useLanguage();
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  if (videos.length === 0) return null;

  const featured = videos.find(v => v.is_featured) || videos[0];
  const list = videos.filter(v => v.id !== featured.id);

  return (
    <section className="rounded-lg bg-[#0F172A] p-6 text-white shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3 mb-5">
        <Video className="h-5 w-5 text-red-500" />
        <h3 className="text-xl font-bold font-serif uppercase tracking-wide text-white">
          {t('video_news')}
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Video Highlight */}
        <div
          onClick={() => setSelectedVideo(featured)}
          className="group relative cursor-pointer lg:col-span-8 overflow-hidden rounded-lg bg-black"
        >
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={`https://img.youtube.com/vi/${featured.youtube_id}/hqdefault.jpg`}
              alt={lang === 'bn' ? featured.title_bn : featured.title_en}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/assets/images/news_world_summit_1793801922828.jpg';
              }}
              className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-95"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 fill-white translate-x-0.5" />
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              {featured.category}
            </span>
            <h4 className="mt-1 text-base sm:text-lg font-bold font-serif leading-snug text-white">
              {lang === 'bn' ? featured.title_bn : featured.title_en}
            </h4>
          </div>
        </div>

        {/* Video List */}
        <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
          {list.slice(0, 3).map(vid => (
            <div
              key={vid.id}
              onClick={() => setSelectedVideo(vid)}
              className="group flex cursor-pointer gap-3 rounded bg-slate-800/60 p-2.5 transition-colors hover:bg-slate-800"
            >
              <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded bg-black">
                <img
                  src={`https://img.youtube.com/vi/${vid.youtube_id}/mqdefault.jpg`}
                  alt={lang === 'bn' ? vid.title_bn : vid.title_en}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/news_tech_ai_chip_1793801922448.jpg';
                  }}
                  className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-4 w-4 fill-white text-white opacity-90" />
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <h5 className="text-xs font-semibold font-serif text-slate-200 line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                  {lang === 'bn' ? vid.title_bn : vid.title_en}
                </h5>
                <span className="mt-1 text-[10px] text-slate-400 uppercase tracking-wider">
                  {vid.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl rounded-xl bg-slate-900 p-2 shadow-2xl">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-10 right-0 flex items-center gap-1 text-white hover:text-red-400 transition-colors"
            >
              <X className="h-6 w-6" />
              <span className="text-xs font-semibold">CLOSE</span>
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtube_id}?autoplay=1`}
                title={lang === 'bn' ? selectedVideo.title_bn : selectedVideo.title_en}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
