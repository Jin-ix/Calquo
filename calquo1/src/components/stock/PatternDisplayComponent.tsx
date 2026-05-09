import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { ColorVariant } from './EnhancedStockTypes';
import { Palette, Image as ImageIcon, Type } from 'lucide-react';

// Extended interface to support both old and new Color/Pattern structures
interface ExtendedColorVariant extends ColorVariant {
  // New unified structure (Color/Pattern functionality)
  colorOrPattern?: string; // Either hex code or image URL
  colorOrPatternType?: 'color' | 'pattern'; // Type indicator
  colorOrPatternName?: string; // Display name for the color/pattern
}

// Error boundary wrapper for individual pattern components
function PatternErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Pattern component error:', error);
    return fallback || (
      <div className="p-2 border border-red-200 rounded text-xs text-red-600">
        Unable to display pattern
      </div>
    );
  }
}

type PatternDisplaySize = 'xs' | 'sm' | 'md' | 'lg';

interface PatternDisplayComponentProps {
  pattern: ExtendedColorVariant;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (patternId: string) => void;
  size?: PatternDisplaySize;
  showDefinitionBadges?: boolean;
}

function PatternDisplayComponentInner({
  pattern,
  isSelectable = false,
  isSelected = false,
  onSelect,
  size = 'md',
  showDefinitionBadges = false
}: PatternDisplayComponentProps) {
  try {
    // Defensive checks to prevent errors
    if (!pattern || !pattern.id) {
      return null;
    }

    const definition = pattern.definition || { hasColorPicker: false, hasImage: false, hasName: false };
    
    // Support both old and new structures for backward compatibility
    // Check if colorOrPattern is an object (from newer AddStockWizard)
    const isColorOrPatternObject = pattern.colorOrPattern && typeof pattern.colorOrPattern === 'object';
    const colorOrPatternObj = isColorOrPatternObject ? (pattern.colorOrPattern as any) : null;

    let displayName = pattern.colorOrPatternName || pattern.name || 'Pattern';
    let colorValue = pattern.colorCode;
    let patternImageValue = pattern.patternImage;
    let hasColorFromNew = false;
    let hasPatternFromNew = false;
    let hasNameFromNew = false;

    if (isColorOrPatternObject && colorOrPatternObj) {
      // Handle object structure: { type: 'color'|'pattern', value: '...', name: '...' }
      if (colorOrPatternObj.type === 'color') {
        colorValue = colorOrPatternObj.value;
        hasColorFromNew = true;
      } else if (colorOrPatternObj.type === 'pattern') {
        patternImageValue = colorOrPatternObj.value;
        hasPatternFromNew = true;
      }
      
      if (colorOrPatternObj.name) {
        displayName = colorOrPatternObj.name;
        hasNameFromNew = true;
      }
    } else {
      // Handle legacy/flat structure
      const hasColorOrPattern = !!(pattern.colorOrPattern);
      
      if (hasColorOrPattern) {
        if (pattern.colorOrPatternType === 'color') {
          colorValue = pattern.colorOrPattern;
          hasColorFromNew = true;
        } else if (pattern.colorOrPatternType === 'pattern') {
          patternImageValue = pattern.colorOrPattern;
          hasPatternFromNew = true;
        }
      }
      
      hasNameFromNew = !!(pattern.colorOrPatternName);
    }
    
    // Merge definition with new structure detection
    const effectiveDefinition = {
      hasColorPicker: definition.hasColorPicker || hasColorFromNew || !!colorValue,
      hasImage: definition.hasImage || hasPatternFromNew || !!patternImageValue,
      hasName: definition.hasName || hasNameFromNew || !!(pattern.name) || !!displayName
    };

  // Size configurations
  const sizeConfig: Record<PatternDisplaySize, {
    container: string;
    image: string;
    color: string;
    text: string;
    badge: string;
  }> = {
    xs: {
      container: 'p-1',
      image: 'w-6 h-6',
      color: 'w-4 h-4',
      text: 'text-xs',
      badge: 'text-xs px-1'
    },
    sm: {
      container: 'p-2',
      image: 'w-8 h-8',
      color: 'w-6 h-6',
      text: 'text-xs',
      badge: 'text-xs px-1'
    },
    md: {
      container: 'p-3',
      image: 'w-12 h-12',
      color: 'w-8 h-8',
      text: 'text-sm',
      badge: 'text-xs'
    },
    lg: {
      container: 'p-4',
      image: 'w-16 h-16',
      color: 'w-12 h-12',
      text: 'text-base',
      badge: 'text-sm'
    }
  };

  // Fallback configuration to prevent any undefined access
  const fallbackConfig = {
    container: 'p-3',
    image: 'w-12 h-12',
    color: 'w-8 h-8',
    text: 'text-sm',
    badge: 'text-xs'
  };
  
  const config = sizeConfig[size] || sizeConfig.md || fallbackConfig;
  
  // Additional safety check to prevent crashes
  if (!config) {
    console.error('PatternDisplayComponent: Invalid size configuration', { size, availableSizes: Object.keys(sizeConfig) });
    return null;
  }

  const handleClick = () => {
    if (isSelectable && onSelect) {
      onSelect(pattern.id);
    }
  };

  return (
    <Card 
      className={`
        ${isSelectable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} 
        ${isSelected ? 'ring-2 ring-primary' : ''}
      `}
      onClick={handleClick}
    >
      <CardContent className={config.container}>
        <div className="space-y-2">
          {/* Pattern Display */}
          <div className="flex items-center gap-3">
            {/* Color Swatch */}
            {effectiveDefinition.hasColorPicker && colorValue && (
              <div className="flex items-center gap-2">
                <div 
                  className={`${config.color} rounded border-2 border-gray-300 flex-shrink-0`}
                  style={{ backgroundColor: colorValue }}
                  title={`Color: ${colorValue}`}
                />
                {size === 'lg' && (
                  <span className="text-xs text-muted-foreground">{colorValue}</span>
                )}
              </div>
            )}
            
            {/* Pattern Image */}
            {effectiveDefinition.hasImage && patternImageValue && (
              <div className="flex items-center gap-2">
                <img 
                  src={patternImageValue} 
                  alt="Pattern" 
                  className={`${config.image} rounded object-cover border-2 border-gray-300 flex-shrink-0`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {size === 'lg' && (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
            
            {/* Pattern Name */}
            {effectiveDefinition.hasName && displayName && displayName !== 'Pattern' && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={config.badge}>
                  {displayName}
                </Badge>
                {size === 'lg' && (
                  <Type className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Definition Method Badges (Optional) */}
          {showDefinitionBadges && (
            <div className="flex gap-1 flex-wrap">
              {effectiveDefinition.hasName && (
                <Badge variant="outline" className="text-xs">
                  <Type className="h-3 w-3 mr-1" />
                  Name
                </Badge>
              )}
              {effectiveDefinition.hasColorPicker && (
                <Badge variant="outline" className="text-xs">
                  <Palette className="h-3 w-3 mr-1" />
                  Color
                </Badge>
              )}
              {effectiveDefinition.hasImage && (
                <Badge variant="outline" className="text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Pattern
                </Badge>
              )}
            </div>
          )}

          {/* Selection Indicator */}
          {isSelectable && (
            <div className="text-center">
              <span className={`${config.text} text-muted-foreground`}>
                {isSelected ? '✓ Selected' : 'Click to select'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  } catch (error) {
    console.error('PatternDisplayComponent error:', error, { pattern, size });
    return (
      <div className="p-2 border border-red-200 rounded text-xs text-red-600">
        Pattern display error
      </div>
    );
  }
}

export function PatternDisplayComponent(props: PatternDisplayComponentProps) {
  return (
    <PatternErrorBoundary>
      <PatternDisplayComponentInner {...props} />
    </PatternErrorBoundary>
  );
}

// Compact version for list displays
function PatternDisplayCompactInner({ 
  pattern, 
  isSelected = false,
  onSelect
}: {
  pattern: ExtendedColorVariant;
  isSelected?: boolean;
  onSelect?: (patternId: string) => void;
}) {
  try {
    // Defensive checks to prevent errors
    if (!pattern || !pattern.id) {
      return null;
    }

    const definition = pattern.definition || { hasColorPicker: false, hasImage: false, hasName: false };
    
    // Support both old and new structures for backward compatibility
    // Check if colorOrPattern is an object (from newer AddStockWizard)
    const isColorOrPatternObject = pattern.colorOrPattern && typeof pattern.colorOrPattern === 'object';
    const colorOrPatternObj = isColorOrPatternObject ? (pattern.colorOrPattern as any) : null;

    let displayName = pattern.colorOrPatternName || pattern.name || 'Pattern';
    let colorValue = pattern.colorCode;
    let patternImageValue = pattern.patternImage;
    let hasColorFromNew = false;
    let hasPatternFromNew = false;
    let hasNameFromNew = false;

    if (isColorOrPatternObject && colorOrPatternObj) {
      // Handle object structure: { type: 'color'|'pattern', value: '...', name: '...' }
      if (colorOrPatternObj.type === 'color') {
        colorValue = colorOrPatternObj.value;
        hasColorFromNew = true;
      } else if (colorOrPatternObj.type === 'pattern') {
        patternImageValue = colorOrPatternObj.value;
        hasPatternFromNew = true;
      }
      
      if (colorOrPatternObj.name) {
        displayName = colorOrPatternObj.name;
        hasNameFromNew = true;
      }
    } else {
      // Handle legacy/flat structure
      const hasColorOrPattern = !!(pattern.colorOrPattern);
      
      if (hasColorOrPattern) {
        if (pattern.colorOrPatternType === 'color') {
          colorValue = pattern.colorOrPattern;
          hasColorFromNew = true;
        } else if (pattern.colorOrPatternType === 'pattern') {
          patternImageValue = pattern.colorOrPattern;
          hasPatternFromNew = true;
        }
      }
      
      hasNameFromNew = !!(pattern.colorOrPatternName);
    }
    
    // Merge definition with new structure detection
    const effectiveDefinition = {
      hasColorPicker: definition.hasColorPicker || hasColorFromNew || !!colorValue,
      hasImage: definition.hasImage || hasPatternFromNew || !!patternImageValue,
      hasName: definition.hasName || hasNameFromNew || !!(pattern.name) || !!displayName
    };

  return (
    <div 
      className={`
        flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors
        ${isSelected ? 'bg-primary/10 border-primary' : 'border-border'}
      `}
      onClick={() => onSelect?.(pattern.id)}
    >
      {/* Color Swatch */}
      {effectiveDefinition.hasColorPicker && colorValue && (
        <div 
          className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
          style={{ backgroundColor: colorValue }}
        />
      )}
      
      {/* Pattern Image */}
      {effectiveDefinition.hasImage && patternImageValue && (
        <img 
          src={patternImageValue} 
          alt="Pattern" 
          className="w-6 h-6 rounded object-cover border border-gray-300 flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      
      {/* Pattern Name */}
      <span className="text-sm flex-1">
        {displayName}
      </span>
      
      {/* Definition indicators */}
      <div className="flex gap-1">
        {effectiveDefinition.hasName && <Type className="h-3 w-3 text-muted-foreground" />}
        {effectiveDefinition.hasColorPicker && <Palette className="h-3 w-3 text-muted-foreground" />}
        {effectiveDefinition.hasImage && <ImageIcon className="h-3 w-3 text-muted-foreground" />}
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs text-primary-foreground">✓</span>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('PatternDisplayCompact error:', error, { pattern });
    return (
      <div className="p-1 border border-red-200 rounded text-xs text-red-600">
        Pattern error
      </div>
    );
  }
}

export function PatternDisplayCompact(props: {
  pattern: ExtendedColorVariant;
  isSelected?: boolean;
  onSelect?: (patternId: string) => void;
}) {
  return (
    <PatternErrorBoundary fallback={<div className="p-1 text-xs text-red-600">Pattern error</div>}>
      <PatternDisplayCompactInner {...props} />
    </PatternErrorBoundary>
  );
}

// Grid version for pattern selection
export function PatternGrid({ 
  patterns, 
  selectedPatterns = [], 
  onPatternSelect,
  multiSelect = false 
}: {
  patterns: ExtendedColorVariant[];
  selectedPatterns?: string[];
  onPatternSelect?: (patternId: string) => void;
  multiSelect?: boolean;
}) {
  // Filter out invalid patterns
  const validPatterns = patterns.filter(pattern => pattern && pattern.id);
  
  if (validPatterns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No valid patterns to display
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {validPatterns.map((pattern) => (
        <PatternDisplayComponent
          key={pattern.id}
          pattern={pattern}
          isSelectable={true}
          isSelected={selectedPatterns.includes(pattern.id)}
          onSelect={onPatternSelect}
          size="md"
          showDefinitionBadges={false}
        />
      ))}
    </div>
  );
}
