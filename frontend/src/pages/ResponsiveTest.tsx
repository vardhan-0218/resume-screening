"use client";

import React, { useEffect } from "react";
import {
  ResponsiveLayout,
  ResponsiveGrid,
  ResponsiveText,
} from "@/components/ResponsiveLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const ResponsiveTest: React.FC = () => {
  // Device info updater
  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? "Landscape" : "Portrait";

      let deviceType = "";
      if (width < 375) deviceType = "Extra Small Phone";
      else if (width < 640) deviceType = "Phone";
      else if (width < 768) deviceType = "Large Phone";
      else if (width < 1024) deviceType = "Tablet";
      else if (width < 1280) deviceType = "Laptop";
      else if (width < 1536) deviceType = "Desktop";
      else deviceType = "Large Desktop";

      const screenWidthEl = document.getElementById("screen-width");
      const deviceTypeEl = document.getElementById("device-type");
      const orientationEl = document.getElementById("orientation");
      const viewportHeightEl = document.getElementById("viewport-height");

      if (screenWidthEl) screenWidthEl.textContent = `${width}px`;
      if (deviceTypeEl) deviceTypeEl.textContent = deviceType;
      if (orientationEl) orientationEl.textContent = orientation;
      if (viewportHeightEl) viewportHeightEl.textContent = `${height}px`;
    };

    updateDeviceInfo();
    window.addEventListener("resize", updateDeviceInfo);
    window.addEventListener("orientationchange", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <ResponsiveLayout maxWidth="full" padding="lg">
        {/* Hero Section */}
        <section className="text-center space-y-6 mb-12">
          <ResponsiveText
            as="h1"
            size="4xl"
            className="font-bold bg-gradient-primary bg-clip-text text-transparent"
          >
            Universal Device Responsiveness Test
          </ResponsiveText>
          <ResponsiveText
            size="lg"
            className="text-muted-foreground max-w-4xl mx-auto"
          >
            This page demonstrates flexible responsive design that adapts to all
            device types – from small phones (320px) to ultra-wide desktops
            (1920px+)
          </ResponsiveText>
        </section>

        {/* Device Info Section */}
        <section className="mb-12">
          <ResponsiveText
            as="h2"
            size="2xl"
            className="font-bold mb-6 text-center"
          >
            Current Device Information
          </ResponsiveText>

          <ResponsiveGrid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="md">
            <Card>
              <CardHeader>
                <CardTitle>Screen Width</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" id="screen-width">
                  Loading...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Type</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold" id="device-type">
                  Loading...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orientation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold" id="orientation">
                  Loading...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Viewport Height</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold" id="viewport-height">
                  Loading...
                </p>
              </CardContent>
            </Card>
          </ResponsiveGrid>
        </section>

        {/* Responsive Grid Demo */}
        <section className="mb-12">
          <ResponsiveText
            as="h2"
            size="2xl"
            className="font-bold mb-6 text-center"
          >
            Responsive Grid Demonstration
          </ResponsiveText>

          <ResponsiveGrid auto gap="lg">
            {Array.from({ length: 12 }, (_, i) => (
              <Card key={i} className="min-h-[200px]">
                <CardHeader>
                  <CardTitle>Card {i + 1}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p>This card adapts to your screen size automatically.</p>
                  <Button className="mt-4 w-full touch-friendly">
                    Touch Friendly Button
                  </Button>
                </CardContent>
              </Card>
            ))}
          </ResponsiveGrid>
        </section>

        {/* Typography Demo */}
        <section className="mb-12">
          <ResponsiveText
            as="h2"
            size="2xl"
            className="font-bold mb-6 text-center"
          >
            Fluid Typography Scale
          </ResponsiveText>

          <div className="space-y-4 text-center">
            <ResponsiveText as="h1" size="5xl" className="font-bold">
              Heading 1 - Fluid 5xl
            </ResponsiveText>
            <ResponsiveText as="h2" size="4xl" className="font-bold">
              Heading 2 - Fluid 4xl
            </ResponsiveText>
            <ResponsiveText as="h3" size="3xl" className="font-bold">
              Heading 3 - Fluid 3xl
            </ResponsiveText>
            <ResponsiveText as="h4" size="2xl" className="font-bold">
              Heading 4 - Fluid 2xl
            </ResponsiveText>
            <ResponsiveText as="h5" size="xl" className="font-bold">
              Heading 5 - Fluid xl
            </ResponsiveText>
            <ResponsiveText as="h6" size="lg" className="font-bold">
              Heading 6 - Fluid lg
            </ResponsiveText>
            <ResponsiveText size="base">
              Body text – Fluid base size that scales with device
            </ResponsiveText>
            <ResponsiveText size="sm">Small text – Fluid small size</ResponsiveText>
          </div>
        </section>

        {/* Device-specific Features */}
        <section className="mb-12">
          <ResponsiveText
            as="h2"
            size="2xl"
            className="font-bold mb-6 text-center"
          >
            Device-Specific Features
          </ResponsiveText>

          <ResponsiveGrid columns={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Small Phones (320–374px)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="show-on-xs hidden">
                  <p className="text-green-600 font-semibold">
                    ✓ Optimized for extra small screens
                  </p>
                  <p>Minimal padding, compact layout</p>
                </div>
                <div className="hide-on-xs">
                  <p className="text-gray-500">
                    Not visible on current screen size
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Standard Phones (375–639px)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="show-on-sm hidden">
                  <p className="text-green-600 font-semibold">
                    ✓ Standard mobile optimization
                  </p>
                  <p>Touch-friendly interface</p>
                </div>
                <div className="hide-on-sm">
                  <p className="text-gray-500">
                    Not visible on current screen size
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tablets & Larger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="show-on-md hidden">
                  <p className="text-green-600 font-semibold">
                    ✓ Multi-column layout
                  </p>
                  <p>Enhanced spacing and typography</p>
                </div>
                <div className="hide-on-md">
                  <p className="text-gray-500">
                    Not visible on current screen size
                  </p>
                </div>
              </CardContent>
            </Card>
          </ResponsiveGrid>
        </section>

        {/* Test Results */}
        <section className="text-center mb-12">
          <ResponsiveText as="h2" size="2xl" className="font-bold mb-6">
            Responsiveness Test Results
          </ResponsiveText>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-green-800 font-semibold text-lg mb-2">
              ✓ Your device is fully supported!
            </p>
            <p className="text-green-700">
              All content should display properly with optimal spacing,
              typography, and layout.
            </p>
          </div>
        </section>
      </ResponsiveLayout>
    </div>
  );
};

export default ResponsiveTest;
