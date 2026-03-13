import { useState, useEffect, useRef, useCallback } from "react";

// ─── Color palette & fonts injected via style tag ───────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d0f14;
      --surface: #161920;
      --surface2: #1e2230;
      --border: #2a2f42;
      --accent: #f5a623;
      --accent2: #e05c3a;
      --green: #3ecf8e;
      --red: #f06060;
      --text: #e8eaf0;
      --muted: #7a7f94;
      --radius: 14px;
    }

    body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

    .app { max-width: 900px; margin: 0 auto; padding: 24px 16px 60px; }

    /* Header */
    .header { display: flex; align-items: center; gap: 14px; margin-bottom: 36px; }
    .header-icon { width: 44px; height: 44px; background: var(--accent); border-radius: 10px; display: grid; place-items: center; font-size: 22px; flex-shrink: 0; }
    .header h1 { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
    .header p { font-size: 0.82rem; color: var(--muted); margin-top: 2px; }

    /* Nav tabs */
    .nav { display: flex; gap: 6px; margin-bottom: 28px; background: var(--surface); border-radius: var(--radius); padding: 5px; }
    .nav-tab { flex: 1; padding: 9px 10px; border-radius: 10px; border: none; background: transparent; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .nav-tab.active { background: var(--surface2); color: var(--text); }
    .nav-tab:hover:not(.active) { color: var(--text); }

    /* Chapter selector */
    .chapter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; margin-bottom: 24px; }
    .chapter-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 14px; cursor: pointer; transition: all 0.18s; }
    .chapter-card:hover { border-color: var(--accent); transform: translateY(-1px); }
    .chapter-card.selected { border-color: var(--accent); background: #1e1a12; }
    .chapter-card .ch-num { font-family: 'Syne', sans-serif; font-size: 0.7rem; font-weight: 700; color: var(--accent); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 5px; }
    .chapter-card .ch-title { font-size: 0.82rem; font-weight: 500; line-height: 1.35; }
    .chapter-card .ch-score { margin-top: 8px; font-size: 0.75rem; color: var(--muted); }
    .ch-bar { height: 3px; background: var(--border); border-radius: 99px; margin-top: 6px; overflow: hidden; }
    .ch-bar-fill { height: 100%; background: var(--green); border-radius: 99px; transition: width 0.4s; }

    /* Flashcard */
    .fc-wrap { perspective: 1200px; }
    .fc { position: relative; width: 100%; min-height: 260px; cursor: pointer; }
    .fc-inner { position: relative; width: 100%; min-height: 260px; transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1); transform-style: preserve-3d; }
    .fc.flipped .fc-inner { transform: rotateY(180deg); }
    .fc-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: var(--radius); padding: 32px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
    .fc-front { background: var(--surface); border: 1.5px solid var(--border); }
    .fc-back { background: #121d17; border: 1.5px solid #2a4238; transform: rotateY(180deg); }
    .fc-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; color: var(--muted); }
    .fc-front .fc-label { color: var(--accent); }
    .fc-back .fc-label { color: var(--green); }
    .fc-q { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700; line-height: 1.4; }
    .fc-a { font-size: 1rem; line-height: 1.6; color: #c5e8d8; }
    .fc-hint { font-size: 0.75rem; color: var(--muted); margin-top: 20px; }

    .fc-controls { display: flex; gap: 10px; margin-top: 16px; justify-content: center; }
    .fc-nav { display: flex; align-items: center; gap: 14px; margin-top: 20px; justify-content: center; }
    .fc-counter { font-size: 0.82rem; color: var(--muted); min-width: 70px; text-align: center; }
    .fc-progress { height: 3px; background: var(--border); border-radius: 99px; margin-top: 14px; overflow: hidden; }
    .fc-progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 99px; transition: width 0.3s; }

    /* Quiz */
    .quiz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .quiz-timer { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; color: var(--accent); }
    .quiz-timer.warn { color: var(--red); animation: pulse 0.8s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .quiz-q-num { font-size: 0.8rem; color: var(--muted); }

    .quiz-question { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 28px; margin-bottom: 16px; }
    .quiz-question h3 { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 700; line-height: 1.5; }
    .quiz-question .q-chapter { font-size: 0.72rem; color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }

    .quiz-options { display: grid; gap: 8px; }
    .quiz-opt { background: var(--surface); border: 1.5px solid var(--border); border-radius: 10px; padding: 14px 18px; text-align: left; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; color: var(--text); display: flex; align-items: center; gap: 12px; }
    .quiz-opt:hover:not(:disabled) { border-color: var(--accent); background: #1a1710; }
    .quiz-opt.correct { border-color: var(--green); background: #0d1f18; color: var(--green); }
    .quiz-opt.wrong { border-color: var(--red); background: #1f0d0d; color: var(--red); }
    .quiz-opt:disabled { cursor: default; }
    .opt-letter { width: 26px; height: 26px; border-radius: 6px; background: var(--border); display: grid; place-items: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .quiz-opt.correct .opt-letter { background: var(--green); color: #0d1f18; }
    .quiz-opt.wrong .opt-letter { background: var(--red); color: #1f0d0d; }

    .quiz-explanation { background: #121d17; border: 1.5px solid #2a4238; border-radius: 10px; padding: 14px 18px; font-size: 0.85rem; color: #c5e8d8; margin-top: 12px; line-height: 1.6; }

    /* Results */
    .results { text-align: center; padding: 40px 20px; }
    .results-score { font-family: 'Syne', sans-serif; font-size: 5rem; font-weight: 800; line-height: 1; margin-bottom: 6px; }
    .results-score.pass { color: var(--green); }
    .results-score.fail { color: var(--red); }
    .results-label { font-size: 1rem; color: var(--muted); margin-bottom: 30px; }
    .results-breakdown { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; text-align: left; margin-bottom: 28px; }
    .rb-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 14px; }
    .rb-card .rb-ch { font-size: 0.72rem; color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .rb-card .rb-score { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; }

    /* AI Generator */
    .ai-section { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 22px; margin-top: 20px; }
    .ai-section h3 { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .ai-badge { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 99px; letter-spacing: 0.06em; text-transform: uppercase; }
    .ai-section p { font-size: 0.83rem; color: var(--muted); margin-bottom: 14px; line-height: 1.5; }

    /* Buttons */
    .btn { padding: 10px 20px; border-radius: 10px; border: none; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 500; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 7px; }
    .btn-primary { background: var(--accent); color: #0d0f14; font-weight: 700; }
    .btn-primary:hover { background: #f7b844; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-ghost { background: var(--surface2); color: var(--text); border: 1.5px solid var(--border); }
    .btn-ghost:hover { border-color: var(--muted); }
    .btn-sm { padding: 7px 14px; font-size: 0.8rem; }
    .btn-icon { width: 38px; height: 38px; padding: 0; border-radius: 10px; background: var(--surface2); color: var(--muted); border: 1.5px solid var(--border); display: grid; place-items: center; cursor: pointer; font-size: 1rem; transition: all 0.15s; }
    .btn-icon:hover { color: var(--text); border-color: var(--muted); }

    /* Stats bar */
    .stats-row { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat-chip { background: var(--surface); border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; }
    .stat-chip .s-icon { font-size: 1.1rem; }
    .stat-chip .s-val { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; }
    .stat-chip .s-label { font-size: 0.75rem; color: var(--muted); }

    /* Loading */
    .loading { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 0.85rem; padding: 16px 0; }
    .spinner { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Misc */
    select { background: var(--surface2); color: var(--text); border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 12px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; }
    .divider { height: 1px; background: var(--border); margin: 20px 0; }
    .empty { color: var(--muted); font-size: 0.85rem; text-align: center; padding: 30px; }
    .tag { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.05em; }
    .tag-orange { background: #2a1e0a; color: var(--accent); }
    .tag-green { background: #0d1f18; color: var(--green); }
    .tag-red { background: #1f0d0d; color: var(--red); }
    .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .gap { flex: 1; }
  `}</style>
);

// ─── Seed data ───────────────────────────────────────────────────────────────
const CHAPTERS = [
  { id: 1, title: "Applying for Your License", short: "Licensing" },
  { id: 2, title: "Restrictions & Renewals", short: "Renewals" },
  { id: 3, title: "Requirements for Drivers", short: "Requirements" },
  { id: 4, title: "Signs, Signals & Markings", short: "Signs" },
  { id: 5, title: "Right-of-Way", short: "Right-of-Way" },
  { id: 6, title: "Lanes, Turning & Passing", short: "Turning" },
  { id: 7, title: "Speed", short: "Speed" },
  { id: 8, title: "Stopping & Following", short: "Stopping" },
  { id: 9, title: "Parking", short: "Parking" },
  { id: 10, title: "Sharing the Road", short: "Sharing" },
  { id: 11, title: "Hazardous Conditions", short: "Hazards" },
  { id: 12, title: "Alcohol & Drugs", short: "DUI Laws" },
];

const SEED_QUESTIONS = [
  // Ch4 – Signs
  { id: "s1", chapter: 4, question: "What shape and color is a WARNING sign?", options: ["Rectangle, white and black", "Diamond, yellow and black", "Octagon, red", "Triangle, red and white"], answer: 1, explanation: "Warning signs are diamond-shaped with a yellow background and black letters, signaling hazards or changes in road conditions ahead." },
  { id: "s2", chapter: 4, question: "What does a flashing RED traffic light mean?", options: ["Slow down and proceed", "Stop completely; proceed when safe", "Yield to cross traffic only", "The light is out of order"], answer: 1, explanation: "A flashing red light means treat it like a STOP sign — come to a complete stop and proceed only when safe." },
  { id: "s3", chapter: 4, question: "Construction and maintenance warning signs are what color?", options: ["Yellow", "Orange", "Red", "Blue"], answer: 1, explanation: "Orange signs mean you are entering or are in a work zone. Fines are doubled for speeding in work zones when workers are present." },
  { id: "s4", chapter: 4, question: "A solid yellow line on YOUR side of center means:", options: ["Passing is permitted when safe", "You may pass slow vehicles", "DO NOT pass — no crossing", "Two-way traffic begins"], answer: 2, explanation: "A solid yellow line in your lane tells you not to cross it for passing. It's dangerous to do so." },
  { id: "s5", chapter: 4, question: "Guide signs giving highway and distance information are which color?", options: ["Blue", "Brown", "Green", "White"], answer: 2, explanation: "Green guide signs identify highways, show distances, and mark exits on the highway system." },
  // Ch5 – Right of way
  { id: "r1", chapter: 5, question: "At an uncontrolled intersection (no signs/signals), you must:", options: ["Always go first since you were there first", "Yield to vehicles approaching from the right", "Yield to vehicles approaching from the left", "Honk to claim the right-of-way"], answer: 1, explanation: "When two vehicles arrive at an uncontrolled intersection at the same time, yield to the vehicle on your right." },
  { id: "r2", chapter: 5, question: "Failing to stop for a school bus with red lights flashing results in:", options: ["A $50 fine", "A warning on first offense", "Mandatory one-year license revocation", "30 days license suspension"], answer: 2, explanation: "Oklahoma law requires mandatory one-year license revocation for failing to stop for a school bus displaying flashing red lights." },
  { id: "r3", chapter: 5, question: "The 'Move Over' law requires drivers approaching an emergency scene to:", options: ["Speed up to clear the area quickly", "Stop completely until all personnel leave", "Change lanes away or slow down with caution", "Honk and proceed normally"], answer: 2, explanation: "Move Over laws protect emergency responders — change lanes away from the scene if possible, or slow down and proceed with caution." },
  // Ch6 – Turning/lanes
  { id: "t1", chapter: 6, question: "How far in advance must you signal before turning or changing lanes?", options: ["50 feet or before intersection", "100 feet or 1/3 of a block", "200 feet or 1/2 block", "At the intersection itself"], answer: 1, explanation: "Oklahoma law requires signaling at least 100 feet (or 1/3 of a block) before turning, slowing, or stopping." },
  { id: "t2", chapter: 6, question: "When passing another vehicle on the left, you need at least how much clear roadway ahead?", options: ["100 feet", "150 feet", "200 feet", "300 feet"], answer: 2, explanation: "Before passing on the left, confirm at least 200 feet of clear roadway ahead and no No Passing Zone." },
  { id: "t3", chapter: 6, question: "When backing up, you should look:", options: ["Only in the rearview mirror", "Only using backup camera", "Directly through the rear window", "At the side mirrors alternately"], answer: 2, explanation: "When backing, grasp the steering wheel at 12 o'clock with your left hand, place your right arm on the seat back, and look directly through the rear window. Never rely solely on mirrors." },
  // Ch7 – Speed
  { id: "sp1", chapter: 7, question: "What is the default speed limit on controlled-access highways in Oklahoma (unless posted)?", options: ["55 mph", "65 mph", "70 mph", "75 mph"], answer: 3, explanation: "The default speed limit on controlled-access highways is 75 mph. Turnpikes have a higher default of 80 mph." },
  { id: "sp2", chapter: 7, question: "What is the speed limit in an unposted school zone outside a municipality when yellow lights are flashing?", options: ["15 mph", "20 mph", "25 mph", "35 mph"], answer: 2, explanation: "School zones on highways outside municipalities have a 25 mph limit when the yellow light is flashing." },
  { id: "sp3", chapter: 7, question: "The 'Basic Speed Rule' means:", options: ["Never exceed 65 mph under any condition", "Drive at the posted limit regardless of conditions", "Drive at a speed safe for current conditions, even if below the limit", "The posted limit is the minimum safe speed"], answer: 2, explanation: "The Basic Speed Rule says your speed must be reasonable and prudent for the actual conditions — traffic, road surface, visibility, weather — even if that means going below the posted limit." },
  // Ch8 – Stopping/following
  { id: "f1", chapter: 8, question: "On the expressway, you should stay at least ___ seconds behind the vehicle ahead.", options: ["1 second", "2 seconds", "3 seconds", "5 seconds"], answer: 2, explanation: "Keep 3 seconds following distance on the expressway; increase to 4 seconds in bad weather." },
  { id: "f2", chapter: 8, question: "When driving on ice or snow, if you must brake you should:", options: ["Press the brake pedal hard and hold", "Tap the brakes lightly about one second apart", "Shift to neutral and coast to a stop", "Pump the antilock brakes rapidly"], answer: 1, explanation: "On slippery surfaces (except with antilock brakes), tap the brakes lightly about one second apart to avoid skidding. Never tap antilock brakes." },
  { id: "f3", chapter: 8, question: "Hydroplaning means:", options: ["Your engine overheats in rain", "Your tires lose contact with the road and ride on a film of water", "Your windshield fogs up dangerously", "Your brakes fail due to water"], answer: 1, explanation: "Hydroplaning occurs when tires ride on a water film, losing traction and increasing stopping distance. Wide tires can hydroplane even at low speeds." },
  // Ch12 – DUI
  { id: "d1", chapter: 12, question: "A first DUI conviction in Oklahoma results in license suspension of:", options: ["30 days", "90 days", "180 days", "1 year"], answer: 2, explanation: "A first DUI revocation results in a 180-day suspension. A second within 10 years results in 1 year; two or more prior revocations within 10 years results in 2 years." },
  // Ch3 – Requirements
  { id: "req1", chapter: 3, question: "Oklahoma's seat belt law requires seat belts to be worn by:", options: ["Only front seat passengers", "Only the driver", "All occupants in all seats", "Children under 12 only"], answer: 2, explanation: "Oklahoma's mandatory safety requirements require all occupants to wear seat belts. Child passenger restraint systems are additionally required for young children." },
  // Ch10 – Sharing road
  { id: "sh1", chapter: 10, question: "When passing a bicyclist, you must leave a minimum safe distance of:", options: ["1 foot", "2 feet", "3 feet", "5 feet"], answer: 2, explanation: "Oklahoma law (Title 47-11-1208-A) requires at least 3 feet of clearance when passing a bicycle until you are safely past." },
];

const FLASHCARDS = [
  { id: "fc1", chapter: 4, front: "What shape is a STOP sign?", back: "An octagon (8-sided) with a red background and white letters. Come to a complete stop before the crosswalk." },
  { id: "fc2", chapter: 4, front: "What do yellow dashed center lines mean?", back: "Traffic moves in opposite directions. Passing is permitted when it is safe to do so." },
  { id: "fc3", chapter: 4, front: "What do white dashed lane lines mean?", back: "Traffic moves in the SAME direction on each side. Passing or lane changes are permitted when safe." },
  { id: "fc4", chapter: 4, front: "What does a YIELD sign look like?", back: "A red and white triangle (pointing down). Slow down, be ready to stop, and let oncoming vehicles pass before entering." },
  { id: "fc5", chapter: 5, front: "When must you always yield right-of-way?", back: "When entering highways without signs/signals, when you have a stop sign, at yield signs, to pedestrians, to emergency vehicles with lights/sirens, and to school/church buses with flashing red lights." },
  { id: "fc6", chapter: 6, front: "Six steps for making a safe turn?", back: "1) Look for following cars  2) Move to correct lane  3) Signal 100 ft ahead  4) Select proper gear  5) Look both ways  6) Enter the new lane correctly" },
  { id: "fc7", chapter: 7, front: "Oklahoma turnpike default speed limit?", back: "80 mph (unless otherwise posted). Controlled-access highways: 75 mph. Undivided state highways: 65 mph." },
  { id: "fc8", chapter: 7, front: "What is the Basic Speed Rule?", back: "Drive at a speed that is reasonable and safe for current conditions — traffic, road surface, visibility, and weather — even if below the posted limit." },
  { id: "fc9", chapter: 8, front: "Three steps of stopping a vehicle?", back: "1) Perception (~0.5 sec) — see/hear danger  2) Reaction (~0.66 sec) — brain tells foot to brake  3) Braking — press brake until stopped" },
  { id: "fc10", chapter: 8, front: "What is hydroplaning and how do you prevent it?", back: "Hydroplaning = tires ride on a water film, losing traction. Prevent it by slowing down on wet roads. Never drive into water crossing the road." },
  { id: "fc11", chapter: 4, front: "What color and shape are construction/work zone signs?", back: "Orange diamond (or rectangle). Speeding fines are DOUBLED in work zones when workers or equipment are present." },
  { id: "fc12", chapter: 12, front: "What is the legal BAC limit for drivers 21+ in Oklahoma?", back: "0.08% BAC. For commercial drivers: 0.04%. For drivers under 21: 0.02% (zero tolerance)." },
  { id: "fc13", chapter: 5, front: "What does the 'Move Over' law require?", back: "When approaching a Traffic Incident Management (TIM) scene, change lanes away from responders if possible, OR slow down significantly and proceed with caution." },
  { id: "fc14", chapter: 6, front: "Minimum following distance on an expressway?", back: "3 seconds under normal conditions. 4 seconds in bad weather. Count seconds after the car ahead passes a fixed point." },
  { id: "fc15", chapter: 10, front: "Minimum clearance when passing a bicyclist?", back: "3 feet — required by Oklahoma law (Title 47-11-1208-A) until you are safely past the bicycle." },
];

const CHAPTER_CONTEXT = {
  4: "Oklahoma signs, signals, and pavement markings — sign shapes, colors, and meanings; traffic light rules; lane markings.",
  5: "Right-of-way rules — intersections, yield, pedestrians, school buses, emergency vehicles, Move Over law.",
  6: "Lanes, turning, passing, backing — lane change procedures, turning signals, expressway driving, passing rules.",
  7: "Speed limits — Basic Speed Rule, Oklahoma state speed limits (turnpike 80mph, controlled access 75mph, undivided highways 65mph), night driving.",
  8: "Stopping and following distance — perception/reaction/braking, 3-second rule, hydroplaning, emergency braking on ice/wet roads.",
  12: "Alcohol and drugs — BAC limits (0.08 for adults, 0.04 commercial, 0.02 under 21), DUI penalties (180 days first offense), additional costs.",
  3: "Driver requirements — seat belts required for all occupants, child restraint systems, insurance requirements.",
  10: "Sharing the road — 3 feet clearance for bicyclists, pedestrian rights, large trucks.",
};

// ─── Utility helpers ─────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── API call to Claude ───────────────────────────────────────────────────────
async function generateQuestionsFromClaude(chapterId, count = 3) {
  const chapterInfo = CHAPTERS.find((c) => c.id === chapterId);
  const context = CHAPTER_CONTEXT[chapterId] || chapterInfo?.title;

  const prompt = `You are helping someone study for the Oklahoma Driver's Permit exam.
Generate ${count} multiple-choice questions about: "${chapterInfo?.title}" — specifically covering: ${context}

Rules:
- Each question must be factually accurate to Oklahoma driving law
- 4 answer options (A-D), exactly one correct answer
- Include a brief explanation (1-2 sentences) of why the correct answer is right
- Questions should vary in difficulty
- Do NOT repeat these already-covered topics: ${SEED_QUESTIONS.filter(q => q.chapter === chapterId).map(q => q.question).join("; ")}

Respond ONLY with a JSON array, no markdown, no preamble:
[
  {
    "question": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "answer": 0,
    "explanation": "..."
  }
]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  return parsed.map((q, i) => ({
    ...q,
    id: `ai_${chapterId}_${Date.now()}_${i}`,
    chapter: chapterId,
  }));
}

// ─── Components ───────────────────────────────────────────────────────────────

function ChapterSelector({ selectedChapters, onToggle, scores }) {
  return (
    <div className="chapter-grid">
      {CHAPTERS.map((ch) => {
        const score = scores[ch.id];
        const pct = score ? Math.round((score.correct / score.total) * 100) : null;
        return (
          <div
            key={ch.id}
            className={`chapter-card ${selectedChapters.includes(ch.id) ? "selected" : ""}`}
            onClick={() => onToggle(ch.id)}
          >
            <div className="ch-num">Ch {ch.id}</div>
            <div className="ch-title">{ch.short}</div>
            {pct !== null && (
              <>
                <div className="ch-score">{score.correct}/{score.total} correct</div>
                <div className="ch-bar"><div className="ch-bar-fill" style={{ width: `${pct}%` }} /></div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Flashcard Mode ────────────────────────────────────────────────────────────
function FlashcardMode({ scores }) {
  const [selectedChapters, setSelectedChapters] = useState([4, 5, 6, 7]);
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());

  const toggleChapter = (id) => setSelectedChapters((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const startDeck = () => {
    const filtered = shuffle(FLASHCARDS.filter((fc) => selectedChapters.includes(fc.chapter)));
    setCards(filtered);
    setIdx(0);
    setFlipped(false);
    setKnown(new Set());
  };

  useEffect(() => { startDeck(); }, [selectedChapters]);

  if (!cards.length) return <div className="empty">Select chapters above to load flashcards.</div>;

  const card = cards[idx];
  const pct = Math.round(((idx) / cards.length) * 100);

  const go = (dir) => {
    setFlipped(false);
    setTimeout(() => setIdx((i) => Math.max(0, Math.min(cards.length - 1, i + dir))), 200);
  };

  const markKnown = (v) => {
    setKnown((p) => { const s = new Set(p); v ? s.add(card.id) : s.delete(card.id); return s; });
    if (idx < cards.length - 1) go(1);
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 16 }}>
        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Select chapters:</span>
        <div className="gap" />
        <span className="tag tag-green">{known.size} known</span>
        <span className="tag tag-orange">{cards.length - known.size} studying</span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {CHAPTERS.map((ch) => (
          <button key={ch.id} className={`btn btn-sm ${selectedChapters.includes(ch.id) ? "btn-primary" : "btn-ghost"}`} onClick={() => toggleChapter(ch.id)}>
            Ch {ch.id}
          </button>
        ))}
      </div>

      <div className="fc-progress"><div className="fc-progress-fill" style={{ width: `${pct}%` }} /></div>

      <div style={{ marginTop: 14 }}>
        <div className={`fc-wrap fc ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)} style={{ minHeight: 260 }}>
          <div className="fc-inner" style={{ minHeight: 260 }}>
            <div className="fc-face fc-front">
              <div className="fc-label">Question · Ch {card.chapter}</div>
              <div className="fc-q">{card.front}</div>
              <div className="fc-hint">Tap to reveal answer</div>
            </div>
            <div className="fc-face fc-back">
              <div className="fc-label">Answer</div>
              <div className="fc-a">{card.back}</div>
            </div>
          </div>
        </div>

        {flipped && (
          <div className="fc-controls">
            <button className="btn btn-ghost" style={{ color: "var(--red)", borderColor: "var(--red)" }} onClick={() => markKnown(false)}>
              ✕ Still learning
            </button>
            <button className="btn btn-ghost" style={{ color: "var(--green)", borderColor: "var(--green)" }} onClick={() => markKnown(true)}>
              ✓ Got it
            </button>
          </div>
        )}

        <div className="fc-nav">
          <button className="btn-icon" onClick={() => go(-1)} disabled={idx === 0}>←</button>
          <span className="fc-counter">{idx + 1} / {cards.length}</span>
          <button className="btn-icon" onClick={() => go(1)} disabled={idx === cards.length - 1}>→</button>
        </div>
      </div>
    </div>
  );
}

// ── Quiz / Practice Test ──────────────────────────────────────────────────────
function QuizMode({ onScoreUpdate }) {
  const [phase, setPhase] = useState("setup"); // setup | quiz | results
  const [selectedChapters, setSelectedChapters] = useState([4, 5, 6, 7, 8]);
  const [questionCount, setQuestionCount] = useState(20);
  const [timed, setTimed] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [extraAiQs, setExtraAiQs] = useState([]);
  const timerRef = useRef(null);

  const toggleChapter = (id) => setSelectedChapters((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const startQuiz = () => {
    const pool = shuffle(SEED_QUESTIONS.filter((q) => selectedChapters.includes(q.chapter))).slice(0, questionCount);
    setQuestions(pool);
    setAnswers({});
    setRevealed({});
    setCurrent(0);
    setTimeLeft(questionCount * 60);
    setPhase("quiz");
  };

  useEffect(() => {
    if (phase === "quiz" && timed) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current); setPhase("results"); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, timed]);

  const answer = (qi, opt) => {
    if (answers[qi] !== undefined) return;
    setAnswers((p) => ({ ...p, [qi]: opt }));
    setRevealed((p) => ({ ...p, [qi]: true }));
  };

  const finishQuiz = () => {
    clearInterval(timerRef.current);
    // calculate chapter scores
    const chapterMap = {};
    questions.forEach((q, i) => {
      if (!chapterMap[q.chapter]) chapterMap[q.chapter] = { correct: 0, total: 0 };
      chapterMap[q.chapter].total++;
      if (answers[i] === q.answer) chapterMap[q.chapter].correct++;
    });
    onScoreUpdate(chapterMap);
    setPhase("results");
  };

  const correct = questions.filter((q, i) => answers[i] === q.answer).length;
  const answered = Object.keys(answers).length;
  const passPct = Math.round((correct / Math.max(questions.length, 1)) * 100);

  const generateAI = async (chapterId) => {
    setAiLoading(true);
    setAiError("");
    try {
      const qs = await generateQuestionsFromClaude(chapterId, 3);
      setExtraAiQs((p) => [...p, ...qs]);
    } catch (e) {
      setAiError("Couldn't generate questions. Make sure you're using the app through Claude.ai.");
    } finally {
      setAiLoading(false);
    }
  };

  if (phase === "setup") return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: 12 }}>Select chapters to include:</div>
        <ChapterSelector selectedChapters={selectedChapters} onToggle={toggleChapter} scores={{}} />
      </div>
      <div className="row" style={{ marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 6 }}>Questions</label>
          <select value={questionCount} onChange={(e) => setQuestionCount(+e.target.value)}>
            <option value={10}>10 questions</option>
            <option value={20}>20 questions</option>
            <option value={30}>30 questions</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 6 }}>Timed</label>
          <select value={timed ? "yes" : "no"} onChange={(e) => setTimed(e.target.value === "yes")}>
            <option value="yes">Yes (1 min/question)</option>
            <option value="no">No timer</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" onClick={startQuiz} disabled={selectedChapters.length === 0}>
        Start Practice Test →
      </button>

      {/* AI question generator */}
      <div className="ai-section" style={{ marginTop: 28 }}>
        <h3>Generate AI Questions <span className="ai-badge">AI</span></h3>
        <p>Use Claude to create fresh questions for any chapter. Generated questions will be added to your next quiz automatically.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[4, 5, 6, 7, 8, 12].map((ch) => (
            <button key={ch} className="btn btn-ghost btn-sm" onClick={() => generateAI(ch)} disabled={aiLoading}>
              Ch {ch}: {CHAPTERS.find(c => c.id === ch)?.short}
            </button>
          ))}
        </div>
        {aiLoading && <div className="loading"><div className="spinner" /> Generating questions with Claude...</div>}
        {aiError && <div style={{ color: "var(--red)", fontSize: "0.8rem", marginTop: 8 }}>{aiError}</div>}
        {extraAiQs.length > 0 && (
          <div style={{ marginTop: 10, fontSize: "0.82rem", color: "var(--green)" }}>
            ✓ {extraAiQs.length} AI-generated question{extraAiQs.length !== 1 ? "s" : ""} ready for your next quiz
          </div>
        )}
      </div>
    </div>
  );

  if (phase === "quiz") {
    const q = questions[current];
    const isRevealed = !!revealed[current];
    return (
      <div>
        <div className="quiz-header">
          <div>
            <div className="quiz-q-num">Question {current + 1} of {questions.length}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>{answered} answered</div>
          </div>
          {timed && (
            <div className={`quiz-timer ${timeLeft < 30 ? "warn" : ""}`}>{fmtTime(timeLeft)}</div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--border)", borderRadius: 99, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(answered / questions.length) * 100}%`, background: "linear-gradient(90deg, var(--accent), var(--accent2))", borderRadius: 99, transition: "width 0.3s" }} />
        </div>

        <div className="quiz-question">
          <div className="q-chapter">Chapter {q.chapter} · {CHAPTERS.find(c => c.id === q.chapter)?.short}</div>
          <h3>{q.question}</h3>
        </div>

        <div className="quiz-options">
          {q.options.map((opt, i) => {
            let cls = "quiz-opt";
            if (isRevealed) {
              if (i === q.answer) cls += " correct";
              else if (i === answers[current] && i !== q.answer) cls += " wrong";
            }
            return (
              <button key={i} className={cls} onClick={() => answer(current, i)} disabled={isRevealed}>
                <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {isRevealed && q.explanation && (
          <div className="quiz-explanation">💡 {q.explanation}</div>
        )}

        <div className="row" style={{ marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>← Prev</button>
          <div className="gap" />
          {current < questions.length - 1
            ? <button className="btn btn-primary" onClick={() => setCurrent((c) => c + 1)}>Next →</button>
            : <button className="btn btn-primary" onClick={finishQuiz}>Finish Test</button>
          }
        </div>
      </div>
    );
  }

  // Results
  const chapterResults = {};
  questions.forEach((q, i) => {
    if (!chapterResults[q.chapter]) chapterResults[q.chapter] = { correct: 0, total: 0 };
    chapterResults[q.chapter].total++;
    if (answers[i] === q.answer) chapterResults[q.chapter].correct++;
  });

  return (
    <div className="results">
      <div className={`results-score ${passPct >= 70 ? "pass" : "fail"}`}>{passPct}%</div>
      <div className="results-label">{correct} of {questions.length} correct · {passPct >= 70 ? "🎉 Passing score!" : "Keep studying — need 70% to pass"}</div>
      <div className="results-breakdown">
        {Object.entries(chapterResults).map(([ch, s]) => {
          const p = Math.round((s.correct / s.total) * 100);
          return (
            <div key={ch} className="rb-card">
              <div className="rb-ch">Ch {ch}: {CHAPTERS.find(c => c.id === +ch)?.short}</div>
              <div className={`rb-score`} style={{ color: p >= 70 ? "var(--green)" : "var(--red)" }}>{p}%</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 3 }}>{s.correct}/{s.total}</div>
            </div>
          );
        })}
      </div>
      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={() => setPhase("setup")}>Try Again</button>
        <button className="btn btn-ghost" onClick={() => { setPhase("setup"); }}>Change Settings</button>
      </div>
    </div>
  );
}

// ── Chapter Overview ──────────────────────────────────────────────────────────
function OverviewMode({ scores, onScoreUpdate }) {
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [aiQs, setAiQs] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const generate = async () => {
    if (!selectedChapter) return;
    setAiLoading(true);
    setAiError("");
    try {
      const qs = await generateQuestionsFromClaude(selectedChapter, 5);
      setAiQs(qs);
    } catch {
      setAiError("Failed to generate. Make sure you're on Claude.ai.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <div className="stats-row">
        <div className="stat-chip">
          <span className="s-icon">📚</span>
          <div><div className="s-val">{SEED_QUESTIONS.length + 0}</div><div className="s-label">Total Questions</div></div>
        </div>
        <div className="stat-chip">
          <span className="s-icon">🃏</span>
          <div><div className="s-val">{FLASHCARDS.length}</div><div className="s-label">Flashcards</div></div>
        </div>
        <div className="stat-chip">
          <span className="s-icon">✅</span>
          <div>
            <div className="s-val">{Object.values(scores).reduce((a, s) => a + s.correct, 0)}</div>
            <div className="s-label">Correct Answers</div>
          </div>
        </div>
        <div className="stat-chip">
          <span className="s-icon">📖</span>
          <div><div className="s-val">12</div><div className="s-label">Chapters</div></div>
        </div>
      </div>

      <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12 }}>Your progress by chapter:</div>
      <ChapterSelector selectedChapters={selectedChapter ? [selectedChapter] : []} onToggle={(id) => setSelectedChapter(id === selectedChapter ? null : id)} scores={scores} />

      {selectedChapter && (
        <div className="ai-section">
          <h3>Chapter {selectedChapter}: {CHAPTERS.find(c => c.id === selectedChapter)?.title} <span className="ai-badge">AI</span></h3>
          <p>Generate 5 new practice questions for this chapter using AI. Results are based on the actual Oklahoma Driver Manual content.</p>
          <button className="btn btn-primary" onClick={generate} disabled={aiLoading}>
            {aiLoading ? "Generating…" : "✨ Generate Questions"}
          </button>
          {aiError && <div style={{ color: "var(--red)", fontSize: "0.8rem", marginTop: 8 }}>{aiError}</div>}

          {aiQs.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="divider" />
              {aiQs.map((q, qi) => {
                const answered = q._answered;
                return (
                  <div key={q.id} style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 10, fontSize: "0.9rem" }}>
                      <span style={{ color: "var(--accent)", marginRight: 8 }}>Q{qi + 1}.</span>{q.question}
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {q.options.map((opt, i) => {
                        let bg = "var(--surface)"; let col = "var(--text)"; let border = "var(--border)";
                        if (answered !== undefined) {
                          if (i === q.answer) { bg = "#0d1f18"; col = "var(--green)"; border = "var(--green)"; }
                          else if (i === answered) { bg = "#1f0d0d"; col = "var(--red)"; border = "var(--red)"; }
                        }
                        return (
                          <button key={i} className="quiz-opt" style={{ background: bg, color: col, borderColor: border }} disabled={answered !== undefined}
                            onClick={() => setAiQs((qs) => qs.map((x, xi) => xi === qi ? { ...x, _answered: i } : x))}>
                            <span className="opt-letter">{String.fromCharCode(65 + i)}</span>{opt}
                          </button>
                        );
                      })}
                    </div>
                    {answered !== undefined && (
                      <div className="quiz-explanation">💡 {q.explanation}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("overview");
  const [scores, setScores] = useState({});

  const updateScores = (newChapterScores) => {
    setScores((prev) => {
      const merged = { ...prev };
      Object.entries(newChapterScores).forEach(([ch, s]) => {
        const key = +ch;
        if (!merged[key]) merged[key] = { correct: 0, total: 0 };
        merged[key].correct += s.correct;
        merged[key].total += s.total;
      });
      return merged;
    });
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "🗺" },
    { id: "flashcards", label: "Flashcards", icon: "🃏" },
    { id: "quiz", label: "Practice Test", icon: "📝" },
  ];

  return (
    <>
      <GlobalStyles />
      <div className="app">
        <div className="header">
          <div className="header-icon">🚗</div>
          <div>
            <h1>Oklahoma Permit Prep</h1>
            <p>Study guide for the Oklahoma Driver's License written exam</p>
          </div>
        </div>

        <div className="nav">
          {tabs.map((t) => (
            <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewMode scores={scores} onScoreUpdate={updateScores} />}
        {tab === "flashcards" && <FlashcardMode scores={scores} />}
        {tab === "quiz" && <QuizMode onScoreUpdate={updateScores} />}
      </div>
    </>
  );
}
