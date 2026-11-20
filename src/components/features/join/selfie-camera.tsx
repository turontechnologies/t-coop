"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Passport-style shape: a bit taller than wide. */
const OUT_W = 640;
const OUT_H = 800;

const TIPS = [
  "Stand in front of a plain, light-coloured wall",
  "Face a window or a bright light",
  "Look straight at the camera",
  "No cap or sunglasses",
];

type CameraState = "starting" | "live" | "taken" | "error";

function cameraProblem(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Your browser did not allow the camera. Tap the camera sign near the web address, allow it, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "We couldn't find a camera on this device. Close this and choose a photo file instead.";
  if (name === "NotReadableError")
    return "Another app is using your camera. Close it and try again.";
  return "We couldn't open your camera. Close this and choose a photo file instead.";
}

/** Average brightness of the picture, 0 (black) to 255 (white). */
function brightness(ctx: CanvasRenderingContext2D): number {
  const { data } = ctx.getImageData(0, 0, OUT_W, OUT_H);
  let total = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4 * 16) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    count++;
  }
  return count ? total / count : 128;
}

/**
 * Lets someone without a passport photo take one with their own camera.
 * Shows a face outline and simple tips, then hands back a JPG file.
 */
export function SelfieCamera({
  open,
  onOpenChange,
  onCapture,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("starting");
  const [problem, setProblem] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [countdown, setCountdown] = useState(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    setPhoto(null);
    setWarning("");
    setState("starting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setProblem(
        "This browser can't open the camera. Close this and choose a photo file instead.",
      );
      setState("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setState("live");
    } catch (error) {
      setProblem(cameraProblem(error));
      setState("error");
    }
  }, [stop]);

  useEffect(() => {
    if (!open) {
      stop();
      return;
    }
    // Wait one frame so the <video> is on the page before we attach the camera.
    const frame = requestAnimationFrame(() => void start());
    return () => {
      cancelAnimationFrame(frame);
      stop();
    };
  }, [open, start, stop]);

  const snap = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Cut the middle of the camera picture to the passport shape.
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const target = OUT_W / OUT_H;
    let sw = vw;
    let sh = vw / target;
    if (sh > vh) {
      sh = vh;
      sw = vh * target;
    }
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
    const light = brightness(ctx);
    setWarning(
      light < 70
        ? "This photo looks dark. Move to a brighter place and take it again."
        : light > 220
          ? "This photo looks too bright. Move away from the light and take it again."
          : "",
    );
    setPhoto(canvas.toDataURL("image/jpeg", 0.9));
    setState("taken");
    stop();
  }, [stop]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      if (countdown === 1) snap();
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, snap]);

  const use = () => {
    canvasRef.current?.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(
          new File([blob], `passport-${Date.now()}.jpg`, {
            type: "image/jpeg",
          }),
        );
        onOpenChange(false);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setCountdown(0);
        onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take your passport photo</DialogTitle>
          <DialogDescription>
            Put your face inside the outline, then tap Take photo.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl bg-black">
          {/* Live camera, shown like a mirror so it feels natural. */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={
              state === "live" || state === "starting"
                ? "size-full -scale-x-100 object-cover"
                : "hidden"
            }
          />
          {photo && state === "taken" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="Your new photo"
              className="size-full object-cover"
            />
          ) : null}

          {state === "live" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[68%] w-[62%] -translate-y-[4%] rounded-[50%] border-2 border-dashed border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
          ) : null}

          {state === "live" && countdown > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl font-bold text-white drop-shadow-lg">
                {countdown}
              </span>
            </div>
          ) : null}

          {state === "starting" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-white/80">
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              Opening your camera…
            </div>
          ) : null}

          {state === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
              <Camera className="size-8 opacity-70" aria-hidden="true" />
              {problem}
            </div>
          ) : null}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {state === "taken" ? (
          warning ? (
            <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              {warning}
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Is your face clear and straight? If yes, use this photo.
            </p>
          )
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-1.5">
                <span aria-hidden="true">•</span>
                {tip}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {state === "taken" ? (
            <>
              <Button variant="outline" onClick={() => void start()}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Take again
              </Button>
              <Button onClick={use}>Use this photo</Button>
            </>
          ) : state === "error" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => void start()}>Try again</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={state !== "live" || countdown > 0}
                onClick={() => setCountdown(3)}
              >
                Use a 3-second timer
              </Button>
              <Button
                disabled={state !== "live" || countdown > 0}
                onClick={snap}
              >
                <Camera className="size-4" aria-hidden="true" />
                Take photo
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
