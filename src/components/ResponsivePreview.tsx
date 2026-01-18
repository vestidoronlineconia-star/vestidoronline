import { useState } from 'react';
import { Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Device {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ className?: string }>;
}

const devices: Device[] = [
  { id: 'mobile', name: 'Móvil', width: 375, height: 667, icon: Smartphone },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024, icon: Tablet },
  { id: 'desktop', name: 'Desktop', width: 1280, height: 800, icon: Monitor },
];

interface ResponsivePreviewProps {
  clientSlug: string;
}

export const ResponsivePreview = ({ clientSlug }: ResponsivePreviewProps) => {
  const [selectedDevice, setSelectedDevice] = useState<Device>(devices[0]);
  const [isRotated, setIsRotated] = useState(false);

  const effectiveWidth = isRotated ? selectedDevice.height : selectedDevice.width;
  const effectiveHeight = isRotated ? selectedDevice.width : selectedDevice.height;

  // Calculate scale to fit in container
  const containerMaxWidth = 400;
  const containerMaxHeight = 600;
  const scaleX = containerMaxWidth / effectiveWidth;
  const scaleY = containerMaxHeight / effectiveHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const iframeUrl = `/embed?clientId=${clientSlug}&preview=true`;

  return (
    <div className="space-y-4">
      {/* Device Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {devices.map((device) => {
            const IconComponent = device.icon;
            return (
              <Button
                key={device.id}
                variant={selectedDevice.id === device.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDevice(device)}
                className="gap-1.5"
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{device.name}</span>
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsRotated(!isRotated)}
          className={cn(
            "transition-transform",
            isRotated && "rotate-90"
          )}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Device Frame */}
      <div className="flex items-center justify-center p-4 bg-muted/30 rounded-xl min-h-[500px]">
        <div
          className="relative bg-black rounded-[2rem] p-2 shadow-2xl transition-all duration-300"
          style={{
            width: effectiveWidth * scale + 16,
            height: effectiveHeight * scale + 16,
          }}
        >
          {/* Notch for mobile */}
          {selectedDevice.id === 'mobile' && !isRotated && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-xl z-10" />
          )}
          
          {/* Screen */}
          <div
            className="bg-white rounded-[1.5rem] overflow-hidden"
            style={{
              width: effectiveWidth * scale,
              height: effectiveHeight * scale,
            }}
          >
            <iframe
              src={iframeUrl}
              title="Widget Preview"
              className="border-0"
              style={{
                width: effectiveWidth,
                height: effectiveHeight,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="text-center text-xs text-muted-foreground">
        {effectiveWidth} × {effectiveHeight}px
        {isRotated && ' (Horizontal)'}
      </div>
    </div>
  );
};
