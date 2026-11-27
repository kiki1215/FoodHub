import { useEffect, useState } from 'react';
import fallbackImg from '../../assets/food-fallback.svg';
import { resolveImageUrl } from '../../utils/formatters';

export default function FoodImage({ src, alt, className = '' }) {
  const resolved = src ? resolveImageUrl(src) : fallbackImg;
  const [imgSrc, setImgSrc] = useState(resolved);

  useEffect(() => {
    setImgSrc(src ? resolveImageUrl(src) : fallbackImg);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt || 'Món ăn FOODHUB'}
      loading="lazy"
      onError={() => {
        if (imgSrc !== fallbackImg) {
          setImgSrc(fallbackImg);
        }
      }}
      className={`object-cover ${className}`}
    />
  );
}
