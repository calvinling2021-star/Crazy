import { NicheCategory } from "@/lib/types";

export const niches: NicheCategory[] = [
  {
    id: "sleep",
    label: "Sleep Music",
    icon: "🌙",
    description:
      "The #1 earning niche. Listeners stream for 6–8 hours straight through the night, generating royalties while you sleep.",
    avgMonthlyStreams: "800K – 2M",
    avgMonthlyRevenue: "$3,200 – $8,000",
    color: "#3B82F6",
    promptTemplates: [
      {
        id: "sleep-1",
        label: "Ocean Waves Delta",
        prompt:
          "Slow deep ocean waves crashing gently, sub-bass rumble, delta binaural beats at 2Hz embedded subtly, absolutely no melody or rhythm, pure atmospheric texture, 58 BPM equivalent pacing, extremely smooth fade-ins and fade-outs, 60 minutes duration",
        tags: ["ocean", "delta waves", "binaural", "deep sleep", "no melody"],
      },
      {
        id: "sleep-2",
        label: "Rain on Glass",
        prompt:
          "Gentle rainfall on a window pane, distant thunder rumbles every few minutes, white noise underpinning, no music, just pure nature sounds layered with soft pink noise, 45 BPM pacing, hypnotic and deeply relaxing",
        tags: ["rain", "thunder", "white noise", "nature", "sleep"],
      },
      {
        id: "sleep-3",
        label: "Deep Resonance",
        prompt:
          "432Hz tuned deep resonant drone, slowly morphing tonal layers, Tibetan singing bowl overtones, no percussion, no melody, deeply meditative and sleep-inducing, sub-bass frequencies, 8 hours loopable",
        tags: ["432Hz", "drone", "singing bowl", "resonance", "deep sleep"],
      },
      {
        id: "sleep-4",
        label: "Forest Night",
        prompt:
          "Quiet forest at night, distant owl calls, soft cricket sounds, gentle breeze through leaves, absolutely no music or beats, pure nature soundscape, extremely peaceful and sleep-inducing",
        tags: ["forest", "nature", "crickets", "peaceful", "sleep"],
      },
    ],
  },
  {
    id: "meditation",
    label: "Meditation",
    icon: "🧘",
    description:
      "Consistent daily listeners build steady royalty streams. Guided meditation playlists generate millions of plays per month.",
    avgMonthlyStreams: "300K – 800K",
    avgMonthlyRevenue: "$1,200 – $3,200",
    color: "#8B5CF6",
    promptTemplates: [
      {
        id: "med-1",
        label: "Tibetan Bowls",
        prompt:
          "Authentic Tibetan singing bowls struck gently, long sustain, subtle reverb, spaced 30 seconds apart, silent space between strikes for breath awareness, 432Hz tuning, deeply meditative, no other instruments",
        tags: ["tibetan", "singing bowls", "432Hz", "meditation", "mindfulness"],
      },
      {
        id: "med-2",
        label: "Chakra Healing 528Hz",
        prompt:
          "Solfeggio frequency 528Hz DNA repair tone, gentle sine wave with harmonic overtones, slowly pulsing theta waves at 6Hz, minimal texture, healing meditation music, no percussion, serene and uplifting",
        tags: ["528Hz", "solfeggio", "chakra", "healing", "theta"],
      },
      {
        id: "med-3",
        label: "Morning Mindfulness",
        prompt:
          "Soft morning ambient music, gentle piano notes spaced far apart, nature sounds of birds waking, light breeze, optimistic and peaceful, alpha brainwave 10Hz binaural component, sunrise energy",
        tags: ["morning", "piano", "birds", "mindfulness", "alpha waves"],
      },
    ],
  },
  {
    id: "focus",
    label: "Focus & Study",
    icon: "🎯",
    description:
      "Students and remote workers play these for hours. Study playlists on Spotify regularly hit 1M+ monthly streams.",
    avgMonthlyStreams: "400K – 1.2M",
    avgMonthlyRevenue: "$1,600 – $4,800",
    color: "#F59E0B",
    promptTemplates: [
      {
        id: "focus-1",
        label: "Alpha Wave Deep Work",
        prompt:
          "Steady alpha binaural beat at 10Hz for focused concentration, soft ambient pad underneath, very subtle and non-distracting, engineered for 2-hour deep work sessions, no melodic elements, pure cognitive enhancement",
        tags: ["alpha waves", "binaural", "deep work", "concentration", "focus"],
      },
      {
        id: "focus-2",
        label: "Gamma Productivity 40Hz",
        prompt:
          "40Hz gamma wave isochronic tones for peak mental performance, subtle rhythmic pulsing embedded in ambient background, clinical frequency proven for cognitive enhancement, minimal and clean sound design",
        tags: ["40Hz", "gamma", "isochronic", "productivity", "cognitive"],
      },
      {
        id: "focus-3",
        label: "Study Flow State",
        prompt:
          "Instrumental study music, slow-tempo piano and soft synthesizer, no lyrics, no rhythm section, gentle harmonic progression that doesn't distract, designed for reading and writing, 72 BPM, 3 hours loopable",
        tags: ["piano", "instrumental", "study", "flow state", "no lyrics"],
      },
    ],
  },
  {
    id: "lofi",
    label: "Lo-fi Beats",
    icon: "🎵",
    description:
      "Massive playlist culture. Lo-fi playlists get added to millions of personal lists. High volume, consistent royalties.",
    avgMonthlyStreams: "500K – 3M",
    avgMonthlyRevenue: "$2,000 – $12,000",
    color: "#14B8A6",
    promptTemplates: [
      {
        id: "lofi-1",
        label: "Late Night Chill",
        prompt:
          "Classic lo-fi hip hop beats, vinyl crackle, muted jazz piano chords, simple kick-snare pattern at 80 BPM, tape hiss, warm bass, nostalgic and relaxed late-night bedroom atmosphere, Japanese city-pop influence",
        tags: ["lofi", "hip hop", "vinyl", "jazz", "chill"],
      },
      {
        id: "lofi-2",
        label: "Rainy Coffee Shop",
        prompt:
          "Lo-fi beats with ambient coffee shop sounds, rain outside the window, soft jazz guitar chords, gentle drums at 78 BPM, mellow bass, warm analog sound, perfect for studying or relaxing",
        tags: ["lofi", "rain", "coffee shop", "jazz", "study"],
      },
      {
        id: "lofi-3",
        label: "Nostalgic Lofi",
        prompt:
          "Nostalgic lo-fi beats, cassette tape warble, chopped soul sample feel, soft piano melody, 85 BPM, reverb-drenched snare, dusty and warm, emotional and melancholic but peaceful",
        tags: ["lofi", "nostalgic", "soul", "cassette", "melancholic"],
      },
    ],
  },
  {
    id: "ambient",
    label: "Ambient",
    icon: "🌌",
    description:
      "Long listening sessions in creative work playlists. Ambient tracks get placed in multiple editorial playlists simultaneously.",
    avgMonthlyStreams: "200K – 600K",
    avgMonthlyRevenue: "$800 – $2,400",
    color: "#10B981",
    promptTemplates: [
      {
        id: "amb-1",
        label: "Infinite Space",
        prompt:
          "Brian Eno-style ambient music, vast infinite space soundscape, slowly evolving synthesizer pads, glacial tempo, no rhythm, pure texture and atmosphere, cosmic and ethereal, Blade Runner influence, 20-minute gradual evolution",
        tags: ["ambient", "space", "eno-style", "synthesizer", "ethereal"],
      },
      {
        id: "amb-2",
        label: "Nordic Landscape",
        prompt:
          "Scandinavian-inspired ambient music, cold and vast landscape feeling, sparse piano notes in large reverb, icy wind textures, melancholic Nordic atmosphere, minimal, slow, cinematic",
        tags: ["ambient", "nordic", "piano", "cinematic", "minimal"],
      },
    ],
  },
  {
    id: "nature",
    label: "Nature Sounds",
    icon: "🌿",
    description:
      "Zero music theory needed. Record or source nature sounds, layer them — instant catalog. ASMR overlap drives massive discovery.",
    avgMonthlyStreams: "250K – 700K",
    avgMonthlyRevenue: "$1,000 – $2,800",
    color: "#22C55E",
    promptTemplates: [
      {
        id: "nat-1",
        label: "Amazon Rainforest",
        prompt:
          "Lush Amazon rainforest soundscape, tropical birds calling, distant howler monkeys, rain dripping from leaves, insects chirping, incredibly rich biodiversity of sound layers, no music whatsoever, pure immersive nature",
        tags: ["rainforest", "birds", "tropical", "nature", "immersive"],
      },
      {
        id: "nat-2",
        label: "Mountain Stream",
        prompt:
          "Clear mountain stream flowing over rocks, gentle water babbling, occasional bird calls, light breeze in pine trees, extremely peaceful and grounding, no music, pure nature immersion",
        tags: ["stream", "mountain", "birds", "peaceful", "water"],
      },
    ],
  },
];
