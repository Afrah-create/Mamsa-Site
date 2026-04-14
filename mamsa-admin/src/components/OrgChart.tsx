'use client';

import { Leader } from '@/lib/public-content';
import { Mail, Phone, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppImage } from '@/components/ui/AppImage';
import { getInitials } from '@/lib/image-utils';

interface OrgChartProps {
  leaders: Leader[];
}

// Determine hierarchy level based on position title
function getHierarchyLevel(position: string | null): number {
  if (!position) return 4;
  const pos = position.toLowerCase();
  
  // Level 0 - Top level: President only
  if (pos.includes('president') && !pos.includes('vice')) {
    return 0;
  }
  
  // Level 1 - Second tier: Vice President, Secretary General
  if (pos.includes('vice president') || pos.includes('vice-president') || 
      pos.includes('secretary general') || pos.includes('secretary-general')) {
    return 1;
  }
  
  // Level 2 - Third tier: Ministers, Directors, Coordinators, Heads
  if (pos.includes('minister') || pos.includes('director') || 
      pos.includes('coordinator') || pos.includes('head') || 
      pos.includes('secretary') || pos.includes('treasurer')) {
    return 2;
  }
  
  // Level 3 - Fourth tier: Representatives, Officers
  if (pos.includes('representative') || pos.includes('rep') || 
      pos.includes('officer') || pos.includes('assistant')) {
    return 3;
  }
  
  // Level 4 - Fifth tier: Members, Others
  return 4;
}

// Group leaders by hierarchy level
function groupLeadersByLevel(leaders: Leader[]): Map<number, Leader[]> {
  const grouped = new Map<number, Leader[]>();
  
  leaders.forEach(leader => {
    const level = getHierarchyLevel(leader.position);
    if (!grouped.has(level)) {
      grouped.set(level, []);
    }
    grouped.get(level)!.push(leader);
  });
  
  // Sort each group by position name for consistency
  grouped.forEach((leaders, level) => {
    leaders.sort((a, b) => {
      // Sort by position name, then by name
      if (a.position && b.position) {
        return a.position.localeCompare(b.position);
      }
      return a.name.localeCompare(b.name);
    });
  });
  
  return grouped;
}

