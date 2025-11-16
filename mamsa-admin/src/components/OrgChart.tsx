'use client';

import { Leader } from '@/lib/public-content';
import { useMemo } from 'react';

interface OrgChartProps {
  leaders: Leader[];
}

interface HierarchyNode {
  leader: Leader;
  children: HierarchyNode[];
  level: number;
}

// Determine hierarchy level based on position title
function getHierarchyLevel(position: string | null): number {
  if (!position) return 3;
  const pos = position.toLowerCase();
  
  // Top level - Board, President, Chair, Executive
  if (pos.includes('board') || pos.includes('president') || pos.includes('chair') || pos.includes('executive') || pos.includes('ceo')) {
    return 0;
  }
  
  // Second level - Directors, Vice Presidents, Coordinators
  if (pos.includes('director') || pos.includes('vice') || pos.includes('coordinator') || pos.includes('head') || pos.includes('chief')) {
    return 1;
  }
  
  // Third level - Managers, Officers, Secretaries
  if (pos.includes('manager') || pos.includes('officer') || pos.includes('secretary') || pos.includes('treasurer') || pos.includes('minister')) {
    return 2;
  }
  
  // Fourth level - Specialists, Members, Assistants
  return 3;
}

// Build hierarchy tree from flat list
function buildHierarchy(leaders: Leader[]): HierarchyNode[] {
  // Sort by hierarchy level and then by order_position
  const sorted = [...leaders].sort((a, b) => {
    const levelA = getHierarchyLevel(a.position);
    const levelB = getHierarchyLevel(b.position);
    if (levelA !== levelB) return levelA - levelB;
    // If same level, maintain original order
    return 0;
  });

  const nodes: HierarchyNode[] = sorted.map(leader => ({
    leader,
    children: [],
    level: getHierarchyLevel(leader.position),
  }));

  // Build parent-child relationships based on department and level
  const rootNodes: HierarchyNode[] = [];
  
  nodes.forEach(node => {
    if (node.level === 0) {
      rootNodes.push(node);
    } else {
      // Find parent (closest node one level above in same department)
      const parent = nodes.find(p => 
        p.level === node.level - 1 && 
        (p.leader.department === node.leader.department || !node.leader.department || !p.leader.department)
      );
      
      if (parent) {
        parent.children.push(node);
      } else {
        // If no parent found, add to root
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}

export default function OrgChart({ leaders }: OrgChartProps) {
  const hierarchy = useMemo(() => buildHierarchy(leaders), [leaders]);

  const renderNode = (node: HierarchyNode, index: number, total: number, isRoot: boolean = false) => {
    const { leader, children } = node;
    const hasChildren = children.length > 0;
    const level = node.level;

    // Determine box styling based on level
    const boxClasses = level === 0
      ? 'bg-white border-2 border-emerald-600 shadow-lg'
      : level === 1
      ? 'bg-blue-50 border-2 border-blue-400 shadow-md'
      : 'bg-emerald-50 border border-emerald-300 shadow-sm';

    const textClasses = level === 0
      ? 'text-emerald-700'
      : level === 1
      ? 'text-blue-700'
      : 'text-emerald-600';

    return (
      <div key={leader.id} className="flex flex-col items-center relative w-full sm:w-auto">
        {/* Leader Card */}
        <div className={`${boxClasses} rounded-lg p-2.5 sm:p-3 md:p-4 w-full max-w-[140px] sm:max-w-[180px] md:max-w-[200px] transition-all hover:scale-105 cursor-pointer mx-auto`}>
          {/* Circular Image */}
          <div className={`relative mx-auto mb-1.5 sm:mb-2 md:mb-3 overflow-hidden rounded-full bg-gray-100 border-2 border-white shadow-md ${
            level === 0 ? 'h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28' : 
            level === 1 ? 'h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24' : 
            'h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20'
          }`}>
            {leader.image_url ? (
              <img
                src={leader.image_url}
                alt={leader.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 font-semibold text-emerald-700 ${
                level === 0 ? 'text-base sm:text-xl md:text-2xl' : 
                level === 1 ? 'text-sm sm:text-lg md:text-xl' : 
                'text-xs sm:text-base md:text-lg'
              }`}>
                {leader.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className={`text-gray-900 text-center mb-0.5 sm:mb-1 font-semibold line-clamp-2 leading-tight ${
            level === 0 ? 'text-xs sm:text-base' : 
            level === 1 ? 'text-[10px] sm:text-sm' : 
            'text-[10px] sm:text-xs'
          }`}>
            {leader.name}
          </h3>

          {/* Position */}
          <p className={`font-medium text-center ${textClasses} line-clamp-2 leading-tight ${
            level === 0 ? 'text-[10px] sm:text-sm' : 'text-[9px] sm:text-xs'
          }`}>
            {leader.position || 'Member'}
          </p>

          {/* Department */}
          {leader.department && level > 0 && (
            <p className="text-[9px] sm:text-xs text-gray-500 text-center mt-0.5 sm:mt-1 line-clamp-1">
              {leader.department}
            </p>
          )}
        </div>

        {/* Children */}
        {hasChildren && (
          <>
            {/* Vertical Connecting Line */}
            <div className="w-0.5 h-3 sm:h-5 md:h-6 bg-gray-400 my-1.5 sm:my-2"></div>
            
            {/* Horizontal Connecting Line (if multiple children) - Hidden on mobile */}
            {children.length > 1 && (
              <div className="hidden sm:block absolute top-[90px] sm:top-[120px] md:top-[140px] left-1/2 transform -translate-x-1/2 w-full max-w-[calc(100%-20px)] sm:max-w-[calc(100%-40px)] h-0.5 bg-gray-400"></div>
            )}
            
            {/* Children Container */}
            <div className={`flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mt-1 sm:mt-2 relative w-full ${
              children.length > 1 ? 'pt-1 sm:pt-2' : ''
            }`}>
              {children.map((child, childIndex) => (
                <div key={child.leader.id} className="flex flex-col items-center relative flex-1 min-w-0 sm:flex-none">
                  {/* Horizontal line to child (if multiple children) - Hidden on mobile */}
                  {children.length > 1 && (
                    <>
                      <div className="hidden sm:block absolute -top-1 sm:-top-2 left-1/2 w-0.5 h-1 sm:h-2 bg-gray-400"></div>
                      {childIndex === 0 && (
                        <div className="hidden sm:block absolute -top-1 sm:-top-2 left-1/2 w-1/2 h-0.5 bg-gray-400"></div>
                      )}
                      {childIndex === children.length - 1 && childIndex > 0 && (
                        <div className="hidden sm:block absolute -top-1 sm:-top-2 right-1/2 w-1/2 h-0.5 bg-gray-400"></div>
                      )}
                      {childIndex > 0 && childIndex < children.length - 1 && (
                        <div className="hidden sm:block absolute -top-1 sm:-top-2 left-0 w-full h-0.5 bg-gray-400"></div>
                      )}
                    </>
                  )}
                  {renderNode(child, childIndex, children.length, false)}
                </div>
              ))}
            </div>
          </>
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

  return (
    <div className="w-full py-4 sm:py-6 md:py-8">
      {/* Mobile: Vertical scroll, Desktop: Horizontal scroll if needed */}
      <div className="w-full overflow-x-auto overflow-y-visible -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex flex-col items-center min-w-0 sm:min-w-max">
          {hierarchy.length > 0 && (
            <div className="flex flex-col items-center w-full max-w-full">
              {/* Render all root nodes */}
              {hierarchy.map((node, index) => (
                <div key={node.leader.id} className="flex flex-col items-center mb-6 sm:mb-10 md:mb-12 w-full">
                  {renderNode(node, index, hierarchy.length, true)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

