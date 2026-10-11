'use client';

import React from 'react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { DiscoveryFeed } from '@/components/discovery/discovery-feed';

export default function DiscoverPage() {
  return (
    <MobileShell theme="cool">
      <DiscoveryFeed />
    </MobileShell>
  );
}
