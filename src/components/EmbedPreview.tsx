import { User, Shirt, Sparkles } from 'lucide-react';

interface EmbedPreviewProps {
  title: string;
  ctaText: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl: string | null;
}

export const EmbedPreview = ({
  title,
  ctaText,
  primaryColor,
  secondaryColor,
  backgroundColor,
  textColor,
  logoUrl,
}: EmbedPreviewProps) => {
  return (
    <div 
      className="rounded-xl overflow-hidden shadow-lg"
      style={{ backgroundColor }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ borderColor: `${textColor}15` }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
        ) : (
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-4 h-4" style={{ color: textColor }} />
          </div>
        )}
        <span 
          className="font-semibold text-sm"
          style={{ color: textColor }}
        >
          {title}
        </span>
      </div>

      {/* Content preview */}
      <div className="p-4 space-y-4">
        {/* Upload zones preview */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="aspect-square rounded-lg flex flex-col items-center justify-center p-2"
            style={{ 
              backgroundColor: `${textColor}08`,
              border: `1px dashed ${textColor}30`
            }}
          >
            <User className="w-6 h-6 mb-1" style={{ color: `${textColor}50` }} />
            <span className="text-xs" style={{ color: `${textColor}50` }}>Tu foto</span>
          </div>
          <div 
            className="aspect-square rounded-lg flex flex-col items-center justify-center p-2"
            style={{ 
              backgroundColor: `${textColor}08`,
              border: `1px dashed ${textColor}30`
            }}
          >
            <Shirt className="w-6 h-6 mb-1" style={{ color: `${textColor}50` }} />
            <span className="text-xs" style={{ color: `${textColor}50` }}>Prenda</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="w-full py-2.5 rounded-lg font-medium text-sm transition-all"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            color: textColor,
          }}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
};
