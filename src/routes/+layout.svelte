<script lang="ts">
  import { onMount } from 'svelte';

  import '../app.css';

  const BGM_SRC =
    'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/a2/ef/37/a2ef371b-b320-f42e-37b4-93daf0baf2a6/mzaf_11111569349534040258.plus.aac.p.m4a';
  const BGM_VOLUME = 0.25;

  let backgroundAudio: HTMLAudioElement | null = null;

  const applyVolume = () => {
    if (!backgroundAudio) return;
    backgroundAudio.volume = BGM_VOLUME;
  };

  const startAudio = async () => {
    if (!backgroundAudio) return;

    applyVolume();

    try {
      await backgroundAudio.play();
    } catch {
      // Autoplay can be blocked until first user interaction.
    }
  };

  onMount(() => {
    applyVolume();
    void startAudio();

    const unlockAudio = () => {
      void startAudio();
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  });
</script>

<audio bind:this={backgroundAudio} src={BGM_SRC} loop preload="auto" playsinline aria-hidden="true"></audio>

<slot />
