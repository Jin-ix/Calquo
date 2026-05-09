import React from 'react';
import { Badge } from './badge';
import { CheckCircle, Image, Upload } from 'lucide-react';
import { isUserUploadedImage } from '../../utils/imageUtils';

interface ImagePriorityIndicatorProps {
  src: string;
  className?: string;
}

export const ImagePriorityIndicator: React.FC<ImagePriorityIndicatorProps> = ({
  src,
  className = ""
}) => {
  if (!src || !isUserUploadedImage(src)) {
    return null;
  }

  return (
    <div className={className}>
      <Badge 
        variant="secondary" 
        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border-green-200"
      >
        <CheckCircle className="w-3 h-3" />
        High Quality
      </Badge>
    </div>
  );
};

interface ImageSourceBadgeProps {
  src: string;
  className?: string;
}

export const ImageSourceBadge: React.FC<ImageSourceBadgeProps> = ({
  src,
  className = ""
}) => {
  if (!src || !isUserUploadedImage(src)) {
    return null;
  }

  return (
    <div className={className}>
      <Badge 
        variant="secondary" 
        className="flex items-center gap-1 text-xs bg-green-100 text-green-800 border-green-300"
      >
        <Upload className="w-3 h-3" />
        User Image
      </Badge>
    </div>
  );
};
