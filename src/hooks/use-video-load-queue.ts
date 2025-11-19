import { useEffect, useRef, useState } from 'react';

// Global queue manager for video loading
class VideoLoadQueue {
  private queue: Array<() => void> = [];
  private isLoading = false;
  private totalRegistered = 0;
  private totalLoaded = 0;
  private allLoadedCallbacks: Array<() => void> = [];

  enqueue(callback: () => void) {
    this.totalRegistered++;
    this.queue.push(callback);
    this.processQueue();
  }

  private processQueue() {
    if (this.isLoading || this.queue.length === 0) {
      return;
    }

    this.isLoading = true;
    const nextCallback = this.queue.shift();
    if (nextCallback) {
      nextCallback();
    }
  }

  notifyComplete() {
    this.isLoading = false;
    this.totalLoaded++;

    // Check if all videos have loaded
    if (this.totalLoaded >= this.totalRegistered && this.totalRegistered > 0) {
      this.allLoadedCallbacks.forEach(cb => cb());
    }

    this.processQueue();
  }

  onAllLoaded(callback: () => void) {
    // If already all loaded, call immediately
    if (this.totalLoaded >= this.totalRegistered && this.totalRegistered > 0) {
      callback();
    } else {
      this.allLoadedCallbacks.push(callback);
    }
  }

  removeAllLoadedCallback(callback: () => void) {
    this.allLoadedCallbacks = this.allLoadedCallbacks.filter(cb => cb !== callback);
  }

  clear() {
    this.queue = [];
    this.isLoading = false;
    this.totalRegistered = 0;
    this.totalLoaded = 0;
    this.allLoadedCallbacks = [];
  }
}

const globalVideoQueue = new VideoLoadQueue();

export function useVideoLoadQueue(videoId: string, onLoad: () => void) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const hasEnqueuedRef = useRef(false);

  useEffect(() => {
    if (!hasEnqueuedRef.current) {
      hasEnqueuedRef.current = true;
      
      globalVideoQueue.enqueue(() => {
        setShouldLoad(true);
        onLoad();
      });
    }

    return () => {
      // Don't clear the entire queue on unmount, just this item's state
    };
  }, [videoId, onLoad]);

  const notifyLoadComplete = () => {
    globalVideoQueue.notifyComplete();
  };

  return { shouldLoad, notifyLoadComplete };
}

// Function to reset the queue (useful when navigating or shuffling)
export function resetVideoLoadQueue() {
  globalVideoQueue.clear();
}

// Hook to subscribe to when all videos have loaded
export function useAllVideosLoaded() {
  const [allLoaded, setAllLoaded] = useState(false);

  useEffect(() => {
    const callback = () => setAllLoaded(true);
    globalVideoQueue.onAllLoaded(callback);

    return () => {
      globalVideoQueue.removeAllLoadedCallback(callback);
    };
  }, []);

  return allLoaded;
}
