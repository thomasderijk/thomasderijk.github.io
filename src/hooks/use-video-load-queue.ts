import { useEffect, useRef, useState } from 'react';

// Global queue manager for video loading
class VideoLoadQueue {
  private queue: Array<() => void> = [];
  private isLoading = false;

  enqueue(callback: () => void) {
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
    this.processQueue();
  }

  clear() {
    this.queue = [];
    this.isLoading = false;
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
