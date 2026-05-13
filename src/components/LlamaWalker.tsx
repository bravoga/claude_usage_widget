import { useEffect, useState } from "react";
import paso1Src from "../../src-tauri/icons/paso1.png";
import mirandoSrc from "../../src-tauri/icons/mirando.png";
import frenteSrc from "../../src-tauri/icons/frente.png";

type Sprite = "paso1" | "paso2" | "mirando" | "frente";

const LLAMA_H = 52;

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.src = src;
  });
}

async function removeBg(src: string): Promise<string> {
  const img = await loadImg(src);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  const [bgR, bgG, bgB] = [px[0], px[1], px[2]];
  for (let i = 0; i < px.length; i += 4) {
    if (Math.abs(px[i] - bgR) + Math.abs(px[i + 1] - bgG) + Math.abs(px[i + 2] - bgB) < 60)
      px[i + 3] = 0;
  }
  ctx.putImageData(data, 0, 0);
  return c.toDataURL("image/png");
}

// Create paso2: same body/head, legs flipped horizontally (opposite stride)
async function buildPaso2(paso1DataUrl: string): Promise<string> {
  const img = await loadImg(paso1DataUrl);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  const splitY = Math.floor(H * 0.56); // split above the legs

  // Top half: body + head, unchanged
  ctx.drawImage(img, 0, 0, W, splitY, 0, 0, W, splitY);

  // Bottom half: legs flipped horizontally
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, splitY, W, H - splitY, 0, splitY, W, H - splitY);
  ctx.restore();

  return c.toDataURL("image/png");
}

export function LlamaWalker() {
  const [sprites, setSprites] = useState<Partial<Record<Sprite, string>>>({});
  const [visible, setVisible] = useState(false);
  const [leftPos, setLeftPos] = useState(-LLAMA_H);
  const [transitMs, setTransitMs] = useState(0);
  const [sprite, setSprite] = useState<Sprite>("paso1");
  const [walking, setWalking] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);

  useEffect(() => {
    (async () => {
      const [paso1, mirando, frente] = await Promise.all([
        removeBg(paso1Src),
        removeBg(mirandoSrc),
        removeBg(frenteSrc),
      ]);
      const paso2 = await buildPaso2(paso1);
      setSprites({ paso1, paso2, mirando, frente });
    })();
  }, []);

  // Alternate walk frames while walking
  useEffect(() => {
    if (!walking) return;
    const id = setInterval(() => setWalkFrame((f) => 1 - f), 220);
    return () => clearInterval(id);
  }, [walking]);

  useEffect(() => {
    if (Object.keys(sprites).length < 4) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    function t(delay: number, fn: () => void) {
      timers.push(setTimeout(fn, delay));
    }

    function cycle() {
      window.dispatchEvent(new CustomEvent("llama-cycle"));
      setTransitMs(0);
      setLeftPos(-LLAMA_H - 5);
      setSprite("paso1");
      setWalkFrame(0);
      setWalking(false);
      setVisible(true);

      t(60,   () => { setTransitMs(2600); setLeftPos(80); setWalking(true); });
      t(2700, () => { setWalking(false); setSprite("mirando"); });
      t(3600, () => setSprite("frente"));
      t(4900, () => setSprite("mirando"));
      // Resume walking — exits off the right edge (widget is 260px wide)
      t(5600, () => { setSprite("paso1"); setWalking(true); setTransitMs(3600); setLeftPos(270); });
      // Hidden once fully off screen — no fade
      t(9300, () => { setVisible(false); setWalking(false); });
      t(14000, cycle);
    }

    timers.push(setTimeout(cycle, 1500));
    return () => timers.forEach(clearTimeout);
  }, [sprites]);

  const activeSprite: Sprite = walking
    ? walkFrame === 0 ? "paso1" : "paso2"
    : sprite;

  const imgSrc = sprites[activeSprite] ?? "";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 2,
        left: leftPos,
        transition: `left ${transitMs}ms linear`,
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <img
        src={imgSrc}
        alt=""
        style={{
          display: "block",
          height: LLAMA_H,
          width: "auto",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
