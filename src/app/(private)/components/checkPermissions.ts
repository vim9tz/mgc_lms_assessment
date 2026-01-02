export async function checkPermissions(): Promise<[boolean, string?]> {
  try {
    // 1. Mic check
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return [false, 'Microphone access denied'];
    }

    // 2. Camera check (with attach workaround)
    // try {
    //   const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    //   // Optional: Attach video to ensure permission doesn't get revoked
    //   const video = document.createElement('video');
    //   video.style.display = 'none';
    //   video.srcObject = stream;
    //   document.body.appendChild(video);
    //   await video.play();

    // } catch {
    //   return [false, 'Camera access denied'];
    // }

    // 3. Fullscreen support
    // if (!document.fullscreenEnabled) {
    //   return [false, 'Fullscreen not supported'];
    // }

    return [true];
  } catch (err: any) {
    console.error('Permissions check failed:', err);
    return [false, err.message || 'Permission error'];
  }
}
