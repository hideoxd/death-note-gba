<script lang="ts">
  import { onMount } from 'svelte';

  import '../app.css';

  const YT_VIDEO_ID = 'qR6dzwQahOM';
  const YT_VOLUME = 25;
  const YT_CONTAINER_ID = 'yt-bg-player';

  type YouTubeWindow = Window & {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars: Record<string, string | number>;
          events?: {
            onReady?: () => void;
          };
        }
      ) => {
        setVolume: (value: number) => void;
        playVideo: () => void;
        destroy: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  };

  let player: {
    setVolume: (value: number) => void;
    playVideo: () => void;
    destroy: () => void;
  } | null = null;
  let ready = false;

  const startPlayback = () => {
    if (!ready || !player) return;
    player.setVolume(YT_VOLUME);
    player.playVideo();
  };

  const loadYouTubeApi = (): Promise<void> => {
    const ytWindow = window as YouTubeWindow;
    if (ytWindow.YT?.Player) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const prevReady = ytWindow.onYouTubeIframeAPIReady;
      ytWindow.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        resolve();
      };

      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
      }
    });
  };

  onMount(() => {
    let disposed = false;

    const unlockPlayback = () => {
      startPlayback();
    };

    void loadYouTubeApi().then(() => {
      if (disposed) return;

      const ytWindow = window as YouTubeWindow;
      const Player = ytWindow.YT?.Player;
      if (!Player) return;

      player = new Player(YT_CONTAINER_ID, {
        videoId: YT_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          loop: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          playlist: YT_VIDEO_ID
        },
        events: {
          onReady: () => {
            ready = true;
            startPlayback();
          }
        }
      });
    });

    window.addEventListener('pointerdown', unlockPlayback, { once: true });
    window.addEventListener('keydown', unlockPlayback, { once: true });

    return () => {
      disposed = true;
      window.removeEventListener('pointerdown', unlockPlayback);
      window.removeEventListener('keydown', unlockPlayback);
      ready = false;
      player?.destroy();
      player = null;
    };
  });
</script>

<div class="yt-audio-host" aria-hidden="true">
  <div id={YT_CONTAINER_ID}></div>
</div>

<slot />

<style>
  .yt-audio-host {
    position: fixed;
    inset: -9999px auto auto -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }
</style>
