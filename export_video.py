"""
Exports motion_graphic.html to motion_graphic.mp4 using Playwright (headless Chromium).
Requires: pip install playwright && playwright install chromium
"""

import asyncio
import subprocess
import sys
import os
import tempfile

FPS = 30
DURATION = 12  # seconds
WIDTH, HEIGHT = 1280, 720
OUT_MP4 = "motion_graphic.mp4"
HTML_FILE = os.path.abspath("motion_graphic.html")


async def export():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("Playwright not found. Install with: pip install playwright && playwright install chromium")
        sys.exit(1)

    frames_dir = tempfile.mkdtemp(prefix="mgframes_")
    total_frames = FPS * DURATION

    print(f"Rendering {total_frames} frames at {FPS} fps …")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": WIDTH, "height": HEIGHT})
        await page.goto(f"file://{HTML_FILE}")
        await page.wait_for_timeout(300)

        # Freeze time via RAF override so we can step through frames
        await page.evaluate("""() => {
            window._frameTime = 0;
            const origRAF = window.requestAnimationFrame.bind(window);
            window.requestAnimationFrame = (cb) => {
                window._pendingCB = cb;
                return 1;
            };
            window.cancelAnimationFrame = () => {};
        }""")

        # Re-run render from scratch with controlled time
        await page.evaluate("""() => {
            startTime = null;
            paused = false;
        }""")

        frame_ms = 1000 / FPS

        for i in range(total_frames):
            t_ms = i * frame_ms
            await page.evaluate(f"""(tMs) => {{
                if (window._pendingCB) {{
                    window._pendingCB(tMs);
                    window._pendingCB = null;
                }}
            }}""", t_ms)

            path = os.path.join(frames_dir, f"frame_{i:05d}.png")
            await page.screenshot(path=path, clip={"x": 0, "y": 0, "width": WIDTH, "height": HEIGHT})

            if i % FPS == 0:
                print(f"  {i//FPS}/{DURATION}s", end="\r", flush=True)

        await browser.close()

    print(f"\nEncoding to {OUT_MP4} …")
    subprocess.run([
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(frames_dir, "frame_%05d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "slow",
        OUT_MP4
    ], check=True)

    # Cleanup frames
    import shutil
    shutil.rmtree(frames_dir)
    print(f"Done! Video saved to: {OUT_MP4}")


if __name__ == "__main__":
    asyncio.run(export())
