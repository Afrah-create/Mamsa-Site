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
  
  // Top level - Board, President, Chair
  if (pos.includes('board') || pos.includes('president') || pos.includes('chair')) {
    return 0;
  }
  
  // Second level - CEO, Executive Director
  if (pos.includes('ceo') || pos.includes('executive') || pos.includes('secretary general')) {
    return 1;
  }
  
  // Third level - Directors
  if (pos.includes('director') || pos.includes('coordinator') || pos.includes('head') || pos.includes('minister')) {
    return 2;
  }
  
  // Fourth level - Specialists, Officers, Members
  return 3;
}

// Build hierarchy tree from flat list
function buildHierarchy(leaders: Leader[]): HierarchyNode[] {
  // Sort by hierarchy level first, then by order_position
  const sorted = [...leaders].sort((a, b) => {
    const levelA = getHierarchyLevel(a.position);
    const levelB = getHierarchyLevel(b.position);
    if (levelA !== levelB) return levelA - levelB;
    // If same level, use order_position if available
    return 0;
  });

  const nodes: HierarchyNode[] = sorted.map(leader => ({
    leader,
    children: [],
    level: getHierarchyLevel(leader.position),
  }));

  // Build parent-child relationships
  const rootNodes: HierarchyNode[] = [];
  
  nodes.forEach(node => {
    if (node.level === 0) {
      // Top level nodes are roots
      rootNodes.push(node);
    } else {
      // Find parent (one level above, prefer same department)
      const parent = nodes.find(p => {
        if (p.level !== node.level - 1) return false;
        // If both have departments, match by department
        if (p.leader.department && node.leader.department) {
          return p.leader.department === node.leader.department;
        }
        // If no department match, assign to first available parent at correct level
        return true;
      });
      
      if (parent) {
        parent.children.push(node);
      } else {
        // If no parent found, add to root
        rootNodes.push(node);
      }
    }
  });

  // Sort children by order_position within each parent
  const sortChildren = (node: HierarchyNode) => {
    node.children.sort((a, b) => {
      // Sort by level first, then by position
      if (a.level !== b.level) return a.level - b.level;
      return 0;
    });
    node.children.forEach(sortChildren);
  };
  
  rootNodes.forEach(sortChildren);

  return rootNodes;
}

export default function OrgChart({ leaders }: OrgChartProps) {
  const hierarchy = useMemo(() => buildHierarchy(leaders), [leaders]);

  const renderNode = (node: HierarchyNode, parentHasSiblings: boolean = false) => {
    const { leader, children } = node;
    const hasChildren = children.length > 0;
    const level = node.level;

    // Determine box styling based on level
    const boxClasses = level === 0
      ? 'bg-white border-2 border-gray-300 shadow-lg'
      : level === 1
      ? 'bg-blue-50 border-2 border-blue-400 shadow-md'
      : level === 2
      ? 'bg-blue-50 border-2 border-blue-400 shadow-md'
      : 'bg-emerald-50 border border-emerald-300 shadow-sm';

    const textClasses = level === 0
      ? 'text-gray-700'
      : level === 1
      ? 'text-blue-700'
      : level === 2
      ? 'text-blue-700'
      : 'text-emerald-600';

    const imageSize = level === 0
      ? 'h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28'
      : level === 1 || level === 2
      ? 'h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24'
      : 'h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20';

    return (
      <div key={leader.id} className="flex flex-col items-center relative">
        {/* Leader Card */}
        <div className={`${boxClasses} rounded-lg p-3 sm:p-4 md:p-5 w-full max-w-[160px] sm:max-w-[180px] md:max-w-[200px] transition-all hover:scale-105`}>
          {/* Circular Image */}
          <div className={`relative mx-auto mb-2 sm:mb-3 overflow-hidden rounded-full bg-gray-100 border-2 border-white shadow-md ${imageSize}`}>
            {leader.image_url ? (
              <img
                src={leader.image_url}
                alt={leader.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 font-semibold text-emerald-700 ${
                level === 0 ? 'text-lg sm:text-xl md:text-2xl' : 
                level <= 2 ? 'text-base sm:text-lg md:text-xl' : 
                'text-sm sm:text-base md:text-lg'
              }`}>
                {leader.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className={`text-gray-900 text-center mb-1 font-semibold line-clamp-2 leading-tight ${
            level === 0 ? 'text-sm sm:text-base md:text-lg' : 
            level <= 2 ? 'text-xs sm:text-sm md:text-base' : 
            'text-xs sm:text-sm'
          }`}>
            {leader.name}
          </h3>

          {/* Position */}
          <p className={`font-medium text-center ${textClasses} line-clamp-2 leading-tight ${
            level === 0 ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs md:text-sm'
          }`}>
            {leader.position || 'Member'}
          </p>
        </div>

        {/* Children */}
        {hasChildren && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical Connecting Line from parent to horizontal connector */}
            <div className="w-0.5 h-4 sm:h-6 md:h-8 bg-gray-400"></div>
            
            {/* Horizontal container for children with connector lines */}
            <div className="relative w-full flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mt-2 pb-2">
              {/* Horizontal connector line - spans across all children */}
              {children.length > 1 && (
                <div 
                  className="absolute top-0 left-0 right-0 h-0.5 bg-gray-400"
                  style={{
                    left: '10%',
                    right: '10%',
                  }}
                ></div>
              )}
              
              {children.map((child, childIndex) => {
                return (
                  <div key={child.leader.id} className="flex flex-col items-center relative z-10">
                    {/* Vertical line from horizontal connector to child (only if multiple children) */}
                    {children.length > 1 && (
                      <div className="absolute -top-2 sm:-top-3 md:-top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-2 sm:h-3 md:h-4 bg-gray-400"></div>
                    )}
                    
                    {/* Render child node */}
                    {renderNode(child, children.length > 1)}
                  </div>
                );
              })}
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

  return (
    <div className="w-full py-6 sm:py-8 md:py-12 overflow-x-auto">
      <div className="flex flex-col items-center min-w-max px-4 sm:px-8">
        {hierarchy.map((rootNode) => (
          <div key={rootNode.leader.id} className="flex flex-col items-center">
            {renderNode(rootNode)}
          </div>
        ))}
      </div>
    </div>
  );
}
