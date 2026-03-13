"""
DriveReady — Phase 1 Seed Script
Seeds: Chapters, Lessons, Questions, Achievements for Oklahoma (state_code='ok')

Run inside Docker:
  docker compose exec api python scripts/seed_phase1.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, delete
from app.config import settings
from app.models import Base, Chapter, Lesson, Question, Answer, Achievement

# ── Oklahoma Chapters ─────────────────────────────────────────────────────────

CHAPTERS = [
    {
        "number": 1,
        "title": "Getting Your License",
        "description": "Requirements, documents, and the process for obtaining an Oklahoma driver's license.",
    },
    {
        "number": 2,
        "title": "The Oklahoma Driver",
        "description": "Responsibilities, attitudes, and the physical and mental demands of driving.",
    },
    {
        "number": 3,
        "title": "Your Vehicle",
        "description": "Vehicle controls, instruments, safety equipment, and pre-drive inspections.",
    },
    {
        "number": 4,
        "title": "Traffic Signs, Signals & Pavement Markings",
        "description": "Understanding all road signs, traffic signals, and pavement markings.",
    },
    {
        "number": 5,
        "title": "Rules of the Road",
        "description": "Right of way, turning, intersections, and other essential traffic laws.",
    },
    {
        "number": 6,
        "title": "Speed Limits & Speed Management",
        "description": "Oklahoma speed laws, speed zones, and how to manage speed safely.",
    },
    {
        "number": 7,
        "title": "Traffic Signals & Lights",
        "description": "Traffic light meanings, flashing signals, and officer-controlled intersections.",
    },
    {
        "number": 8,
        "title": "Passing & Lane Changes",
        "description": "When and how to safely pass, change lanes, and use turn signals.",
    },
    {
        "number": 9,
        "title": "Alcohol, Drugs & Driving",
        "description": "DUI laws, BAC limits, implied consent, and the dangers of impaired driving.",
    },
    {
        "number": 10,
        "title": "Sharing the Road",
        "description": "Safely interacting with pedestrians, cyclists, motorcycles, and large trucks.",
    },
    {
        "number": 11,
        "title": "Driving Conditions",
        "description": "Handling rain, fog, ice, night driving, and other challenging conditions.",
    },
    {
        "number": 12,
        "title": "Emergencies & Breakdowns",
        "description": "What to do in accidents, mechanical failures, and roadside emergencies.",
    },
]

# ── Lessons per Chapter ───────────────────────────────────────────────────────

LESSONS = {
    1: [
        {
            "sort_order": 0,
            "title": "Learner's Permit Requirements",
            "content": "To get an Oklahoma learner's permit, you must be at least 15½ years old. You need to pass a written knowledge test covering traffic laws and signs. A parent or guardian must sign your application if you are under 18.",
        },
        {
            "sort_order": 1,
            "title": "Required Documents",
            "content": "You must bring proof of identity (birth certificate or passport), proof of Oklahoma residency (utility bill or school records), and your Social Security card or number to the DMV. All documents must be originals or certified copies.",
        },
        {
            "sort_order": 2,
            "title": "Graduated Driver License (GDL)",
            "content": "Oklahoma uses a three-stage Graduated Driver License system: Learner's Permit (Level 1), Intermediate License (Level 2), and Full License (Level 3). Each stage has restrictions designed to help new drivers build skills safely before gaining full privileges.",
        },
        {
            "sort_order": 3,
            "title": "Permit Restrictions",
            "content": "With a learner's permit, you must always be supervised by a licensed driver who is 21 or older sitting in the front passenger seat. You must log at least 50 hours of supervised driving, including 10 hours at night, before applying for your intermediate license.",
        },
    ],
    2: [
        {
            "sort_order": 0,
            "title": "The Driving Task",
            "content": "Driving requires you to search for hazards, identify dangers, predict what others might do, decide on the best action, and execute that action smoothly. This process happens constantly while driving and demands your full attention.",
        },
        {
            "sort_order": 1,
            "title": "Physical & Mental Fitness",
            "content": "Your physical and mental state directly affects your ability to drive safely. Fatigue, illness, strong emotions, and distractions all reduce your reaction time and decision-making ability. Never drive when you are not fully alert.",
        },
        {
            "sort_order": 2,
            "title": "Defensive Driving",
            "content": "A defensive driver always expects the unexpected. Stay alert, keep a safe following distance, and be prepared for other drivers to make mistakes. Defensive driving means you take responsibility for your own safety regardless of what others do.",
        },
    ],
    3: [
        {
            "sort_order": 0,
            "title": "Primary Controls",
            "content": "The primary controls of a vehicle include the steering wheel, accelerator (gas pedal), brake pedal, and gear selector. You must be able to operate all of these smoothly and confidently before driving on public roads.",
        },
        {
            "sort_order": 1,
            "title": "Dashboard Instruments",
            "content": "Your dashboard displays your speedometer, fuel gauge, engine temperature, and warning lights. Always check your gauges before and during driving. A warning light that stays on means your vehicle needs attention — do not ignore it.",
        },
        {
            "sort_order": 2,
            "title": "Safety Equipment",
            "content": "Oklahoma law requires all front seat occupants to wear a seatbelt. Children under 8 must be in a proper child safety seat or booster seat. Airbags supplement seatbelts — they do not replace them. Always buckle up before moving.",
        },
        {
            "sort_order": 3,
            "title": "Pre-Drive Inspection",
            "content": "Before every drive, check your mirrors, seat position, and seatbelt. Walk around the vehicle to check for flat tires or obstructions. Make sure all lights work and your fuel and fluid levels are adequate. A quick check prevents many roadside problems.",
        },
    ],
    4: [
        {
            "sort_order": 0,
            "title": "Sign Shapes & Colors",
            "content": "Traffic sign shapes and colors have specific meanings. Red means stop or prohibition. Yellow means warning. Green gives guidance and direction. Blue marks services like gas and hospitals. Orange marks construction zones. Knowing shape and color lets you recognize a sign even before reading it.",
        },
        {
            "sort_order": 1,
            "title": "Regulatory Signs",
            "content": "Regulatory signs tell you what you must or must not do. The STOP sign (red octagon) requires a complete stop. The YIELD sign (red triangle) requires you to give way. Speed limit signs set the maximum legal speed. You must obey all regulatory signs — violations can result in fines or accidents.",
        },
        {
            "sort_order": 2,
            "title": "Warning Signs",
            "content": "Warning signs are yellow with black symbols and are diamond-shaped. They alert you to upcoming hazards such as sharp curves, intersections, railroad crossings, or pedestrian areas. Slow down and increase caution whenever you see a warning sign.",
        },
        {
            "sort_order": 3,
            "title": "Guide & Information Signs",
            "content": "Green rectangular signs provide directional guidance — highway numbers, exit numbers, and destinations. Blue signs mark services such as hospitals, gas stations, and rest areas. These signs help you navigate and plan your route without stopping.",
        },
        {
            "sort_order": 4,
            "title": "Pavement Markings",
            "content": "White lines separate traffic moving in the same direction. Yellow lines separate traffic moving in opposite directions. A solid line means do not cross. A dashed line means crossing is permitted when safe. Double solid yellow lines mean no passing in either direction.",
        },
    ],
    5: [
        {
            "sort_order": 0,
            "title": "Right of Way Rules",
            "content": "Right of way rules determine who goes first at intersections and other conflict points. At a four-way stop, the first vehicle to arrive goes first. If two vehicles arrive at the same time, the vehicle on the right has the right of way. Always yield to emergency vehicles.",
        },
        {
            "sort_order": 1,
            "title": "Turning Safely",
            "content": "Signal at least 100 feet before turning. For a right turn, stay in the right lane and turn into the nearest lane. For a left turn, turn from the left lane into the nearest left lane. Never swing wide or cut the turn short — stay in your lane.",
        },
        {
            "sort_order": 2,
            "title": "Yielding at Intersections",
            "content": "When turning left, you must yield to oncoming traffic and pedestrians. When entering a road from a driveway or private road, yield to all traffic on the road. At an uncontrolled intersection with no signs, yield to the vehicle on your right.",
        },
    ],
    6: [
        {
            "sort_order": 0,
            "title": "Oklahoma Speed Limits",
            "content": "Oklahoma's standard speed limits are: 25 mph in residential areas, 25 mph in school zones when children are present, 35 mph in business districts, 65 mph on rural highways, and up to 75 mph on certain divided highways. Always obey posted signs — they override default limits.",
        },
        {
            "sort_order": 1,
            "title": "Speed & Stopping Distance",
            "content": "Your stopping distance increases dramatically with speed. At 30 mph, you need about 75 feet to stop. At 60 mph, you need over 240 feet. Always leave enough space between you and the vehicle ahead to stop safely in any condition.",
        },
        {
            "sort_order": 2,
            "title": "Adjusting Speed for Conditions",
            "content": "The posted speed limit is the maximum under ideal conditions. In rain, fog, ice, heavy traffic, or construction zones, you must reduce your speed below the posted limit. Driving too fast for conditions is a leading cause of accidents even when within the speed limit.",
        },
    ],
    7: [
        {
            "sort_order": 0,
            "title": "Standard Traffic Lights",
            "content": "A green light means go if the intersection is clear. A yellow light means the signal is about to turn red — stop if you can do so safely. A red light means stop completely behind the stop line. You may turn right on red after a complete stop unless a sign prohibits it.",
        },
        {
            "sort_order": 1,
            "title": "Flashing Signals",
            "content": "A flashing red light means treat it like a STOP sign — stop completely, then proceed when safe. A flashing yellow light means slow down and proceed with caution — you do not need to stop. Flashing signals often appear at less busy intersections or during off-peak hours.",
        },
        {
            "sort_order": 2,
            "title": "Arrow Signals",
            "content": "A green arrow means you may move in the direction of the arrow — oncoming traffic is stopped. A yellow arrow warns that the protected turn signal is ending. A red arrow means you must stop and cannot turn in that direction until the arrow turns green.",
        },
    ],
    8: [
        {
            "sort_order": 0,
            "title": "When Passing Is Legal",
            "content": "You may pass another vehicle when the center line is dashed, visibility is clear, there is enough space, and it is safe to do so. Always signal before passing, check all mirrors and blind spots, and return to your lane only when you can see the passed vehicle in your mirror.",
        },
        {
            "sort_order": 1,
            "title": "When Passing Is Illegal",
            "content": "Never pass on a hill or curve where you cannot see oncoming traffic. Never pass at an intersection, railroad crossing, or when a solid yellow line is on your side. Never pass if a vehicle ahead is stopped for a school bus with flashing lights — this is a serious violation.",
        },
        {
            "sort_order": 2,
            "title": "Safe Lane Changes",
            "content": "Before changing lanes: check your mirrors, signal your intention, check your blind spot by glancing over your shoulder, and only move if the lane is clear. Maintain your speed during the lane change. Cancel your signal after completing the move.",
        },
    ],
    9: [
        {
            "sort_order": 0,
            "title": "Blood Alcohol Concentration",
            "content": "Oklahoma's legal BAC limit is 0.08% for drivers 21 and older. For drivers under 21, any detectable alcohol is illegal (zero tolerance). For commercial drivers, the limit is 0.04%. Alcohol affects judgment, reaction time, and coordination — even one drink can impair driving ability.",
        },
        {
            "sort_order": 1,
            "title": "Implied Consent Law",
            "content": "By driving in Oklahoma, you automatically consent to chemical testing (breath, blood, or urine) if an officer suspects you of DUI. Refusing to take the test results in an automatic license suspension — even if you are not convicted of DUI.",
        },
        {
            "sort_order": 2,
            "title": "Drugs & Driving",
            "content": "Driving under the influence of any drug — including prescription medications and marijuana — is illegal in Oklahoma if it impairs your ability to drive. Always read medication labels for warnings about drowsiness or impairment before driving.",
        },
    ],
    10: [
        {
            "sort_order": 0,
            "title": "Pedestrian Safety",
            "content": "You must yield to pedestrians in all marked and unmarked crosswalks. Never pass a vehicle that has stopped at a crosswalk — a pedestrian may be crossing. Give pedestrians extra room near schools, parks, and residential areas where children may dart into the road unexpectedly.",
        },
        {
            "sort_order": 1,
            "title": "Cyclists & Motorcycles",
            "content": "Cyclists and motorcycles are entitled to a full lane — do not crowd them. Give motorcycles at least a 4-second following distance. When passing a cyclist, allow at least 3 feet of space. Check carefully for motorcycles before turning — they can be hard to see.",
        },
        {
            "sort_order": 2,
            "title": "Large Trucks & Blind Spots",
            "content": "Large trucks have four large blind spots: directly in front, directly behind, and along both sides. If you cannot see the truck's mirrors, the driver cannot see you. Never cut in front of a truck — they need much more distance to stop than a passenger car.",
        },
    ],
    11: [
        {
            "sort_order": 0,
            "title": "Driving in Rain",
            "content": "Rain reduces visibility and increases stopping distances. Turn on your headlights, slow down, and increase your following distance. Hydroplaning occurs when your tires lose contact with the road on a film of water — if it happens, ease off the gas and steer straight until traction returns.",
        },
        {
            "sort_order": 1,
            "title": "Driving in Fog",
            "content": "In fog, use low-beam headlights — high beams reflect off fog and reduce visibility further. Slow down significantly and increase your following distance. If fog is too thick, pull off the road completely, turn off your lights, and turn on your hazard flashers.",
        },
        {
            "sort_order": 2,
            "title": "Ice & Snow",
            "content": "Black ice forms invisibly on bridges, overpasses, and shaded areas. Brake gently and early on icy roads. If you start to skid, steer in the direction you want to go and ease off the gas — do not slam the brakes. Give yourself 10 times more stopping distance on ice.",
        },
    ],
    12: [
        {
            "sort_order": 0,
            "title": "What to Do After a Crash",
            "content": "After a crash: stop immediately, check for injuries, and call 911. Move vehicles out of traffic if possible without disturbing evidence. Exchange name, address, license number, and insurance information with other drivers. Oklahoma law requires you to report any crash involving injury, death, or significant property damage.",
        },
        {
            "sort_order": 1,
            "title": "Mechanical Failures",
            "content": "If your brakes fail, pump them rapidly to build pressure or downshift to slow the engine. If your accelerator sticks, shift to neutral and brake firmly, then pull off the road. If a tire blows out, hold the steering wheel firmly, ease off the gas, and steer to the shoulder — do not brake suddenly.",
        },
        {
            "sort_order": 2,
            "title": "Roadside Emergencies",
            "content": "If you must stop on a roadway, pull as far off the road as possible and turn on your hazard flashers. If you have road flares or triangles, place them behind your vehicle to warn other drivers. Stay away from moving traffic while waiting for help.",
        },
    ],
}

# ── Questions ─────────────────────────────────────────────────────────────────

QUESTIONS = [
    # Chapter 1 — Getting Your License
    {
        "state_code": "ok", "chapter": 1, "category": "licensing",
        "difficulty": "pawn",
        "question_text": "What is the minimum age to apply for a learner's permit in Oklahoma?",
        "correct_count": 1,
        "explanation": "You must be at least 15½ years old to apply for an Oklahoma learner's permit.",
        "hint_text": "Think: halfway through your 15th year.",
        "source_page": 8, "tags": ["licensing", "permit"],
        "answers": [
            {"text": "15½ years old", "is_correct": True},
            {"text": "15 years old", "is_correct": False},
            {"text": "16 years old", "is_correct": False},
            {"text": "14 years old", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 1, "category": "licensing",
        "difficulty": "pawn",
        "question_text": "How many hours of supervised driving must a permit holder complete before applying for an intermediate license?",
        "correct_count": 1,
        "explanation": "Oklahoma requires 50 hours of supervised driving, including at least 10 hours at night.",
        "hint_text": "More than a work week — and some of it must be after dark.",
        "source_page": 10, "tags": ["licensing", "gdl"],
        "answers": [
            {"text": "50 hours (including 10 at night)", "is_correct": True},
            {"text": "40 hours (including 10 at night)", "is_correct": False},
            {"text": "25 hours total", "is_correct": False},
            {"text": "60 hours total", "is_correct": False},
        ],
    },
    # Chapter 2 — The Oklahoma Driver
    {
        "state_code": "ok", "chapter": 2, "category": "driver_responsibility",
        "difficulty": "pawn",
        "question_text": "Which of the following best describes defensive driving?",
        "correct_count": 1,
        "explanation": "Defensive driving means anticipating hazards and being prepared to respond to mistakes made by other drivers — taking responsibility for your own safety.",
        "hint_text": "It's about preparation, not reaction.",
        "source_page": 18, "tags": ["safety", "defensive_driving"],
        "answers": [
            {"text": "Anticipating hazards and being prepared for others' mistakes", "is_correct": True},
            {"text": "Driving aggressively to maintain your position in traffic", "is_correct": False},
            {"text": "Following all posted speed limits exactly", "is_correct": False},
            {"text": "Using your horn frequently to warn other drivers", "is_correct": False},
        ],
    },
    # Chapter 3 — Your Vehicle
    {
        "state_code": "ok", "chapter": 3, "category": "vehicle",
        "difficulty": "pawn",
        "question_text": "Oklahoma law requires children under what age to be in a proper child safety seat?",
        "correct_count": 1,
        "explanation": "Oklahoma law requires children under 8 years old to be secured in an appropriate child passenger restraint system.",
        "hint_text": "Think: single digit age.",
        "source_page": 28, "tags": ["safety", "seatbelt"],
        "answers": [
            {"text": "8 years old", "is_correct": True},
            {"text": "6 years old", "is_correct": False},
            {"text": "10 years old", "is_correct": False},
            {"text": "5 years old", "is_correct": False},
        ],
    },
    # Chapter 4 — Signs
    {
        "state_code": "ok", "chapter": 4, "category": "regulatory",
        "difficulty": "pawn",
        "question_text": "What does a red octagonal sign indicate?",
        "correct_count": 1,
        "explanation": "A red octagon is always a STOP sign. You must come to a complete stop.",
        "hint_text": "Focus on the shape — octagons are exclusive to one sign type.",
        "source_page": 42, "tags": ["signs", "regulatory"],
        "answers": [
            {"text": "Stop completely", "is_correct": True},
            {"text": "Yield to cross traffic", "is_correct": False},
            {"text": "Speed limit ahead", "is_correct": False},
            {"text": "Railroad crossing", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 4, "category": "warning",
        "difficulty": "pawn",
        "question_text": "A yellow diamond-shaped sign warns of what?",
        "correct_count": 1,
        "explanation": "Yellow diamond signs warn drivers of upcoming hazards or changing road conditions.",
        "hint_text": "Yellow = caution. Diamond = warning.",
        "source_page": 44, "tags": ["signs", "warning"],
        "answers": [
            {"text": "A hazard or change in road conditions", "is_correct": True},
            {"text": "A school zone ahead", "is_correct": False},
            {"text": "A mandatory stop", "is_correct": False},
            {"text": "A speed limit change", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 4, "category": "markings",
        "difficulty": "rogue",
        "question_text": "What do double solid yellow center lines mean?",
        "correct_count": 1,
        "explanation": "Double solid yellow lines mean no passing is allowed in either direction. Neither driver may cross these lines to pass.",
        "hint_text": "Solid means you can't cross it. Double means nobody can.",
        "source_page": 48, "tags": ["pavement_markings"],
        "answers": [
            {"text": "No passing in either direction", "is_correct": True},
            {"text": "Passing allowed from both sides", "is_correct": False},
            {"text": "Lane divider on a one-way road", "is_correct": False},
            {"text": "Construction zone boundary", "is_correct": False},
        ],
    },
    # Chapter 5 — Rules of the Road
    {
        "state_code": "ok", "chapter": 5, "category": "right_of_way",
        "difficulty": "rogue",
        "question_text": "At an uncontrolled intersection, who has the right of way?",
        "correct_count": 1,
        "explanation": "At an uncontrolled intersection, the vehicle that arrives first has right of way. If arriving simultaneously, yield to the vehicle on the right.",
        "hint_text": "Think: first to arrive, OR if tied — which side?",
        "source_page": 56, "tags": ["right_of_way", "intersections"],
        "answers": [
            {"text": "The vehicle that arrived first, or the vehicle to the right if simultaneous", "is_correct": True},
            {"text": "The vehicle traveling on the larger road", "is_correct": False},
            {"text": "The vehicle going straight (not turning)", "is_correct": False},
            {"text": "The vehicle on the left", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 5, "category": "turning",
        "difficulty": "pawn",
        "question_text": "How far in advance must you signal before making a turn in Oklahoma?",
        "correct_count": 1,
        "explanation": "Oklahoma law requires you to signal at least 100 feet before turning to give other drivers adequate warning.",
        "hint_text": "One hundred feet — that's about 10 car lengths.",
        "source_page": 58, "tags": ["turning", "signals"],
        "answers": [
            {"text": "At least 100 feet", "is_correct": True},
            {"text": "At least 50 feet", "is_correct": False},
            {"text": "At least 200 feet", "is_correct": False},
            {"text": "At least 75 feet", "is_correct": False},
        ],
    },
    # Chapter 6 — Speed
    {
        "state_code": "ok", "chapter": 6, "category": "speed",
        "difficulty": "pawn",
        "question_text": "What is the standard speed limit in a residential area in Oklahoma unless otherwise posted?",
        "correct_count": 1,
        "explanation": "Oklahoma's default residential speed limit is 25 mph unless signs indicate otherwise.",
        "hint_text": "Think neighborhood streets — lower than a highway, higher than a school zone.",
        "source_page": 62, "tags": ["speed_limits"],
        "answers": [
            {"text": "25 mph", "is_correct": True},
            {"text": "30 mph", "is_correct": False},
            {"text": "20 mph", "is_correct": False},
            {"text": "35 mph", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 6, "category": "speed",
        "difficulty": "pawn",
        "question_text": "What is the speed limit in a school zone when children are present in Oklahoma?",
        "correct_count": 1,
        "explanation": "School zones in Oklahoma have a 25 mph limit when children are present or the flasher is active.",
        "hint_text": "This matches the residential limit — slow for safety.",
        "source_page": 63, "tags": ["speed_limits", "school_zone"],
        "answers": [
            {"text": "25 mph", "is_correct": True},
            {"text": "15 mph", "is_correct": False},
            {"text": "20 mph", "is_correct": False},
            {"text": "30 mph", "is_correct": False},
        ],
    },
    # Chapter 7 — Traffic Signals
    {
        "state_code": "ok", "chapter": 7, "category": "signals",
        "difficulty": "pawn",
        "question_text": "What must you do when approaching a flashing red traffic light?",
        "correct_count": 1,
        "explanation": "A flashing red light is treated the same as a stop sign — come to a complete stop, then proceed when safe.",
        "hint_text": "Flashing red = treat it like a familiar sign with the same color.",
        "source_page": 71, "tags": ["signals", "intersections"],
        "answers": [
            {"text": "Stop completely, then proceed when safe", "is_correct": True},
            {"text": "Slow down and proceed with caution", "is_correct": False},
            {"text": "Yield to cross traffic only", "is_correct": False},
            {"text": "Stop and wait for the light to turn green", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 7, "category": "signals",
        "difficulty": "pawn",
        "question_text": "What does a flashing yellow traffic light mean?",
        "correct_count": 1,
        "explanation": "A flashing yellow light means slow down and proceed with caution — you do not need to stop.",
        "hint_text": "Yellow means caution, flashing means it's ongoing — not a full stop.",
        "source_page": 71, "tags": ["signals"],
        "answers": [
            {"text": "Slow down and proceed with caution", "is_correct": True},
            {"text": "Stop and wait", "is_correct": False},
            {"text": "Come to a complete stop", "is_correct": False},
            {"text": "Prepare to stop", "is_correct": False},
        ],
    },
    # Chapter 8 — Passing
    {
        "state_code": "ok", "chapter": 8, "category": "passing",
        "difficulty": "rogue",
        "question_text": "Which situation makes passing another vehicle illegal in Oklahoma?",
        "correct_count": 1,
        "explanation": "Passing is illegal on hills, curves, intersections, and railroad crossings where visibility is limited.",
        "hint_text": "Think about where you cannot see far enough ahead.",
        "source_page": 80, "tags": ["passing", "safety"],
        "answers": [
            {"text": "On a hill where you cannot see oncoming traffic", "is_correct": True},
            {"text": "On a straight road with a dashed center line", "is_correct": False},
            {"text": "When the vehicle ahead is going 10 mph under the limit", "is_correct": False},
            {"text": "During daylight hours on a highway", "is_correct": False},
        ],
    },
    # Chapter 9 — Alcohol
    {
        "state_code": "ok", "chapter": 9, "category": "alcohol",
        "difficulty": "rogue",
        "question_text": "What is the legal blood alcohol concentration (BAC) limit for drivers 21 and older in Oklahoma?",
        "correct_count": 1,
        "explanation": "Oklahoma's legal BAC limit is 0.08% for drivers 21 and over.",
        "hint_text": "This is the national standard in the US.",
        "source_page": 92, "tags": ["alcohol", "dui"],
        "answers": [
            {"text": "0.08%", "is_correct": True},
            {"text": "0.10%", "is_correct": False},
            {"text": "0.05%", "is_correct": False},
            {"text": "0.04%", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 9, "category": "alcohol",
        "difficulty": "rogue",
        "question_text": "What happens if you refuse a chemical test under Oklahoma's implied consent law?",
        "correct_count": 1,
        "explanation": "Refusing a chemical test results in an automatic license suspension, even if you are not convicted of DUI.",
        "hint_text": "The law says driving = consent. Refusing has its own penalty.",
        "source_page": 94, "tags": ["alcohol", "implied_consent"],
        "answers": [
            {"text": "Automatic license suspension", "is_correct": True},
            {"text": "A warning but no penalty", "is_correct": False},
            {"text": "A fine but no suspension", "is_correct": False},
            {"text": "Arrest only if you fail field sobriety tests", "is_correct": False},
        ],
    },
    # Chapter 10 — Sharing the Road
    {
        "state_code": "ok", "chapter": 10, "category": "sharing_road",
        "difficulty": "pawn",
        "question_text": "When must you yield to pedestrians in Oklahoma?",
        "correct_count": 1,
        "explanation": "You must always yield to pedestrians in marked or unmarked crosswalks.",
        "hint_text": "Pedestrians on foot always have priority over vehicles when crossing legally.",
        "source_page": 101, "tags": ["pedestrians", "right_of_way"],
        "answers": [
            {"text": "Whenever they are in a marked or unmarked crosswalk", "is_correct": True},
            {"text": "Only when traffic lights are not present", "is_correct": False},
            {"text": "Only in school zones", "is_correct": False},
            {"text": "Only when they have the walk signal", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 10, "category": "sharing_road",
        "difficulty": "rogue",
        "question_text": "When passing a cyclist on a road, how much space must you provide in Oklahoma?",
        "correct_count": 1,
        "explanation": "Oklahoma law requires drivers to give cyclists at least 3 feet of clearance when passing.",
        "hint_text": "Think: three feet is about an arm's length — a comfortable buffer.",
        "source_page": 104, "tags": ["cyclists", "sharing_road"],
        "answers": [
            {"text": "At least 3 feet", "is_correct": True},
            {"text": "At least 1 foot", "is_correct": False},
            {"text": "At least 5 feet", "is_correct": False},
            {"text": "At least 2 feet", "is_correct": False},
        ],
    },
    # Chapter 11 — Driving Conditions
    {
        "state_code": "ok", "chapter": 11, "category": "conditions",
        "difficulty": "rogue",
        "question_text": "What should you do if your vehicle begins to hydroplane?",
        "correct_count": 1,
        "explanation": "If hydroplaning occurs, ease off the accelerator and steer straight. Do not brake suddenly — this can cause a skid.",
        "hint_text": "Less input is better — let the tires find the road again.",
        "source_page": 112, "tags": ["rain", "hydroplaning"],
        "answers": [
            {"text": "Ease off the gas and steer straight", "is_correct": True},
            {"text": "Brake firmly to regain control", "is_correct": False},
            {"text": "Turn the wheel sharply to correct", "is_correct": False},
            {"text": "Accelerate to get through the water faster", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 11, "category": "conditions",
        "difficulty": "pawn",
        "question_text": "Which headlight setting should you use when driving in fog?",
        "correct_count": 1,
        "explanation": "Use low-beam headlights in fog. High beams reflect off fog particles and reduce visibility, making it harder to see.",
        "hint_text": "High beams bounce back at you in fog — go low.",
        "source_page": 115, "tags": ["fog", "headlights"],
        "answers": [
            {"text": "Low beams", "is_correct": True},
            {"text": "High beams", "is_correct": False},
            {"text": "Hazard lights only", "is_correct": False},
            {"text": "No lights needed in daytime fog", "is_correct": False},
        ],
    },
    # Chapter 12 — Emergencies
    {
        "state_code": "ok", "chapter": 12, "category": "emergencies",
        "difficulty": "rogue",
        "question_text": "What is the first thing you should do after a crash in Oklahoma?",
        "correct_count": 1,
        "explanation": "The first step after a crash is to stop immediately at or near the scene. Leaving the scene of an accident is a serious crime in Oklahoma.",
        "hint_text": "Running away is never the answer — legally or morally.",
        "source_page": 122, "tags": ["accidents", "emergencies"],
        "answers": [
            {"text": "Stop immediately and check for injuries", "is_correct": True},
            {"text": "Move your vehicle immediately to avoid blocking traffic", "is_correct": False},
            {"text": "Call your insurance company first", "is_correct": False},
            {"text": "Wait for the other driver to approach you", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 12, "category": "emergencies",
        "difficulty": "king",
        "question_text": "If your accelerator sticks while driving, what is the correct action?",
        "correct_count": 1,
        "explanation": "If the accelerator sticks, shift to neutral to disconnect engine power, then brake firmly and steer to the shoulder. Do not turn off the engine while moving — you will lose power steering.",
        "hint_text": "Disconnect the engine from the wheels first.",
        "source_page": 126, "tags": ["mechanical_failure", "emergencies"],
        "answers": [
            {"text": "Shift to neutral, brake firmly, and steer to the shoulder", "is_correct": True},
            {"text": "Turn off the engine immediately", "is_correct": False},
            {"text": "Pump the brakes rapidly", "is_correct": False},
            {"text": "Steer off the road without braking", "is_correct": False},
        ],
    },
]

# ── Achievements ──────────────────────────────────────────────────────────────

ACHIEVEMENTS = [
    {"key": "first_flip",     "name": "First Flip",         "description": "Complete your first flashcard session",        "icon": "layers",          "xp_reward": 10},
    {"key": "chapter_1",      "name": "Chapter 1 Clear",    "description": "Complete Chapter 1 lessons and pop quiz",      "icon": "book-open",       "xp_reward": 20},
    {"key": "all_clear",      "name": "All Clear",          "description": "Complete all 12 chapters",                     "icon": "award",           "xp_reward": 200},
    {"key": "ace",            "name": "Ace",                "description": "Score 100% on any assessment",                 "icon": "star",            "xp_reward": 50},
    {"key": "speed_demon",    "name": "Speed Demon",        "description": "Complete Timer Blitz with 20+ cards",          "icon": "zap",             "xp_reward": 30},
    {"key": "beat_rusty",     "name": "Bot Slayer — Rusty", "description": "Beat Rusty in a Robot Battle",                 "icon": "bot",             "xp_reward": 20},
    {"key": "beat_dash",      "name": "Bot Slayer — Dash",  "description": "Beat Dash in a Robot Battle",                  "icon": "bot",             "xp_reward": 40},
    {"key": "beat_apex",      "name": "Bot Slayer — Apex",  "description": "Beat Apex in a Robot Battle",                  "icon": "bot",             "xp_reward": 100},
    {"key": "streak_7",       "name": "On Fire",            "description": "Maintain a 7-day study streak",                "icon": "flame",           "xp_reward": 50},
    {"key": "streak_30",      "name": "Unstoppable",        "description": "Maintain a 30-day study streak",               "icon": "flame",           "xp_reward": 200},
    {"key": "scholar",        "name": "Scholar",            "description": "Reach 1000 total XP",                          "icon": "graduation-cap",  "xp_reward": 50},
    {"key": "road_ready",     "name": "Road Ready",         "description": "Reach a readiness score above 85%",            "icon": "target",          "xp_reward": 100},
    {"key": "night_owl",      "name": "Night Owl",          "description": "Complete Night Before Mode",                   "icon": "moon",            "xp_reward": 30},
    {"key": "bookworm",       "name": "Bookworm",           "description": "Save 50 bookmarks",                            "icon": "bookmark",        "xp_reward": 25},
    {"key": "deck_builder",   "name": "Deck Builder",       "description": "Create a custom saved deck",                   "icon": "layers",          "xp_reward": 15},
    {"key": "peer_crusher",   "name": "Peer Crusher",       "description": "Win 5 peer battles",                           "icon": "swords",          "xp_reward": 75},
    {"key": "trivia_master",  "name": "Trivia Master",      "description": "Complete 10 Trivia sessions",                  "icon": "help-circle",     "xp_reward": 40},
]


# ── Seed Runner ───────────────────────────────────────────────────────────────

async def seed():
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:

        # Clear existing data in correct order (FK safe)
        print("Clearing existing seed data...")
        await session.execute(delete(Answer))
        await session.execute(delete(Question))
        await session.execute(delete(Lesson))
        await session.execute(delete(Chapter))
        await session.execute(delete(Achievement))
        await session.commit()

        # Seed chapters + lessons
        print(f"Seeding {len(CHAPTERS)} chapters...")
        for ch_data in CHAPTERS:
            chapter = Chapter(
                state_code="ok",
                number=ch_data["number"],
                title=ch_data["title"],
                description=ch_data["description"],
            )
            session.add(chapter)
            await session.flush()

            lessons = LESSONS.get(ch_data["number"], [])
            for lesson_data in lessons:
                lesson = Lesson(
                    chapter_id=chapter.id,
                    sort_order=lesson_data["sort_order"],
                    title=lesson_data.get("title"),
                    content=lesson_data["content"],
                )
                session.add(lesson)

            print(f"  ✓ Chapter {ch_data['number']}: {ch_data['title']} ({len(lessons)} lessons)")

        await session.flush()

        # Seed questions + answers
        print(f"\nSeeding {len(QUESTIONS)} questions...")
        for q_data in QUESTIONS:
            answers_data = q_data.pop("answers")
            question = Question(**q_data)
            session.add(question)
            await session.flush()

            for i, a_data in enumerate(answers_data):
                answer = Answer(question_id=question.id, sort_order=i, **a_data)
                session.add(answer)

        print(f"  ✓ {len(QUESTIONS)} questions seeded")

        # Seed achievements
        print(f"\nSeeding {len(ACHIEVEMENTS)} achievements...")
        for a_data in ACHIEVEMENTS:
            achievement = Achievement(**a_data)
            session.add(achievement)

        await session.commit()
        print(f"\n✅ Seed complete — DriveReady Phase 1 data is live")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())