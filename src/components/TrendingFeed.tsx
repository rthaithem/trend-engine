import React, { useState, useMemo } from 'react';
import { TrendingTopic } from '../services/intelligenceService';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TrendingFeedProps {
  topics: TrendingTopic[];
  onSelect: (topic: string) => void;
  isLoading: boolean;
  isAr?: boolean;
}

export default function TrendingFeed({ topics, onSelect, isLoading, isAr = true }: TrendingFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(topics.map(t => t.category))).filter(Boolean);
  }, [topics]);

  const filteredTopics = useMemo(() => {
    if (!selectedCategory) return topics;
    return topics.filter(t => t.category === selectedCategory);
  }, [topics, selectedCategory]);

  // Reset selected category if it no longer exists in the new topics
  React.useEffect(() => {
    if (selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [categories, selectedCategory]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex flex-col gap-2">
            <div className="h-4 bg-border-dim rounded w-3/4" />
            <div className="h-3 bg-border-dim rounded w-1/2 opacity-50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {categories.length > 0 && (
        <div className="p-3 border-b border-[#27272a] flex flex-wrap gap-1.5 bg-[#161618]/90 sticky top-0 z-10 backdrop-blur-md">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-bold rounded-full transition-all uppercase tracking-wider",
              selectedCategory === null 
                ? "bg-accent-green text-black shadow-[0_0_10px_rgba(57,255,20,0.3)]" 
                : "bg-[#18181b] text-[#71717a] hover:text-[#e4e4e7] border border-border-dim hover:border-[#52525b]"
            )}
          >
            {isAr ? "الكل" : "All"}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded-full transition-all uppercase tracking-wider",
                selectedCategory === cat 
                  ? "bg-accent-green text-black shadow-[0_0_10px_rgba(57,255,20,0.3)]" 
                  : "bg-[#18181b] text-[#71717a] hover:text-[#e4e4e7] border border-border-dim hover:border-[#52525b]"
              )}
            >
              {cat.split(' (')[0]}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-2 p-3 overflow-y-auto custom-scrollbar flex-1">
        <AnimatePresence mode="popLayout">
          {filteredTopics.map((item, index) => (
            <motion.button
              layout
              key={item.topic}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              onClick={() => onSelect(item.topic)}
              className="w-full text-start p-3 transition-all hover:bg-[#18181b] group rounded border border-[#27272a] hover:border-[#52525b] flex flex-col gap-1.5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5" dir="ltr">
                  {item.sentiment === 'positive' && <ArrowUpRight className="w-3 h-3 text-accent-green" />}
                  {item.sentiment === 'negative' && <ArrowDownRight className="w-3 h-3 text-accent-red" />}
                  {item.sentiment === 'neutral' && <Minus className="w-3 h-3 text-accent-blue" />}
                  <span className="text-[10px] uppercase font-black text-[#52525b]">{item.category}</span>
                </div>
                <div className="flex items-center gap-1" dir="ltr">
                  <span className={cn(
                    "text-[10px] font-bold",
                    item.impactScore > 80 ? "text-accent-red" : "text-accent-green"
                  )}>
                    {item.impactScore}%
                  </span>
                  <Flame className={cn("w-3 h-3", item.impactScore > 80 ? "text-accent-red" : "text-accent-green")} />
                </div>
              </div>

              <div className="text-xs font-bold text-[#e4e4e7] group-hover:text-accent-green transition-colors leading-relaxed">
                {item.topic}
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {item.isFabricated ? (
                  <span className="text-[9px] bg-accent-red/10 text-accent-red px-1.5 py-0.5 rounded border border-accent-red/20 font-bold uppercase tracking-wider">
                    {isAr ? "مفتعل / مزيف" : "Fabricated / Fake"}
                  </span>
                ) : (
                  <span className="text-[9px] bg-accent-blue/10 text-accent-blue px-1.5 py-0.5 rounded border border-accent-blue/20 font-bold uppercase tracking-wider">
                    {isAr ? "طبيعي" : "Organic"}
                  </span>
                )}
                {item.country && (
                  <span className="text-[9px] bg-[#18181b] text-[#a1a1aa] px-1.5 py-0.5 rounded border border-border-dim font-bold uppercase tracking-wider">
                    {item.country}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-1 pt-2 border-t border-border-dim w-full" dir={isAr ? 'rtl' : 'ltr'}>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#71717a]">{isAr ? "مخاطر الفساد" : "Corruption Risk"}</span>
                <div className="w-16 h-1.5 bg-[#18181b] rounded-full overflow-hidden flex shrink-0">
                    <div 
                    className={cn(
                      "h-full", 
                      item.corruptionRisk > 75 ? "bg-accent-red" : item.corruptionRisk > 50 ? "bg-[#fbbf24]" : "bg-accent-green"
                    )} 
                    style={{ width: `${item.corruptionRisk || 1}%` }}
                  />
                </div>
              </div>
              
              <div className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-transparent via-accent-green/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