export default function OrgChart({ leaders }: OrgChartProps) {
  const groupedLeaders = useMemo(() => groupLeadersByLevel(leaders), [leaders]);
  const [activeLeaderId, setActiveLeaderId] = useState<number | null>(null);

  const activeLeader = useMemo(
    () => leaders.find((leader) => leader.id === activeLeaderId) ?? null,
    [leaders, activeLeaderId],
  );

  useEffect(() => {
    if (!activeLeader) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveLeaderId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeLeader]);

  // Get level styling
  const getLevelStyles = (level: number) => {
    switch (level) {
      case 0: // President
        return {
          card: 'bg-white border-2 border-emerald-500 shadow-md',
          text: 'text-emerald-700',
          name: 'text-emerald-900',
          imageSize: 'h-16 w-16 sm:h-16 sm:w-16 md:h-20 md:w-20',
          nameSize: 'text-xs sm:text-sm md:text-base',
          positionSize: 'text-[10px] sm:text-xs',
          cardWidth: 'w-[110px] sm:w-[125px] md:w-[140px]',
          padding: 'p-2 sm:p-2.5 md:p-3',
        };
      case 1: // Vice President, Secretary General
        return {
          card: 'bg-white border-2 border-blue-400 shadow-md',
          text: 'text-blue-700',
          name: 'text-blue-900',
          imageSize: 'h-14 w-14 sm:h-16 sm:w-16 md:h-16 md:w-16',
          nameSize: 'text-xs sm:text-sm',
          positionSize: 'text-[10px] sm:text-xs',
          cardWidth: 'w-[100px] sm:w-[115px] md:w-[130px]',
          padding: 'p-2 sm:p-2.5 md:p-3',
        };
      case 2: // Ministers, Directors
        return {
          card: 'bg-white border-2 border-purple-400 shadow-sm',
          text: 'text-purple-700',
          name: 'text-purple-900',
          imageSize: 'h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16',
          nameSize: 'text-[11px] sm:text-xs',
          positionSize: 'text-[10px]',
          cardWidth: 'w-[90px] sm:w-[105px] md:w-[120px]',
          padding: 'p-2 sm:p-2.5',
        };
      case 3: // Representatives, Officers
        return {
          card: 'bg-white border-2 border-amber-400 shadow-sm',
          text: 'text-amber-700',
          name: 'text-amber-900',
          imageSize: 'h-12 w-12 sm:h-12 sm:w-12 md:h-14 md:w-14',
          nameSize: 'text-[11px] sm:text-xs',
          positionSize: 'text-[10px]',
          cardWidth: 'w-[85px] sm:w-[100px] md:w-[115px]',
          padding: 'p-1.5 sm:p-2',
        };
      default: // Others
        return {
          card: 'bg-white border-2 border-gray-400 shadow-sm',
          text: 'text-gray-700',
          name: 'text-gray-900',
          imageSize: 'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14',
          nameSize: 'text-[11px]',
          positionSize: 'text-[10px]',
          cardWidth: 'w-[80px] sm:w-[95px] md:w-[110px]',
          padding: 'p-1.5 sm:p-2',
        };
    }
  };

  const renderLeaderCard = (leader: Leader, level: number) => {
    const styles = getLevelStyles(level);
    
    return (
      <button
        key={leader.id}
        type="button"
        onClick={() => setActiveLeaderId(leader.id)}
        className={`${styles.card} rounded-lg ${styles.padding} transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center ${styles.cardWidth} flex-shrink-0 group text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
      >
        {/* Circular Profile Image */}
        <div className={`relative mx-auto mb-1.5 sm:mb-2 overflow-hidden rounded-full bg-gray-100 border-2 border-white shadow-md group-hover:shadow-lg transition-all duration-300 ${styles.imageSize} ${
          level === 0 ? 'group-hover:ring-2 group-hover:ring-emerald-500/20' : 
          level === 1 ? 'group-hover:ring-2 group-hover:ring-blue-500/20' : 
          level === 2 ? 'group-hover:ring-2 group-hover:ring-purple-500/20' : 
          level === 3 ? 'group-hover:ring-2 group-hover:ring-amber-500/20' : 
          'group-hover:ring-2 group-hover:ring-gray-500/20'
        }`}>
          <AppImage
            src={leader.image_url}
            alt={leader.name || 'Leader'}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-110"
            fallback={
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 font-semibold ${styles.text} ${
                level === 0 ? 'text-base sm:text-lg md:text-xl' :
                level <= 2 ? 'text-sm sm:text-base md:text-lg' :
                'text-xs sm:text-sm md:text-base'
              }`}>
                {getInitials(leader.name)}
              </div>
            }
          />
        </div>

        {/* Name */}
        <h3 className={`${styles.name} text-center mb-0.5 font-bold line-clamp-2 leading-tight ${styles.nameSize}`}>
          {leader.name}
        </h3>

        {/* Position */}
        <p className={`${styles.text} font-medium text-center line-clamp-2 leading-tight ${styles.positionSize}`}>
          {leader.position || 'Member'}
        </p>
      </button>
    );
  };

  const renderLevel = (level: number, leaders: Leader[]) => {
    const sortedLevels = Array.from(groupedLeaders.keys()).sort((a, b) => a - b);
    const isLastLevel = level === sortedLevels[sortedLevels.length - 1];

    return (
      <div key={level} className="w-full flex flex-col items-center mb-3 sm:mb-4 md:mb-5">
        {/* Centered horizontal layout - pyramid structure */}
        <div className="flex flex-wrap justify-center items-start gap-2 sm:gap-2.5 md:gap-3 px-2 sm:px-3">
          {leaders.map((leader, index) => (
            <div
              key={leader.id}
              style={{
                animation: `fadeIn 0.3s ease-out ${index * 50}ms both`,
              }}
            >
              {renderLeaderCard(leader, level)}
            </div>
          ))}
        </div>

        {/* Connecting line between levels */}
        {!isLastLevel && (
          <div className="flex justify-center items-center mt-3 sm:mt-3.5 md:mt-4 mb-1.5">
            {/* Decorative connector */}
            <div className="relative flex flex-col items-center">
              {/* Main vertical line */}
              <div className="w-0.5 h-5 sm:h-6 md:h-7 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 rounded-full"></div>
              {/* Small decorative circle */}
              <div className="absolute -bottom-1 w-2 h-2 rounded-full bg-gray-300 border-2 border-white shadow-sm"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (leaders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No leadership members to display</p>
      </div>
    );
  }

  // Render levels in order (0, 1, 2, 3, 4)
  const sortedLevels = Array.from(groupedLeaders.keys()).sort((a, b) => a - b);

  return (
    <>
      <div className="w-full py-6 sm:py-8 md:py-10">
        {/* Subtle background with pattern */}
        <div className="relative bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(16, 185, 129) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Content */}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
            {sortedLevels.map(level => renderLevel(level, groupedLeaders.get(level)!))}
          </div>
        </div>
      </div>

      {activeLeader ? (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 p-3 sm:p-4"
          role="presentation"
          onClick={() => setActiveLeaderId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeLeader.name}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[84vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setActiveLeaderId(null)}
              aria-label="Close leader details"
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/75"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-4 p-4 sm:grid-cols-[180px,1fr] sm:gap-5 sm:p-5">
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="relative h-[220px] w-full bg-gray-100 sm:h-[250px]">
                  <AppImage
                    src={activeLeader.image_url}
                    alt={activeLeader.name}
                    className="h-full w-full object-cover object-top"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                        <UserRound className="h-12 w-12" />
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{activeLeader.name}</h3>
                  <p className="mt-1 text-sm font-medium text-emerald-700">{activeLeader.position || 'Leadership Team'}</p>
                  {activeLeader.department ? (
                    <p className="mt-1 text-xs text-gray-500">Department: {activeLeader.department}</p>
                  ) : null}
                </div>

                {activeLeader.bio ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Profile</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">{activeLeader.bio}</p>
                  </div>
                ) : null}

                {(activeLeader.email || activeLeader.phone) ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Available links</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeLeader.email ? (
                        <a
                          href={`mailto:${activeLeader.email}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </a>
                      ) : null}
                      {activeLeader.phone ? (
                        <a
                          href={`tel:${activeLeader.phone}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Phone
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
