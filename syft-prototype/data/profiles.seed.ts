// Seed candidate pool (Entity B) + a default searcher (Entity A) for the prototype.
// Centred on Bengaluru so distance filters are meaningful (a cluster in the city,
// plus people in Pune / Mumbai / Hyderabad / Chennai that distance-filter out).
// Profiles are deliberately varied in age, intent, recency, gender/orientation,
// and voice so the funnel has signal to work with — including a "cross-vocabulary"
// profile (p12) that describes itself very differently from a typical query (to
// exercise the score-tension diagnostics in compose.ts). All units are metric.
//
// gender/seeking drive the reciprocal Stage-1 orientation gate (a legitimate
// dating filter, never a ranking signal). The pool is mostly heterosexual with a
// handful of queer profiles so searchers of any orientation get real results.

import type { Profile, Searcher } from "@/lib/matching/types";

// Demo searcher: a man seeking women, so an unauthenticated demo search returns
// only women who are themselves open to men — a visible proof of the gate.
export const defaultSearcher: Searcher = {
  age: 31,
  gender: "man",
  seeking: ["woman"],
  city: "Bengaluru, Karnataka",
  lat: 12.9716,
  lng: 77.5946,
  intent: "long-term",
};

export const seedProfiles: Profile[] = [
  {
    id: "p1",
    name: "Ananya",
    age: 30,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9784,
    lng: 77.6408,
    lastActiveDaysAgo: 1,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["smoking"],
    rawSignals: {
      assessment:
        "Paediatrician, runs trail half-marathons in Nandi Hills, wants a serious relationship within ~2 years.",
      promptResponses: [
        "A perfect Sunday is a long 18 km trail run up Nandi Hills, then filter coffee and a stack of library books.",
        "A friendship that shaped me: my hostel roommate taught me that showing up consistently matters more than grand gestures.",
      ],
      voiceHighlights:
        "Warm, grounded, laughs easily; spoke about wanting steadiness and a partner who's curious about the world.",
    },
  },
  {
    id: "p2",
    name: "Rohan",
    age: 34,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9352,
    lng: 77.6245,
    lastActiveDaysAgo: 3,
    intent: "long-term",
    openTo: ["long-term", "friendship"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Climate-tech engineer, runs a terrace-garden collective, looking for a calm long-term partnership.",
      promptResponses: [
        "My ideal Sunday is slow: the weekend organic market, cooking something ambitious, and a sunset cycle around Ulsoor lake.",
        "A friendship that shaped me: a mentor who showed me how to disagree kindly and stay close.",
      ],
      voiceHighlights:
        "Thoughtful, unhurried, dry sense of humour; values environmental purpose and quiet weekends.",
    },
  },
  {
    id: "p3",
    name: "Priya",
    age: 29,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 13.0035,
    lng: 77.5709,
    lastActiveDaysAgo: 2,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["wants kids soon"],
    rawSignals: {
      assessment:
        "Documentary editor, boulders at Ramanagara, intensely curious; wants a partner but not in a rush to have children.",
      promptResponses: [
        "Perfect Sunday: bouldering at sunrise near Ramanagara, an afternoon at a film screening, then arguing about it over dosas.",
        "A friendship that shaped me: a climbing partner who taught me to trust the rope and the people holding it.",
      ],
      voiceHighlights:
        "Quick, playful, intellectually intense; lights up talking about stories and the outdoors.",
    },
  },
  {
    id: "p4",
    name: "Aditya",
    age: 37,
    gender: "man",
    seeking: ["woman"],
    city: "Pune, Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    lastActiveDaysAgo: 40,
    intent: "long-term",
    openTo: ["long-term"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Music teacher and weekend Hindustani-classical pianist; settled, family-oriented, wants something lasting.",
      promptResponses: [
        "Sundays are for a big family lunch, then riyaaz at the keyboard until it gets dark.",
        "A friendship that shaped me: the bandmate who taught me to listen before I play.",
      ],
      voiceHighlights:
        "Gentle, expressive, deeply present; talked about wanting to build a home full of music.",
    },
  },
  {
    id: "p5",
    name: "Ishaan",
    age: 28,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9698,
    lng: 77.7499,
    lastActiveDaysAgo: 1,
    intent: "short-term",
    openTo: ["short-term", "friendship"],
    dealBreakers: ["long-distance"],
    rawSignals: {
      assessment:
        "Touring DJ and visual artist, lives spontaneously, explicitly not looking for anything serious right now.",
      promptResponses: [
        "Perfect Sunday: sleep till noon, a gallery opening on Church Street, then a club set until 3am.",
        "A friendship that shaped me: the collaborator who pushed me to take creative risks.",
      ],
      voiceHighlights:
        "High-energy, charismatic, candid about wanting fun and freedom over commitment.",
    },
  },
  {
    id: "p6",
    name: "Meera",
    age: 32,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9116,
    lng: 77.6473,
    lastActiveDaysAgo: 6,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["no sense of humour"],
    rawSignals: {
      assessment:
        "Emergency physician, marathoner, very direct and warm; wants a committed partnership and eventually a family.",
      promptResponses: [
        "Perfect Sunday: a dawn 25 km run, brunch with friends, then a nap and a novel.",
        "A friendship that shaped me: a med-college friend who reminded me to laugh through the hard shifts.",
      ],
      voiceHighlights:
        "Confident, funny, no-nonsense; clearly values resilience, humour, and physical health.",
    },
  },
  {
    id: "p7",
    name: "Karan",
    age: 35,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9299,
    lng: 77.5933,
    lastActiveDaysAgo: 12,
    intent: "long-term",
    openTo: ["long-term", "friendship"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Quiet backend engineer, amateur astronomer and weekend baker; introverted, looking for a steady companion.",
      promptResponses: [
        "Perfect Sunday: a quiet morning with coffee and my telescope notes, an afternoon baking, and an early night.",
        "A friendship that shaped me: a neighbour who taught me that quiet company is its own kind of intimacy.",
      ],
      voiceHighlights:
        "Soft-spoken, precise, surprisingly funny once warmed up; craves calm and depth over novelty.",
    },
  },
  {
    id: "p8",
    name: "Sneha",
    age: 27,
    gender: "woman",
    seeking: ["man"],
    city: "Hyderabad, Telangana",
    lat: 17.385,
    lng: 78.4867,
    lastActiveDaysAgo: 2,
    intent: "long-term",
    openTo: ["long-term", "friendship", "marriage"],
    dealBreakers: ["heavy drinking"],
    rawSignals: {
      assessment:
        "Public-interest lawyer, trained Kuchipudi dancer, big joint family; warm, social, wants a serious partner.",
      promptResponses: [
        "Perfect Sunday: a long family lunch, a dance practice in the evening, and rehearsing till my feet hurt.",
        "A friendship that shaped me: a colleague who showed me how to fight for people without burning out.",
      ],
      voiceHighlights:
        "Vivacious, principled, deeply relational; values family, justice, and joy.",
    },
  },
  {
    id: "p9",
    name: "Vikram",
    age: 41,
    gender: "man",
    seeking: ["woman"],
    city: "Mumbai, Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    lastActiveDaysAgo: 20,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Divorced architect with a young daughter, weekend sailor off Gateway of India; wants a patient, kind, long-term partner.",
      promptResponses: [
        "Perfect Sunday: sailing in the harbour with my daughter, then sketching the skyline from the water.",
        "A friendship that shaped me: an old colleague who stood by me through my divorce.",
      ],
      voiceHighlights:
        "Measured, kind, openly reflective about second chances; values patience and design.",
    },
  },
  {
    id: "p10",
    name: "Kavya",
    age: 33,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 13.0218,
    lng: 77.5671,
    lastActiveDaysAgo: 4,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["doesn't want a partner with a demanding career"],
    rawSignals: {
      assessment:
        "Neuroscience postdoc at IISc, long-distance cyclist, writes poetry; cerebral and warm, wants an equal partnership.",
      promptResponses: [
        "Perfect Sunday: a 100 km ride out towards Nandi, then a café to write and people-watch.",
        "A friendship that shaped me: a lab mate who taught me that ambition and tenderness can coexist.",
      ],
      voiceHighlights:
        "Articulate, curious, gently intense; talks about ideas and the body in the same breath.",
    },
  },
  {
    id: "p11",
    name: "Karthik",
    age: 38,
    gender: "man",
    seeking: ["man", "woman", "nonbinary"],
    city: "Bengaluru, Karnataka",
    lat: 12.9719,
    lng: 77.6412,
    lastActiveDaysAgo: 70,
    intent: "friendship",
    openTo: ["friendship"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Recent transplant from Kolkata, chef, rebuilding his social circle; here for friends, not dating.",
      promptResponses: [
        "Perfect Sunday: prepping a big communal dinner and feeding everyone who shows up.",
        "A friendship that shaped me: the line cook who became my chosen family.",
      ],
      voiceHighlights:
        "Generous, gregarious, clear that he's looking for community rather than romance right now.",
    },
  },
  {
    id: "p12",
    name: "Tara",
    age: 31,
    gender: "woman",
    seeking: ["man"],
    city: "Chennai, Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    lastActiveDaysAgo: 5,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["incompatible on having kids"],
    rawSignals: {
      // Cross-vocabulary profile: values map onto "outdoorsy/curious/warm" queries
      // but the words are very different (exercises the score-tension diagnostic).
      assessment:
        "Marine biologist studying coral reefs in the Gulf of Mannar; spends weekends free-diving and restoring reef beds.",
      promptResponses: [
        "Perfect Sunday: a dawn dive in warm water, cataloguing what I find, then drying off with a flask of chai and a good argument about ecosystems.",
        "A friendship that shaped me: a dive buddy who taught me that trust underwater is built one breath at a time.",
      ],
      voiceHighlights:
        "Calm, wonder-struck, fiercely devoted to the sea; warm in a quiet, steady way.",
    },
  },
  {
    id: "p13",
    name: "Lakshmi",
    age: 45,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9063,
    lng: 77.5857,
    lastActiveDaysAgo: 9,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Empty-nester school principal, trekker in the Western Ghats and watercolourist; warm, settled, wants a true companion.",
      promptResponses: [
        "Perfect Sunday: a hill trek in the Ghats, then painting the view badly and not caring.",
        "A friendship that shaped me: a fellow teacher who showed me how to keep my heart open after loss.",
      ],
      voiceHighlights:
        "Serene, witty, emotionally generous; values companionship and the outdoors.",
    },
  },
  {
    id: "p14",
    name: "Neel",
    age: 26,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9352,
    lng: 77.6146,
    lastActiveDaysAgo: 2,
    intent: "short-term",
    openTo: ["short-term", "friendship"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Film-school grad student, night-owl, lots of creative energy; casually dating while finishing his thesis.",
      promptResponses: [
        "Perfect Sunday: a late brunch, an afternoon double-feature, and editing till 2am.",
        "A friendship that shaped me: a professor who told me to make the weird thing.",
      ],
      voiceHighlights:
        "Bright, a little restless, honest that he can't commit to anything serious this year.",
    },
  },
  {
    id: "p15",
    name: "Diya",
    age: 30,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9784,
    lng: 77.6655,
    lastActiveDaysAgo: 1,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["smoking"],
    rawSignals: {
      assessment:
        "UX designer, ceramicist, weekend trekker in Coorg; calm, curious, wants a thoughtful long-term partner.",
      promptResponses: [
        "Perfect Sunday: a misty hike in Coorg, then the pottery studio with a podcast and clay under my nails.",
        "A friendship that shaped me: a studio mate who taught me to embrace the wobble in handmade things.",
      ],
      voiceHighlights:
        "Soft, observant, quietly funny; values craft, nature, and slow mornings.",
    },
  },
  {
    id: "p16",
    name: "Aisha",
    age: 28,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9611,
    lng: 77.6387,
    lastActiveDaysAgo: 1,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["dishonesty"],
    rawSignals: {
      assessment:
        "Paediatric nurse and weekend birder; gentle, dependable, wants a partner to build a quiet life with.",
      promptResponses: [
        "Perfect Sunday: a dawn walk at Hebbal lake with binoculars, then pancakes and a long phone call with my sister.",
        "A friendship that shaped me: a colleague who taught me that kindness scales further than cleverness.",
      ],
      voiceHighlights:
        "Soft-spoken, attentive, deeply caring; lights up about small living things and steady routines.",
    },
  },
  {
    id: "p17",
    name: "Arjun",
    age: 31,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9081,
    lng: 77.6476,
    lastActiveDaysAgo: 3,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["smoking"],
    rawSignals: {
      assessment:
        "Product manager and amateur triathlete; ambitious but warm, wants a partner who is a teammate in everything.",
      promptResponses: [
        "Perfect Sunday: a brick session — swim then ride — then meal-prep and a board game with friends.",
        "A friendship that shaped me: my training partner who showed me that consistency beats intensity.",
      ],
      voiceHighlights:
        "Driven, upbeat, surprisingly tender; talks about partnership as a team sport.",
    },
  },
  {
    id: "p18",
    name: "Nisha",
    age: 34,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 13.0098,
    lng: 77.5563,
    lastActiveDaysAgo: 5,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["wants to relocate abroad"],
    rawSignals: {
      assessment:
        "Independent chartered accountant, salsa dancer, rescues street dogs; vivacious and rooted in Bengaluru.",
      promptResponses: [
        "Perfect Sunday: a social dance in the afternoon, then feeding the strays on my street and a quiet film at night.",
        "A friendship that shaped me: my dance teacher who taught me to lead and follow with equal grace.",
      ],
      voiceHighlights:
        "Lively, decisive, big-hearted; clearly wants to stay near her community and animals.",
    },
  },
  {
    id: "p19",
    name: "Dev",
    age: 36,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9234,
    lng: 77.6101,
    lastActiveDaysAgo: 8,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Pulmonologist and weekend potter; calm, methodical, wants a grounded partnership with room for solitude.",
      promptResponses: [
        "Perfect Sunday: hospital rounds in the morning, then the wheel at my pottery studio with nothing on my mind.",
        "A friendship that shaped me: a senior consultant who showed me how to stay human in a hard profession.",
      ],
      voiceHighlights:
        "Steady, reassuring, low-ego; values calm, craft, and a partner with their own inner life.",
    },
  },
  {
    id: "p20",
    name: "Riya",
    age: 26,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9786,
    lng: 77.6408,
    lastActiveDaysAgo: 1,
    intent: "short-term",
    openTo: ["short-term", "friendship"],
    dealBreakers: ["clinginess"],
    rawSignals: {
      assessment:
        "Stand-up comedian and copywriter; sharp, spontaneous, dating lightly while her career takes off.",
      promptResponses: [
        "Perfect Sunday: write jokes at a café, open-mic in the evening, then dosas with whoever laughed hardest.",
        "A friendship that shaped me: a fellow comic who taught me to bomb gracefully and try again.",
      ],
      voiceHighlights:
        "Quick-witted, independent, upfront that she wants fun and freedom right now.",
    },
  },
  {
    id: "p21",
    name: "Sana",
    age: 29,
    gender: "woman",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9342,
    lng: 77.6101,
    lastActiveDaysAgo: 2,
    intent: "long-term",
    openTo: ["long-term"],
    dealBreakers: ["not out to family is fine; closeted about us is not"],
    rawSignals: {
      assessment:
        "Architect and weekend climber; warm and direct, looking for a serious relationship with a woman who's all in.",
      promptResponses: [
        "Perfect Sunday: a morning at the climbing gym, then sketching buildings I love over cold coffee.",
        "A friendship that shaped me: a mentor who taught me that good design, like love, is mostly listening.",
      ],
      voiceHighlights:
        "Grounded, expressive, quietly romantic; values honesty and shared adventure.",
    },
  },
  {
    id: "p22",
    name: "Maya",
    age: 32,
    gender: "woman",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9982,
    lng: 77.5921,
    lastActiveDaysAgo: 4,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Clinical psychologist and weekend baker; emotionally fluent, wants a tender, communicative partnership with a woman.",
      promptResponses: [
        "Perfect Sunday: sourdough in the morning, a long walk in Cubbon Park, and journaling at dusk.",
        "A friendship that shaped me: a supervisor who taught me that holding space is a skill, not a mood.",
      ],
      voiceHighlights:
        "Warm, perceptive, calm; talks about feelings the way others talk about the weather.",
    },
  },
  {
    id: "p23",
    name: "Aryan",
    age: 30,
    gender: "man",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9279,
    lng: 77.6271,
    lastActiveDaysAgo: 3,
    intent: "long-term",
    openTo: ["long-term"],
    dealBreakers: ["smoking"],
    rawSignals: {
      assessment:
        "Software engineer and marathon swimmer; easy-going and loyal, looking for a steady boyfriend, eventually more.",
      promptResponses: [
        "Perfect Sunday: a long pool session, then cooking a slow lunch and an evening of board games.",
        "A friendship that shaped me: a swim coach who taught me that endurance is mostly showing up.",
      ],
      voiceHighlights:
        "Relaxed, dependable, dryly funny; values consistency and shared quiet time.",
    },
  },
  {
    id: "p24",
    name: "Kabir",
    age: 33,
    gender: "man",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9611,
    lng: 77.6101,
    lastActiveDaysAgo: 6,
    intent: "long-term",
    openTo: ["long-term", "friendship"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Journalist and weekend cyclist; curious and principled, wants a partner who reads, argues, and travels.",
      promptResponses: [
        "Perfect Sunday: a ride out of the city, a bookshop crawl, and an argument about politics over biryani.",
        "A friendship that shaped me: an editor who taught me that the truth is worth the discomfort.",
      ],
      voiceHighlights:
        "Articulate, intense, warm under the rigour; values honesty and shared curiosity.",
    },
  },
  {
    id: "p25",
    name: "Ira",
    age: 27,
    gender: "nonbinary",
    seeking: ["man", "woman", "nonbinary"],
    city: "Bengaluru, Karnataka",
    lat: 12.9719,
    lng: 77.5937,
    lastActiveDaysAgo: 2,
    intent: "long-term",
    openTo: ["long-term", "friendship"],
    dealBreakers: ["won't respect pronouns"],
    rawSignals: {
      assessment:
        "Graphic novelist and printmaker; tender and playful, open to love with anyone who leads with respect.",
      promptResponses: [
        "Perfect Sunday: inking pages at the studio with a big pot of chai, then a zine fair in the evening.",
        "A friendship that shaped me: a collective that taught me chosen family is built, not found.",
      ],
      voiceHighlights:
        "Gentle, imaginative, quietly brave; values respect, art, and emotional honesty.",
    },
  },
  {
    id: "p26",
    name: "Rhea",
    age: 35,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9141,
    lng: 77.6101,
    lastActiveDaysAgo: 7,
    intent: "marriage",
    openTo: ["marriage", "long-term"],
    dealBreakers: ["doesn't want children"],
    rawSignals: {
      assessment:
        "Investment analyst and trained Bharatanatyam dancer; warm and decisive, ready for marriage and a family.",
      promptResponses: [
        "Perfect Sunday: temple in the morning with my parents, dance practice, then planning the week with chai.",
        "A friendship that shaped me: my guru who taught me discipline as a form of devotion.",
      ],
      voiceHighlights:
        "Poised, clear-eyed, family-oriented; knows exactly what she wants and isn't shy about it.",
    },
  },
  {
    id: "p27",
    name: "Sahil",
    age: 39,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9352,
    lng: 77.5673,
    lastActiveDaysAgo: 15,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Restaurateur and home gardener; gregarious and nurturing, wants a partner to share long dinners and slow mornings.",
      promptResponses: [
        "Perfect Sunday: the farmers' market, a big experimental lunch for friends, and watering the terrace at dusk.",
        "A friendship that shaped me: a chef who taught me that feeding people is how I say I love you.",
      ],
      voiceHighlights:
        "Warm, hospitable, expansive; values food, family, and an easy domestic rhythm.",
    },
  },
  {
    id: "p28",
    name: "Tanvi",
    age: 31,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 13.0358,
    lng: 77.5970,
    lastActiveDaysAgo: 3,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["no ambition"],
    rawSignals: {
      assessment:
        "Startup founder and weekend trekker; high-energy and warm, wants a partner who's building something of their own.",
      promptResponses: [
        "Perfect Sunday: a sunrise trek near Skandagiri, then strategy sketches over breakfast and a real nap.",
        "A friendship that shaped me: a co-founder who taught me to be ambitious and kind at once.",
      ],
      voiceHighlights:
        "Bright, fast-talking, deeply warm; respects drive and emotional maturity equally.",
    },
  },
  {
    id: "p29",
    name: "Aman",
    age: 29,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9081,
    lng: 77.6101,
    lastActiveDaysAgo: 2,
    intent: "long-term",
    openTo: ["long-term", "friendship"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Physiotherapist and amateur footballer; grounded and playful, looking for a kind partner who likes the outdoors.",
      promptResponses: [
        "Perfect Sunday: a 7-a-side match in the morning, then a big breakfast and a lazy afternoon with a book.",
        "A friendship that shaped me: a teammate who taught me that you win and lose as a unit.",
      ],
      voiceHighlights:
        "Easy, optimistic, physically warm; values teamwork, health, and gentle humour.",
    },
  },
  {
    id: "p30",
    name: "Pooja",
    age: 38,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9698,
    lng: 77.7201,
    lastActiveDaysAgo: 10,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["unkind to service staff"],
    rawSignals: {
      assessment:
        "Single mother and senior teacher, weekend gardener; warm and unflappable, wants a patient, kind partner.",
      promptResponses: [
        "Perfect Sunday: pancakes with my son, an hour in the garden, then a board game tournament we both take too seriously.",
        "A friendship that shaped me: a fellow single parent who taught me to ask for help without apology.",
      ],
      voiceHighlights:
        "Calm, resilient, deeply kind; values patience, gentleness, and showing up.",
    },
  },
  {
    id: "p31",
    name: "Varun",
    age: 32,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9412,
    lng: 77.6271,
    lastActiveDaysAgo: 4,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["smoking"],
    rawSignals: {
      assessment:
        "Data scientist and weekend rock climber; analytical but warm, wants a curious partner to explore the world with.",
      promptResponses: [
        "Perfect Sunday: an early climb at Turahalli, then a long brunch arguing about a documentary.",
        "A friendship that shaped me: a belay partner who taught me to trust and to be trustworthy.",
      ],
      voiceHighlights:
        "Thoughtful, curious, even-keeled; values intellectual companionship and shared adventure.",
    },
  },
  {
    id: "p32",
    name: "Anjali",
    age: 30,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 13.0218,
    lng: 77.6101,
    lastActiveDaysAgo: 1,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Veterinarian and weekend baker; nurturing and witty, wants a warm partnership full of animals and good food.",
      promptResponses: [
        "Perfect Sunday: clinic emergencies notwithstanding — fresh bread, a dog walk, and a slow evening.",
        "A friendship that shaped me: a vet-school friend who taught me to grieve openly and keep caring.",
      ],
      voiceHighlights:
        "Warm, funny, big-hearted; values tenderness toward animals and people alike.",
    },
  },
  {
    id: "p33",
    name: "Zoya",
    age: 28,
    gender: "woman",
    seeking: ["man", "woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9784,
    lng: 77.5921,
    lastActiveDaysAgo: 2,
    intent: "long-term",
    openTo: ["long-term", "friendship"],
    dealBreakers: ["jealousy"],
    rawSignals: {
      assessment:
        "Indie musician and music teacher; expressive and open, looking for a secure, emotionally honest partner of any gender.",
      promptResponses: [
        "Perfect Sunday: songwriting in the morning, busking near MG Road, and a jam with friends at night.",
        "A friendship that shaped me: a bandmate who taught me that vulnerability on stage is the whole point.",
      ],
      voiceHighlights:
        "Open, soulful, free-spirited; values security, honesty, and creative companionship.",
    },
  },
  {
    id: "p34",
    name: "Rohit",
    age: 44,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9063,
    lng: 77.6101,
    lastActiveDaysAgo: 18,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Widowed civil engineer and long-distance runner; gentle and steady, ready to love again with patience.",
      promptResponses: [
        "Perfect Sunday: a slow 15 km run, then the newspaper, a crossword, and a call with my brother.",
        "A friendship that shaped me: a running group that carried me through the worst year of my life.",
      ],
      voiceHighlights:
        "Soft-spoken, resilient, openly tender; values steadiness and second chances.",
    },
  },
  {
    id: "p35",
    name: "Simran",
    age: 25,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9352,
    lng: 77.6271,
    lastActiveDaysAgo: 1,
    intent: "short-term",
    openTo: ["short-term", "friendship"],
    dealBreakers: ["possessiveness"],
    rawSignals: {
      assessment:
        "Fashion-design grad and thrift-flip artist; bubbly and independent, dating casually while she finds her footing.",
      promptResponses: [
        "Perfect Sunday: thrifting in Jayanagar, a sewing project, and street food with the girls.",
        "A friendship that shaped me: a roommate who taught me that style is just confidence you can wear.",
      ],
      voiceHighlights:
        "Bubbly, creative, fiercely independent; wants something light and fun right now.",
    },
  },
  {
    id: "p36",
    name: "Aditi",
    age: 36,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 13.0098,
    lng: 77.6387,
    lastActiveDaysAgo: 6,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["heavy drinking"],
    rawSignals: {
      assessment:
        "Environmental consultant and weekend kayaker; calm and principled, wants a partner who cares about the planet.",
      promptResponses: [
        "Perfect Sunday: kayaking on a backwater, then a zero-waste cooking experiment and a documentary.",
        "A friendship that shaped me: a field partner who taught me that hope is a discipline.",
      ],
      voiceHighlights:
        "Composed, idealistic, warm; values shared values and an outdoorsy, intentional life.",
    },
  },
  {
    id: "p37",
    name: "Nikhil",
    age: 27,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9698,
    lng: 77.6101,
    lastActiveDaysAgo: 2,
    intent: "long-term",
    openTo: ["long-term", "friendship"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Junior doctor and weekend badminton player; earnest and warm, looking for a partner to grow up alongside.",
      promptResponses: [
        "Perfect Sunday: a post-night-shift sleep, badminton in the evening, and dinner with my flatmates.",
        "A friendship that shaped me: a senior resident who taught me to be gentle with myself.",
      ],
      voiceHighlights:
        "Earnest, kind, a little shy; values warmth, growth, and emotional safety.",
    },
  },
  {
    id: "p38",
    name: "Leela",
    age: 42,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9141,
    lng: 77.5857,
    lastActiveDaysAgo: 12,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["smoking"],
    rawSignals: {
      assessment:
        "Yoga teacher and Ayurveda student; serene and grounded, wants a mindful partner for the second half of life.",
      promptResponses: [
        "Perfect Sunday: a sunrise practice, a slow sattvic brunch, and an afternoon of gardening.",
        "A friendship that shaped me: a teacher who showed me that stillness is also a kind of strength.",
      ],
      voiceHighlights:
        "Calm, intentional, quietly radiant; values mindfulness, health, and presence.",
    },
  },
  {
    id: "p39",
    name: "Yash",
    age: 31,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9279,
    lng: 77.6387,
    lastActiveDaysAgo: 5,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Game developer and weekend trekker; playful and loyal, wants a partner who's a best friend first.",
      promptResponses: [
        "Perfect Sunday: a co-op game with friends, a trail walk, and cooking together in the evening.",
        "A friendship that shaped me: a childhood friend who taught me that loyalty is built in small moments.",
      ],
      voiceHighlights:
        "Playful, loyal, warm; values friendship, humour, and a low-drama partnership.",
    },
  },
  {
    id: "p40",
    name: "Divya",
    age: 33,
    gender: "woman",
    seeking: ["man"],
    city: "Mysuru, Karnataka",
    lat: 12.2958,
    lng: 76.6394,
    lastActiveDaysAgo: 9,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["unwilling to ever move to Bengaluru"],
    rawSignals: {
      assessment:
        "Heritage conservator and weekend painter in Mysuru; warm and rooted, open to a Bengaluru partner who'll meet halfway.",
      promptResponses: [
        "Perfect Sunday: a walk through the palace grounds, an afternoon restoring a fresco, and painting at dusk.",
        "A friendship that shaped me: a mentor who taught me that preserving the past is an act of love.",
      ],
      voiceHighlights:
        "Gracious, devoted, quietly witty; values heritage, art, and a slower city life.",
    },
  },
  {
    id: "p41",
    name: "Imran",
    age: 35,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9611,
    lng: 77.6473,
    lastActiveDaysAgo: 3,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "High-school physics teacher and amateur astrophotographer; patient and curious, wants a warm, intellectually alive partner.",
      promptResponses: [
        "Perfect Sunday: a drive out of the city to shoot the night sky, then chai and an early-morning edit.",
        "A friendship that shaped me: a teacher who showed me that wonder is the best lesson plan.",
      ],
      voiceHighlights:
        "Patient, curious, gently funny; values wonder, learning, and steady warmth.",
    },
  },
  {
    id: "p42",
    name: "Shruti",
    age: 29,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 13.0035,
    lng: 77.6101,
    lastActiveDaysAgo: 1,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["no emotional availability"],
    rawSignals: {
      assessment:
        "Social-impact consultant and weekend runner; warm and reflective, wants an emotionally present partner.",
      promptResponses: [
        "Perfect Sunday: a park run, a long therapy-adjacent chat with a friend, and meal-prepping for the week.",
        "A friendship that shaped me: a colleague who taught me that boundaries are a form of respect.",
      ],
      voiceHighlights:
        "Reflective, warm, self-aware; values emotional availability and shared purpose.",
    },
  },
  {
    id: "p43",
    name: "Gaurav",
    age: 40,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9234,
    lng: 77.5857,
    lastActiveDaysAgo: 22,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Orthopaedic surgeon and weekend cyclist; calm and reliable, wants a settled, affectionate partnership.",
      promptResponses: [
        "Perfect Sunday: an early ride, surgery prep reading, then a quiet dinner and a good series.",
        "A friendship that shaped me: a colleague who taught me to leave work at the hospital door.",
      ],
      voiceHighlights:
        "Reliable, understated, warm; values calm, affection, and a balanced life.",
    },
  },
  {
    id: "p44",
    name: "Fatima",
    age: 31,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9412,
    lng: 77.6101,
    lastActiveDaysAgo: 4,
    intent: "marriage",
    openTo: ["marriage", "long-term"],
    dealBreakers: ["dishonesty about intentions"],
    rawSignals: {
      assessment:
        "Pharmacist and weekend calligrapher; warm and family-minded, looking to marry someone kind and intentional.",
      promptResponses: [
        "Perfect Sunday: family breakfast, an hour of calligraphy, and a long evening walk with my mother.",
        "A friendship that shaped me: a cousin who taught me that the right person makes life feel lighter.",
      ],
      voiceHighlights:
        "Warm, sincere, family-oriented; clear that she's looking to build a marriage, not pass time.",
    },
  },
  {
    id: "p45",
    name: "Aniket",
    age: 34,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9698,
    lng: 77.5921,
    lastActiveDaysAgo: 7,
    intent: "long-term",
    openTo: ["long-term", "friendship"],
    dealBreakers: ["smoking"],
    rawSignals: {
      assessment:
        "Documentary photographer and weekend trekker; observant and warm, wants a partner who loves to wander.",
      promptResponses: [
        "Perfect Sunday: a pre-dawn shoot at the flower market, then editing over coffee and planning the next trip.",
        "A friendship that shaped me: a fixer on a shoot who taught me to really see the people I photograph.",
      ],
      voiceHighlights:
        "Observant, gentle, adventurous; values curiosity, travel, and quiet attentiveness.",
    },
  },
  {
    id: "p46",
    name: "Naina",
    age: 27,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9786,
    lng: 77.6271,
    lastActiveDaysAgo: 2,
    intent: "long-term",
    openTo: ["long-term", "friendship"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Climate researcher and weekend swimmer; bright and earnest, wants a curious partner who takes the future seriously.",
      promptResponses: [
        "Perfect Sunday: laps at the pool, a farmers'-market haul, and reading papers I pretend are for fun.",
        "A friendship that shaped me: a co-author who taught me that good science needs good friends.",
      ],
      voiceHighlights:
        "Bright, earnest, warm; values curiosity, responsibility, and gentle ambition.",
    },
  },
  {
    id: "p47",
    name: "Rehan",
    age: 38,
    gender: "man",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9141,
    lng: 77.6271,
    lastActiveDaysAgo: 8,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Theatre director and weekend gardener; expressive and warm, looking for a committed partner who loves the arts.",
      promptResponses: [
        "Perfect Sunday: a rehearsal in the morning, tending my balcony plants, and a play in the evening.",
        "A friendship that shaped me: an actor who taught me that the most powerful thing on stage is honesty.",
      ],
      voiceHighlights:
        "Expressive, warm, deeply present; values art, honesty, and emotional courage.",
    },
  },
  {
    id: "p48",
    name: "Sara",
    age: 30,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 13.0218,
    lng: 77.5921,
    lastActiveDaysAgo: 1,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["doesn't like dogs"],
    rawSignals: {
      assessment:
        "Product designer and weekend trail runner with a rescue dog; warm and playful, wants an active, kind partner.",
      promptResponses: [
        "Perfect Sunday: a trail run with my dog, brunch on a sunny balcony, and a design side-project.",
        "A friendship that shaped me: a flatmate who taught me that a home is the people and pets in it.",
      ],
      voiceHighlights:
        "Playful, warm, active; values kindness, dogs, and a partner who's up for adventures.",
    },
  },
  {
    id: "p49",
    name: "Vivaan",
    age: 33,
    gender: "man",
    seeking: ["woman"],
    city: "Bengaluru, Karnataka",
    lat: 12.9352,
    lng: 77.5921,
    lastActiveDaysAgo: 5,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: [],
    rawSignals: {
      assessment:
        "Behavioural economist and weekend chess player; analytical and warm, wants a partner who enjoys a good debate.",
      promptResponses: [
        "Perfect Sunday: a chess club in the morning, a long lunch debating something useless, and a quiet evening.",
        "A friendship that shaped me: a professor who taught me to change my mind gracefully.",
      ],
      voiceHighlights:
        "Analytical, warm, curious; values intellectual play and a partner who pushes back kindly.",
    },
  },
  {
    id: "p50",
    name: "Mira",
    age: 28,
    gender: "woman",
    seeking: ["man"],
    city: "Bengaluru, Karnataka",
    lat: 12.9611,
    lng: 77.5921,
    lastActiveDaysAgo: 1,
    intent: "long-term",
    openTo: ["long-term", "marriage"],
    dealBreakers: ["smoking"],
    rawSignals: {
      assessment:
        "Pastry chef and weekend cyclist; warm and exacting, wants a partner who appreciates craft and slow weekends.",
      promptResponses: [
        "Perfect Sunday: a quiet morning ride, an afternoon laminating croissant dough, and feeding everyone I love.",
        "A friendship that shaped me: a head chef who taught me that precision and warmth aren't opposites.",
      ],
      voiceHighlights:
        "Warm, exacting, generous; values craft, patience, and a cosy domestic life.",
    },
  },
];
