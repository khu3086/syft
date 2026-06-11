// Seed candidate pool (Entity B) + a default searcher (Entity A) for the prototype.
// Centred on Bengaluru so distance filters are meaningful (a cluster in the city,
// plus people in Pune / Mumbai / Hyderabad / Chennai that distance-filter out).
// Profiles are deliberately varied in age, intent, recency, and voice so the funnel
// has signal to work with — including a "cross-vocabulary" profile (p12) that
// describes itself very differently from a typical query (to exercise the
// score-tension diagnostics in compose.ts). All units are metric (km, cm).

import type { Profile, Searcher } from "@/lib/matching/types";

export const defaultSearcher: Searcher = {
  age: 31,
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
];
