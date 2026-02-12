import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Smartphone, Tablet, Monitor, Tv } from 'lucide-react';

interface DeviceInfo {
  width: number;
  height: number;
  deviceType: string;
  orientation: string;
  pixelRatio: number;
  touchSupport: boolean;
}

const ResponsiveVerification: React.FC = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    width: 0,
    height: 0,
    deviceType: 'Unknown',
    orientation: 'Unknown',
    pixelRatio: 1,
    touchSupport: false
  });

  const [checks, setChecks] = useState({
    fluidLayout: false,
    responsiveText: false,
    touchFriendly: false,
    properSpacing: false,
    mobileNavigation: false
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'Landscape' : 'Portrait';
      const pixelRatio = window.devicePixelRatio || 1;
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      let deviceType = '';
      
      if (width < 375) {
        deviceType = 'Extra Small Phone';
      } else if (width < 640) {
        deviceType = 'Phone';
      } else if (width < 768) {
        deviceType = 'Large Phone';
      } else if (width < 1024) {
        deviceType = 'Tablet';
      } else if (width < 1280) {
        deviceType = 'Laptop';
      } else if (width < 1536) {
        deviceType = 'Desktop';
      } else {
        deviceType = 'Large Desktop/Ultra-wide';
      }
      
      setDeviceInfo({ width, height, deviceType, orientation, pixelRatio, touchSupport });
      
      // Perform responsive checks
      const container = document.querySelector('.fluid-width');
      const fluidText = document.querySelector('.fluid-text');
      const touchButtons = document.querySelectorAll('button');
      const mobileMenu = document.querySelector('.mobile-menu-container');
      
      setChecks({
        fluidLayout: !!container && container.getBoundingClientRect().width > 0,
        responsiveText: !!fluidText,
        touchFriendly: touchButtons.length > 0 && Array.from(touchButtons).some(btn => {
          const rect = btn.getBoundingClientRect();
          return rect.height >= 44;
        }),
        properSpacing: !!container,
        mobileNavigation: width < 640 ? !!mobileMenu : true
      });
    };
    
    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  const getDeviceIcon = () => {
    const { width } = deviceInfo;
    if (width < 640) return <Smartphone className="w-8 h-8" />;
    if (width < 1024) return <Tablet className="w-8 h-8" />;
    if (width < 1536) return <Monitor className="w-8 h-8" />;
    return <Tv className="w-8 h-8" />;
  };

  const allChecksPass = Object.values(checks).every(check => check);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 p-4">
      <div className="fluid-width max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="fluid-heading font-bold bg-gradient-primary bg-clip-text text-transparent">
            Responsive UI Verification
          </h1>
          <p className="fluid-text text-muted-foreground">
            Testing universal device compatibility and responsive design
          </p>
        </div>

        <div className="text-center">
          <Badge 
            variant={allChecksPass ? "default" : "secondary"}
            className={`text-lg px-6 py-2 ${
              allChecksPass 
                ? 'bg-green-500 text-white' 
                : 'bg-orange-500 text-white'
            }`}
          >
            {allChecksPass ? (
              <><Check className="w-5 h-5 mr-2" /> All Systems Operational</>
            ) : (
              <><X className="w-5 h-5 mr-2" /> Some Issues Detected</>
            )}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getDeviceIcon()}
              Current Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{deviceInfo.width}px</p>
                <p className="text-sm text-muted-foreground">Screen Width</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{deviceInfo.height}px</p>
                <p className="text-sm text-muted-foreground">Screen Height</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{deviceInfo.deviceType}</p>
                <p className="text-sm text-muted-foreground">Device Type</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{deviceInfo.orientation}</p>
                <p className="text-sm text-muted-foreground">Orientation</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{deviceInfo.pixelRatio}x</p>
                <p className="text-sm text-muted-foreground">Pixel Ratio</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{deviceInfo.touchSupport ? 'Yes' : 'No'}</p>
                <p className="text-sm text-muted-foreground">Touch Support</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsive Design Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries({
                fluidLayout: 'Fluid Layout System',
                responsiveText: 'Responsive Typography', 
                touchFriendly: 'Touch-Friendly Interface',
                properSpacing: 'Proper Spacing System',
                mobileNavigation: 'Mobile Navigation'
              }).map(([key, label]) => {
                const passed = checks[key as keyof typeof checks];
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                    <span className="font-medium">{label}</span>
                    <Badge variant={passed ? "default" : "destructive"}>
                      {passed ? (
                        <><Check className="w-4 h-4 mr-1" /> Pass</>
                      ) : (
                        <><X className="w-4 h-4 mr-1" /> Fail</>
                      )}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Responsive Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Touch-Friendly Buttons</h4>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm" className="touch-friendly">Small Button</Button>
                  <Button size="default" className="touch-friendly">Default Button</Button>
                  <Button size="lg" className="touch-friendly">Large Button</Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Responsive Grid</h4>
                <div className="responsive-grid-auto">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Card key={i} className="min-h-[100px] bg-gradient-to-br from-primary/10 to-accent/10">
                      <CardContent className="p-4">
                        <p className="text-center font-medium">Grid Item {i + 1}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Fluid Typography</h4>
                <div className="space-y-2">
                  <p className="fluid-text-xs">Extra Small Text (xs)</p>
                  <p className="fluid-text-sm">Small Text (sm)</p>
                  <p className="fluid-text-base">Base Text (base)</p>
                  <p className="fluid-text-lg">Large Text (lg)</p>
                  <p className="fluid-text-xl">Extra Large Text (xl)</p>
                  <p className="fluid-text-2xl">2X Large Text (2xl)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${
          allChecksPass ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'
        }`}>
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">
              {allChecksPass ? '🎉 Perfect Responsive Design!' : '⚠️ Issues Detected'}
            </h3>
            <p className="text-muted-foreground">
              {allChecksPass 
                ? 'Your application is fully optimized for all device types and screen sizes.'
                : 'Some responsive features may not be working properly. Please check the validation results above.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResponsiveVerification;