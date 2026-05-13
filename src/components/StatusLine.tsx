import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

const VERBS = [
  "Accomplishing","Actioning","Actualizing","Architecting","Baking","Beaming","Beboppin'",
  "Befuddling","Billowing","Blanching","Bloviating","Boogieing","Boondoggling","Booping",
  "Bootstrapping","Brewing","Bunning","Burrowing","Calculating","Canoodling","Caramelizing",
  "Cascading","Catapulting","Cerebrating","Channeling","Choreographing","Churning","Clauding",
  "Coalescing","Cogitating","Combobulating","Composing","Computing","Concocting","Considering",
  "Contemplating","Cooking","Crafting","Creating","Crunching","Crystallizing","Cultivating",
  "Deciphering","Deliberating","Determining","Dilly-dallying","Discombobulating","Doing",
  "Doodling","Drizzling","Ebbing","Effecting","Elucidating","Embellishing","Enchanting",
  "Envisioning","Evaporating","Fermenting","Fiddle-faddling","Finagling","Flambéing",
  "Flibbertigibbeting","Flowing","Flummoxing","Fluttering","Forging","Forming","Frolicking",
  "Frosting","Gallivanting","Galloping","Garnishing","Generating","Gesticulating","Germinating",
  "Gitifying","Grooving","Gusting","Harmonizing","Hashing","Hatching","Herding","Honking",
  "Hullaballooing","Hyperspacing","Ideating","Imagining","Improvising","Incubating","Inferring",
  "Infusing","Ionizing","Jitterbugging","Julienning","Kneading","Leavening","Levitating",
  "Lollygagging","Manifesting","Marinating","Meandering","Metamorphosing","Misting",
  "Moonwalking","Moseying","Mulling","Mustering","Musing","Nebulizing","Nesting","Newspapering",
  "Noodling","Nucleating","Orbiting","Orchestrating","Osmosing","Perambulating","Percolating",
  "Perusing","Philosophising","Photosynthesizing","Pollinating","Pondering","Pontificating",
  "Pouncing","Precipitating","Prestidigitating","Processing","Proofing","Propagating","Puttering",
  "Puzzling","Quantumizing","Razzle-dazzling","Razzmatazzing","Recombobulating","Reticulating",
  "Roosting","Ruminating","Sautéing","Scampering","Schlepping","Scurrying","Seasoning",
  "Shenaniganing","Shimmying","Simmering","Skedaddling","Sketching","Slithering","Smooshing",
  "Sock-hopping","Spelunking","Spinning","Sprouting","Stewing","Sublimating","Swirling",
  "Swooping","Symbioting","Synthesizing","Tempering","Thinking","Thundering","Tinkering",
  "Tomfoolering","Topsy-turvying","Transfiguring","Transmuting","Twisting","Undulating",
  "Unfurling","Unravelling","Vibing","Waddling","Wandering","Warping","Whatchamacalliting",
  "Whirlpooling","Whirring","Whisking","Wibbling","Working","Wrangling","Zesting","Zigzagging",
];

function useRotatingVerb(): string {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * VERBS.length));

  useEffect(() => {
    const handler = () => setIdx((i) => (i + 1) % VERBS.length);
    window.addEventListener("llama-cycle", handler);
    return () => window.removeEventListener("llama-cycle", handler);
  }, []);

  return VERBS[idx];
}

interface StatusLineProps {
  loading: boolean;
  error: string | null;
}

export function StatusLine({ loading, error }: StatusLineProps) {
  const verb = useRotatingVerb();

  const openSaltaDev = () => {
    invoke("open_url", { url: "https://www.salta.dev" }).catch(() => {});
  };

  const left = error ? (
    <p className="text-xs blink" style={{ color: "#ef4444" }}>
      * {error.substring(0, 28)}
    </p>
  ) : loading ? (
    <p className="text-xs blink" style={{ color: "#f97316" }}>
      * Syncing...
    </p>
  ) : (
    <p className="text-xs shimmer-text">
      * {verb}...
    </p>
  );

  return (
    <div className="flex items-center justify-between">
      {left}
      <button
        onClick={openSaltaDev}
        style={{ color: "#e5e7eb", fontSize: 10, lineHeight: 1, fontWeight: 500 }}
        className="hover:brightness-125 transition-all"
        title="SaltaDev — Comunidad de tecnología en Salta"
      >
        salta.dev
      </button>
    </div>
  );
}
