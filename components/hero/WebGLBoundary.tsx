"use client";

import React from "react";

// Catches the synchronous throw when a WebGL context cannot be created
// (browser context limit hit, GPU blocked, software rendering unavailable)
// and shows a graceful 2D fallback instead of crashing the page.
export class WebGLBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Swallow: the fallback UI communicates the state to the user.
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
