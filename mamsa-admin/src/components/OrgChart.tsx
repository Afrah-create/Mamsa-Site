'use client';

import { Leader } from '@/lib/public-content';
import { useMemo } from 'react';

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

  // Get level styling
  const getLevelStyles = (level: number) => {
    switch (level) {
      case 0: // President
        return {
          container: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-400',
          card: 'bg-white border-2 border-emerald-500 shadow-xl',
          text: 'text-emerald-700',
          name: 'text-emerald-900',
          imageSize: 'h-16 w-16 sm:h-16 sm:w-16 md:h-20 md:w-20',
          nameSize: 'text-xs sm:text-sm md:text-base',
          positionSize: 'text-xs',
        };
      case 1: // Vice President, Secretary General
        return {
          container: 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300',
          card: 'bg-white border-2 border-blue-400 shadow-lg',
          text: 'text-blue-700',
          name: 'text-blue-900',
          imageSize: 'h-14 w-14 sm:h-16 sm:w-16 md:h-16 md:w-16',
          nameSize: 'text-xs sm:text-xs md:text-sm',
          positionSize: 'text-xs',
        };
      case 2: // Ministers, Directors
        return {
          container: 'bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300',
          card: 'bg-white border-2 border-purple-400 shadow-md',
          text: 'text-purple-700',
          name: 'text-purple-900',
          imageSize: 'h-14 w-14 sm:h-14 sm:w-14 md:h-16 md:w-16',
          nameSize: 'text-xs',
          positionSize: 'text-xs',
        };
      case 3: // Representatives, Officers
        return {
          container: 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300',
          card: 'bg-white border-2 border-amber-400 shadow-sm',
          text: 'text-amber-700',
          name: 'text-amber-900',
          imageSize: 'h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16',
          nameSize: 'text-xs',
          positionSize: 'text-xs',
        };
      default: // Others
        return {
          container: 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300',
          card: 'bg-white border-2 border-gray-400 shadow-sm',
          text: 'text-gray-700',
          name: 'text-gray-900',
          imageSize: 'h-12 w-12 sm:h-12 sm:w-12 md:h-14 md:w-14',
          nameSize: 'text-xs',
          positionSize: 'text-xs',
        };
    }
  };

  const renderLeaderCard = (leader: Leader, level: number) => {
    const styles = getLevelStyles(level);
    
    return (
      <div
        key={leader.id}
        className={`${styles.card} rounded-lg p-2 sm:p-2.5 md:p-3 transition-all hover:scale-105 hover:shadow-xl flex flex-col items-center flex-shrink-0 w-[100px] sm:w-[110px] md:w-[130px]`}
      >
        {/* Circular Profile Image */}
        <div className={`relative mx-auto mb-1.5 sm:mb-2 overflow-hidden rounded-full bg-gray-100 border-2 border-white shadow-md ${styles.imageSize}`}>
          {leader.image_url ? (
            <img
              src={leader.image_url}
              alt={leader.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 font-semibold ${styles.text} ${
              level === 0 ? 'text-lg sm:text-xl' : 
              level <= 2 ? 'text-base sm:text-lg' : 
              'text-sm sm:text-base'
            }`}>
              {leader.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className={`${styles.name} text-center mb-0.5 font-bold line-clamp-2 leading-tight ${styles.nameSize}`}>
          {leader.name}
        </h3>

        {/* Position */}
        <p className={`${styles.text} font-medium text-center line-clamp-2 leading-tight ${styles.positionSize}`}>
          {leader.position || 'Member'}
        </p>
      </div>
    );
  };

  const renderLevel = (level: number, leaders: Leader[]) => {
    const styles = getLevelStyles(level);
    const sortedLevels = Array.from(groupedLeaders.keys()).sort((a, b) => a - b);
    const isLastLevel = level === sortedLevels[sortedLevels.length - 1];

    return (
      <div key={level} className="w-full mb-3 sm:mb-4 md:mb-6">
        {/* Horizontal layout for all screen sizes */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-3 md:gap-4 px-2 sm:px-4 md:px-6 pb-2">
          <div className="flex flex-nowrap justify-start items-start gap-2 sm:gap-3 md:gap-4 min-w-max">
            {leaders.map(leader => renderLeaderCard(leader, level))}
          </div>
        </div>

        {/* Connecting line between levels */}
        {!isLastLevel && (
          <div className="flex justify-center mt-3 mb-3">
            <div className="w-1 h-4 sm:h-5 md:h-6 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full"></div>
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
    <div className="w-full py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {sortedLevels.map(level => renderLevel(level, groupedLeaders.get(level)!))}
      </div>
    </div>
  );
}
