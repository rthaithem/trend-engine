import React, { useEffect, useState } from 'react';
import { Rss, ExternalLink } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
}

interface LiveFeedProps {
  isAr?: boolean;
}

export default function LiveFeed({ isAr = true }: LiveFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const lang = isAr ? 'ar' : 'en';
    fetch(`/api/news?lang=${lang}`)
      .then(r => r.json())
      .then(data => {
        if(data.success && data.articles) {
          setNews(data.articles);
        }
      })
      .catch(e => console.error("Could not fetch RSS", e));
  }, [isAr]);

  if (news.length === 0) return null;

  return (
    <div className="bg-[#111111] border-b border-[#27272a] h-8 flex items-center px-4 overflow-hidden shrink-0" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2 h-full bg-accent-red/10 px-2 border-r border-[#27272a] shrink-0 z-10 shadow-[10px_0_10px_#111111]">
        <Rss className="w-3.5 h-3.5 text-accent-red animate-pulse" />
        <span className="text-[10px] font-bold text-accent-red uppercase tracking-widest whitespace-nowrap">
          {isAr ? 'أخبار حية (RSS)' : 'LIVE NEWS (RSS)'}
        </span>
      </div>
      <div className="flex-1 overflow-hidden relative h-full">
         <div className="flex items-center h-full animate-marquee whitespace-nowrap absolute inset-y-0" dir="ltr">
           {news.map((item, i) => (
             <a 
               href={item.link} 
               target="_blank" 
               rel="noreferrer"
               key={i} 
               className="text-[10px] text-[#a1a1aa] hover:text-[#f4f4f5] mx-8 flex items-center gap-1.5 transition-colors"
             >
               {item.title}
               <ExternalLink className="w-2.5 h-2.5 opacity-50" />
             </a>
           ))}
         </div>
      </div>
    </div>
  );
}
