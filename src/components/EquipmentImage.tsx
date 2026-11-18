import { useState } from 'react';
import { Camera, Lightbulb, Mic, Monitor, Package, Video } from 'lucide-react';
import type { EquipmentCategory } from '../types';

interface EquipmentImageProps {
  src?: string;
  alt: string;
  category?: EquipmentCategory;
  className?: string;
}

function getCategoryIcon(category?: EquipmentCategory) {
  switch (category) {
    case 'กล้อง':
      return Camera;
    case 'ไมโครโฟน':
      return Mic;
    case 'ขาตั้งกล้อง':
      return Video;
    case 'โปรเจกเตอร์':
      return Monitor;
    case 'ไฟสตูดิโอ':
      return Lightbulb;
    default:
      return Package;
  }
}

export function EquipmentImage({
  src,
  alt,
  category,
  className = 'w-full h-full object-cover',
}: EquipmentImageProps) {
  const [hasError, setHasError] = useState(false);
  const Icon = getCategoryIcon(category);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100/70 text-blue-700/70 select-none p-4 ${className}`}
        aria-label={alt}
      >
        <Icon className="w-10 h-10 mb-2 stroke-[1.5]" />
        <span className="text-xs font-medium text-slate-600 text-center line-clamp-1">
          {category || 'อุปกรณ์ภาควิชา'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
