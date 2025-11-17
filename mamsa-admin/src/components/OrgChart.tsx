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
          imageSize: 'h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-40 lg:w-40',
          nameSize: 'text-lg sm:text-xl md:text-2xl',
          positionSize: 'text-sm sm:text-base',
          sectionTitle: 'Executive Leadership',
        };
      case 1: // Vice President, Secretary General
        return {
          container: 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300',
          card: 'bg-white border-2 border-blue-400 shadow-lg',
          text: 'text-blue-700',
          name: 'text-blue-900',
          imageSize: 'h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32',
          nameSize: 'text-base sm:text-lg md:text-xl',
          positionSize: 'text-sm',
          sectionTitle: 'Senior Leadership',
        };
      case 2: // Ministers, Directors
        return {
          container: 'bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300',
          card: 'bg-white border-2 border-purple-400 shadow-md',
          text: 'text-purple-700',
          name: 'text-purple-900',
          imageSize: 'h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28',
          nameSize: 'text-sm sm:text-base md:text-lg',
          positionSize: 'text-xs sm:text-sm',
          sectionTitle: 'Ministers & Directors',
        };
      case 3: // Representatives, Officers
        return {
          container: 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300',
          card: 'bg-white border-2 border-amber-400 shadow-sm',
          text: 'text-amber-700',
          name: 'text-amber-900',
          imageSize: 'h-20 w-20 sm:h-24 sm:w-24 md:h-24 md:w-24',
          nameSize: 'text-sm sm:text-base',
          positionSize: 'text-xs',
          sectionTitle: 'Representatives & Officers',
        };
      default: // Others
        return {
          container: 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300',
          card: 'bg-white border-2 border-gray-400 shadow-sm',
          text: 'text-gray-700',
          name: 'text-gray-900',
          imageSize: 'h-16 w-16 sm:h-20 sm:w-20 md:h-20 md:w-20',
          nameSize: 'text-sm',
          positionSize: 'text-xs',
          sectionTitle: 'Team Members',
        };
    }
  };

  const renderLeaderCard = (leader: Leader, level: number) => {
    const styles = getLevelStyles(level);
    
    return (
      <div
        key={leader.id}
        className={`${styles.card} rounded-xl p-4 sm:p-5 md:p-6 transition-all hover:scale-105 hover:shadow-xl flex flex-col items-center w-full max-w-[200px] sm:max-w-[220px] md:max-w-[240px]`}
      >
        {/* Circular Profile Image */}
        <div className={`relative mx-auto mb-3 sm:mb-4 overflow-hidden rounded-full bg-gray-100 border-2 border-white shadow-lg ${styles.imageSize}`}>
          {leader.image_url ? (
            <img
              src={leader.image_url}
              alt={leader.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 font-semibold ${styles.text} ${
              level === 0 ? 'text-2xl sm:text-3xl' : 
              level <= 2 ? 'text-xl sm:text-2xl' : 
              'text-lg sm:text-xl'
            }`}>
              {leader.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className={`${styles.name} text-center mb-2 font-bold line-clamp-2 leading-tight ${styles.nameSize}`}>
          {leader.name}
        </h3>

        {/* Position */}
        <p className={`${styles.text} font-semibold text-center line-clamp-2 leading-tight ${styles.positionSize}`}>
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
      <div key={level} className="w-full mb-6 sm:mb-8 md:mb-12">
        {/* Section Header - Only on larger screens */}
        <div className="hidden md:block mb-6">
          <div className={`inline-block px-4 py-2 rounded-lg ${styles.container}`}>
            <h2 className={`${styles.text} font-bold text-lg md:text-xl`}>
              {styles.sectionTitle}
            </h2>
          </div>
        </div>

        {/* Mobile: Vertical list with clear hierarchy */}
        <div className="md:hidden space-y-4">
          {/* Mobile Section Header */}
          <div className={`px-4 py-2 rounded-lg ${styles.container} mb-4`}>
            <h2 className={`${styles.text} font-bold text-base`}>
              {styles.sectionTitle}
            </h2>
          </div>
          
          {/* Leader Cards */}
          <div className="flex flex-col items-center space-y-4 px-2">
            {leaders.map(leader => renderLeaderCard(leader, level))}
          </div>
        </div>

        {/* Desktop: Horizontal tiered layout */}
        <div className="hidden md:block">
          <div className="flex flex-wrap justify-center items-start gap-4 md:gap-6 lg:gap-8">
            {leaders.map(leader => renderLeaderCard(leader, level))}
          </div>
        </div>

        {/* Connecting line between levels (desktop only) */}
        {!isLastLevel && (
          <div className="hidden md:flex justify-center mt-6 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full"></div>
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
