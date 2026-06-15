export interface PhotoshootChecklistItem {
  id: string;
  label: string;
  description?: string;
}

export interface PhotoshootChecklistSection {
  title: string;
  description: string;
  items: PhotoshootChecklistItem[];
}

export type PhotoshootCategoryIcon =
  | "sparkles"
  | "users"
  | "heart-pulse"
  | "book-heart"
  | "siren"
  | "hospital"
  | "hand-heart"
  | "map"
  | "file-stack"
  | "clapperboard";

export const photoshootChecklistSections = {
  direction: {
    title: "Shoot Direction Checklist",
    description: "Use this to align the photographer, clinic team, and content lead before production.",
    items: [
      {
        id: "shoot-goal",
        label: "Confirm the shoot goal: rebrand, website, ads, GBP, wellness plans, urgent care, and My Pet Diary."
      },
      { id: "core-theme", label: "Agree on the core theme: Every pet has a story. We help protect it." },
      { id: "tone", label: "Confirm the tone: trusted, modern, warm, medically capable." },
      { id: "real-moments", label: "Prioritize real care moments over fake stock-photo posing." },
      { id: "dogs-and-cats", label: "Capture both dogs and cats across hero, wellness, and care scenes." },
      {
        id: "multi-format",
        label: "Capture each major setup in horizontal 16:9, vertical 9:16, portrait 4:5, and square 1:1."
      },
      {
        id: "negative-space",
        label: "Leave negative space in selected images for website and brochure text overlays."
      },
      {
        id: "avoid-visual-noise",
        label: "Avoid graphic medical visuals, messy counters, harsh flash, and old branding."
      }
    ]
  },
  visual: {
    title: "Visual Rules Checklist",
    description: "The visual quality should feel premium and clinically trustworthy.",
    items: [
      { id: "soft-light", label: "Use soft natural light where possible." },
      { id: "clean-palette", label: "Maintain a clean green, white, and neutral palette." },
      { id: "shallow-depth", label: "Use shallow depth of field for portraits and care moments." },
      { id: "minimal-backgrounds", label: "Keep backgrounds minimal and controlled." },
      { id: "calm-urgent-care", label: "Show calm confidence in urgent care scenes, not panic." },
      {
        id: "avoid-clutter",
        label: "Avoid cluttered counters, dark corners, exposed trash bins, and random paperwork."
      },
      { id: "avoid-unneeded-masks", label: "Avoid too many masks in hero visuals unless medically needed." },
      { id: "avoid-overstaging", label: "Make photos feel real, not overly staged." }
    ]
  },
  brand: {
    title: "Brand & Rebrand Hero Assets",
    description: "Primary visuals for homepage, ads, brochures, launch posts, and banners.",
    items: [
      { id: "brand-exterior", label: "Exterior shot of Lili Veterinary Hospital." },
      { id: "brand-signage", label: "Clear shot of hospital signage." },
      { id: "brand-reception", label: "Reception/front desk wide shot." },
      { id: "brand-waiting", label: "Waiting area with pet parent and pet." },
      { id: "brand-vet-dog", label: "Vet/team member with dog." },
      { id: "brand-vet-cat", label: "Vet/team member with cat." },
      { id: "brand-exam-dog", label: "Vet examining a dog." },
      { id: "brand-exam-cat", label: "Vet examining a cat." },
      { id: "brand-welcome", label: "Staff welcoming a pet parent." },
      { id: "brand-hero-space", label: "Clean hero image with negative space for website text." },
      { id: "brand-natural-team", label: "Team interacting naturally inside the clinic." },
      { id: "brand-after-visit", label: "Pet parent smiling with pet after visit." }
    ]
  },
  team: {
    title: "Team Portraits",
    description: "Trust-building portraits and candid team moments.",
    items: [
      { id: "team-group", label: "Full team group photo." },
      { id: "team-vet-portraits", label: "Veterinarian individual portraits." },
      { id: "team-tech-portraits", label: "Vet tech/nurse portraits." },
      { id: "team-front-desk-portraits", label: "Front desk/admin portraits." },
      { id: "team-discussion", label: "Candid team discussion." },
      { id: "team-natural-laughter", label: "Staff laughing or interacting naturally." },
      { id: "team-room-prep", label: "Staff preparing exam room." },
      { id: "team-walking", label: "Staff walking through clinic." },
      { id: "team-comforting", label: "Team member comforting a pet." },
      {
        id: "team-clean-backgrounds",
        label: "Capture portraits with clean background and consistent uniforms."
      },
      { id: "team-avoid-stiff", label: "Avoid stiff crossed-arm poses." },
      { id: "team-avoid-harsh-flash", label: "Avoid messy backgrounds and harsh flash." }
    ]
  },
  wellness: {
    title: "Wellness Plan Shots",
    description: "Assets for dog/cat wellness plan brochures, landing pages, GBP posts, Meta ads, and reels.",
    items: [
      { id: "wellness-puppy", label: "Puppy wellness exam." },
      { id: "wellness-kitten", label: "Kitten wellness exam." },
      { id: "wellness-adult-dog", label: "Adult dog wellness exam." },
      { id: "wellness-adult-cat", label: "Adult cat wellness exam." },
      { id: "wellness-senior", label: "Senior pet wellness exam." },
      { id: "wellness-stethoscope", label: "Vet using stethoscope." },
      { id: "wellness-scale", label: "Weight check on scale." },
      { id: "wellness-vaccine", label: "Vaccination moment." },
      { id: "wellness-parasite", label: "Parasite prevention discussion." },
      { id: "wellness-dental", label: "Dental exam/check." },
      { id: "wellness-bloodwork", label: "Bloodwork/lab sample preparation." },
      { id: "wellness-urinalysis", label: "Urinalysis/lab-style shot." },
      { id: "wellness-heartworm", label: "Heartworm testing visual." },
      { id: "wellness-vet-explaining", label: "Vet explaining wellness plan to owner." },
      { id: "wellness-owner-review", label: "Owner reviewing plan or brochure." },
      { id: "wellness-guidance", label: "Pet parent receiving preventive care guidance." }
    ]
  },
  diary: {
    title: "My Pet Diary Campaign",
    description: "Documentary-style shots for a personalized pet health journey.",
    items: [
      { id: "diary-arrival", label: "Pet arrival at clinic." },
      { id: "diary-greeting", label: "Staff greeting pet by name." },
      { id: "diary-pet-portrait", label: "Close-up portrait of pet." },
      { id: "diary-owner-holding", label: "Pet parent holding pet." },
      { id: "diary-team-portrait", label: "Pet + owner + LiliVet team portrait." },
      { id: "diary-history", label: "Vet reviewing pet medical history." },
      { id: "diary-results", label: "Vet explaining test results to owner." },
      { id: "diary-notes", label: "Staff taking notes or documenting visit." },
      { id: "diary-tablet-review", label: "Tablet/report review moment." },
      { id: "diary-gentle-exam", label: "Pet being gently examined." },
      { id: "diary-comfort", label: "Pet being comforted." },
      { id: "diary-family-photo", label: "Welcome to the LiliVet family style photo." },
      { id: "diary-exit", label: "Final happy exit shot." },
      { id: "diary-cover-portrait", label: "Diary cover-style portrait of pet." },
      {
        id: "diary-sequence",
        label: "Capture the sequence: arrival, first interaction, exam, report discussion, recommendation, closing shot."
      }
    ]
  },
  urgent: {
    title: "Urgent Care Shots",
    description: "Calm, capable, same-day care visuals for service pages and ads.",
    items: [
      { id: "urgent-call", label: "Reception answering call." },
      { id: "urgent-room-prep", label: "Staff preparing exam room quickly." },
      { id: "urgent-exam", label: "Vet examining concerned pet." },
      { id: "urgent-reassurance", label: "Pet parent being reassured." },
      { id: "urgent-calm-motion", label: "Staff moving with urgency but calmness." },
      { id: "urgent-diagnostics", label: "Diagnostic equipment being used." },
      { id: "urgent-vet-owner", label: "Vet speaking with pet parent." },
      { id: "urgent-caring-hands", label: "Close-up of caring hands on pet." },
      { id: "urgent-same-day", label: "Same-day care visual." },
      { id: "urgent-resting", label: "Pet resting safely after care." },
      {
        id: "urgent-avoid-graphic",
        label: "Avoid blood, panic, graphic procedures, and dramatic emergency-room visuals."
      }
    ]
  },
  facility: {
    title: "Facility & Equipment Shots",
    description: "Proof that LiliVet is clean, equipped, and medically capable.",
    items: [
      { id: "facility-front", label: "Front entrance." },
      { id: "facility-reception", label: "Reception area." },
      { id: "facility-waiting", label: "Waiting area." },
      { id: "facility-exam-room", label: "Exam room wide shot." },
      { id: "facility-treatment", label: "Treatment area." },
      { id: "facility-lab", label: "Lab/diagnostic station." },
      { id: "facility-kennel", label: "Kennel/holding area." },
      { id: "facility-pharmacy", label: "Pharmacy/medication area, only if neat." },
      { id: "facility-dental", label: "Dental equipment." },
      { id: "facility-surgical-prep", label: "Surgical prep area, only if clean and approved." },
      { id: "facility-scale", label: "Scale." },
      { id: "facility-microscope", label: "Microscope/lab equipment." },
      { id: "facility-vaccine", label: "Vaccine storage/prep area." },
      { id: "facility-branded-materials", label: "Clean branded materials on counter." },
      { id: "facility-no-clutter", label: "Do not shoot any area that looks cluttered." }
    ]
  },
  parent: {
    title: "Pet Parent Experience Shots",
    description: "Emotional trust-building images for web, ads, social, and GBP.",
    items: [
      { id: "parent-entering", label: "Owner entering clinic with pet." },
      { id: "parent-checkin", label: "Owner checking in at front desk." },
      { id: "parent-waiting", label: "Owner waiting calmly with pet." },
      { id: "parent-vet-conversation", label: "Vet speaking with owner." },
      { id: "parent-questions", label: "Owner asking questions." },
      { id: "parent-care-plan", label: "Vet explaining care plan." },
      { id: "parent-discharge", label: "Owner receiving discharge instructions." },
      { id: "parent-smile", label: "Owner smiling with pet." },
      { id: "parent-return", label: "Pet being handed back to owner." },
      { id: "parent-reassured", label: "Owner leaving clinic reassured." }
    ]
  },
  gbp: {
    title: "Google Business Profile Assets",
    description: "Photos for Search and Maps that answer: Is this place real, clean, trustworthy, and nearby?",
    items: [
      { id: "gbp-exterior", label: "Exterior photo." },
      { id: "gbp-entrance", label: "Entrance photo." },
      { id: "gbp-signage", label: "Signage photo." },
      { id: "gbp-reception", label: "Reception photo." },
      { id: "gbp-exam-room", label: "Exam room photo." },
      { id: "gbp-team", label: "Team photo." },
      { id: "gbp-vet-dog", label: "Vet with dog." },
      { id: "gbp-vet-cat", label: "Vet with cat." },
      { id: "gbp-parent-interaction", label: "Pet parent interaction." },
      { id: "gbp-puppy", label: "Puppy visit photo." },
      { id: "gbp-kitten", label: "Kitten visit photo." },
      { id: "gbp-urgent-care", label: "Urgent care photo." },
      { id: "gbp-wellness", label: "Wellness exam photo." },
      { id: "gbp-dental", label: "Dental care photo." },
      { id: "gbp-diagnostics", label: "Diagnostic care photo." },
      { id: "gbp-clarity", label: "Keep photos clear, bright, realistic, and not overly edited." }
    ]
  },
  print: {
    title: "Brochure & Print Assets",
    description: "Clean compositions with negative space for brochures, flyers, posters, and ads.",
    items: [
      { id: "print-dog", label: "Dog on clean/light background." },
      { id: "print-cat", label: "Cat on clean/light background." },
      { id: "print-puppy-vet", label: "Puppy with vet." },
      { id: "print-kitten-vet", label: "Kitten with vet." },
      { id: "print-dog-owner", label: "Adult dog with owner." },
      { id: "print-cat-owner", label: "Adult cat with owner." },
      { id: "print-senior-vet", label: "Senior pet with vet." },
      { id: "print-paws", label: "Close-up of paws." },
      { id: "print-stethoscope", label: "Close-up of stethoscope." },
      { id: "print-tag", label: "Close-up of pet tag/collar." },
      { id: "print-brochure", label: "Wellness brochure held by owner." },
      { id: "print-pointing", label: "Vet pointing to plan/report." },
      { id: "print-negative-space", label: "Clean image with empty space for text overlay." }
    ]
  },
  social: {
    title: "Social Media & Reels Content",
    description: "Short-form content capture for Instagram, Facebook, ads, stories, and GBP updates.",
    items: [
      { id: "social-vertical", label: "Vertical 9:16 video clips." },
      { id: "social-square", label: "Square 1:1 photo options." },
      { id: "social-portrait", label: "Portrait 4:5 image options." },
      { id: "social-horizontal", label: "Horizontal 16:9 website/ad clips." },
      { id: "social-walk-in", label: "Pet walking into clinic." },
      { id: "social-greeting", label: "Staff greeting pet." },
      { id: "social-stethoscope", label: "Vet using stethoscope." },
      { id: "social-pet-closeup", label: "Pet close-up." },
      { id: "social-team-candid", label: "Team candid moment." },
      { id: "social-owner-interaction", label: "Owner and pet interaction." },
      { id: "social-walkthrough", label: "Clinic walkthrough." },
      { id: "social-behind-scenes", label: "Behind-the-scenes care." },
      { id: "social-meet-team", label: "Short meet-the-team clips." },
      { id: "social-wellness-explainer", label: "Short wellness-plan-explained clips." },
      { id: "social-exam-clip", label: "10-second exam clip." },
      { id: "social-welcome-clip", label: "10-second welcome clip." },
      { id: "social-consultation-clip", label: "10-second owner consultation clip." }
    ]
  },
  preparation: {
    title: "Shoot Instructions & Preparation",
    description: "Operational checklist before and during the shoot.",
    items: [
      { id: "prep-reception", label: "Clean reception." },
      { id: "prep-exam-rooms", label: "Clean exam rooms." },
      { id: "prep-remove-clutter", label: "Remove clutter." },
      { id: "prep-hide-trash", label: "Hide trash bins." },
      { id: "prep-hide-cables", label: "Hide loose cables." },
      { id: "prep-remove-old-branding", label: "Remove old branding." },
      { id: "prep-new-logo", label: "Prepare new logo materials." },
      { id: "prep-brochures", label: "Prepare wellness brochures." },
      { id: "prep-clipboards", label: "Prepare clipboards/tablets." },
      { id: "prep-treats", label: "Prepare treats and pet toys." },
      { id: "prep-uniforms", label: "Make sure uniforms are clean and consistent." },
      { id: "prep-staff-availability", label: "Confirm staff availability." },
      { id: "prep-vet-availability", label: "Confirm veterinarian availability." },
      { id: "prep-puppy", label: "Prepare puppy model." },
      { id: "prep-kitten", label: "Prepare kitten model." },
      { id: "prep-adult-dog", label: "Prepare adult dog." },
      { id: "prep-adult-cat", label: "Prepare adult cat." },
      { id: "prep-senior", label: "Prepare senior pet if possible." },
      { id: "prep-parents", label: "Confirm pet parents for lifestyle shots." },
      { id: "prep-consent", label: "Get consent forms signed." },
      { id: "prep-natural-brief", label: "Brief staff to behave naturally, not stiffly." }
    ]
  },
  assets: {
    title: "Assets List",
    description: "Everything to prepare so the shoot looks branded, useful, and intentional.",
    items: [
      { id: "assets-logo", label: "New LiliVet logo assets." },
      { id: "assets-wellness-brochures", label: "Wellness plan brochures." },
      { id: "assets-puppy-kitten-sheets", label: "Puppy and kitten wellness sheets." },
      { id: "assets-adult-sheets", label: "Adult dog/cat wellness plan sheets." },
      { id: "assets-forms", label: "Clipboards and clean forms." },
      { id: "assets-device", label: "Tablet or laptop for report review scenes." },
      { id: "assets-sample-report", label: "Sample report with no private client data." },
      { id: "assets-stethoscope", label: "Stethoscope." },
      { id: "assets-scale", label: "Scale." },
      { id: "assets-lab-props", label: "Clean lab props." },
      { id: "assets-vaccine-props", label: "Clean vaccine-prep props." },
      { id: "assets-treats-toys", label: "Treats and pet toys." },
      { id: "assets-blanket", label: "Neutral blanket or towel." },
      { id: "assets-collar", label: "Pet collar, tag, or bandana." },
      { id: "assets-puppy-model", label: "Puppy model." },
      { id: "assets-kitten-model", label: "Kitten model." },
      { id: "assets-adult-models", label: "Adult dog and adult cat models." },
      { id: "assets-senior-model", label: "Senior pet model if available." }
    ]
  },
  deliverables: {
    title: "Final Deliverables",
    description: "Minimum handoff required from the photographer/videographer.",
    items: [
      { id: "deliver-homepage-hero", label: "1 strong homepage hero image." },
      { id: "deliver-team-group", label: "1 team group photo." },
      { id: "deliver-exterior", label: "1 exterior/signage photo." },
      { id: "deliver-reception", label: "1 reception photo." },
      { id: "deliver-vet-dog", label: "1 vet with dog photo." },
      { id: "deliver-vet-cat", label: "1 vet with cat photo." },
      { id: "deliver-puppy-wellness", label: "1 puppy wellness photo." },
      { id: "deliver-kitten-wellness", label: "1 kitten wellness photo." },
      { id: "deliver-urgent-style", label: "1 urgent care-style photo." },
      { id: "deliver-diary-style", label: "1 My Pet Diary-style photo." },
      { id: "deliver-consultation", label: "1 pet parent consultation photo." },
      { id: "deliver-diagnostic", label: "1 diagnostic/lab photo." },
      { id: "deliver-plan-explanation", label: "1 wellness plan explanation photo." },
      { id: "deliver-clinic-reel", label: "1 vertical reel of clinic care." },
      { id: "deliver-short-brand-video", label: "1 short brand video." },
      { id: "deliver-60-brand", label: "60-second brand video." },
      { id: "deliver-30-launch", label: "30-second rebrand launch video." },
      { id: "deliver-15-puppy", label: "15-second puppy wellness ad." },
      { id: "deliver-15-urgent", label: "15-second urgent care ad." },
      { id: "deliver-15-diary", label: "15-second My Pet Diary ad." },
      { id: "deliver-five-reels", label: "5 short reels, 7-10 seconds each." },
      { id: "deliver-walkthrough", label: "Clinic walkthrough video." },
      { id: "deliver-meet-team", label: "Meet the Team video." },
      { id: "deliver-diary-story", label: "My Pet Diary sample story." },
      { id: "deliver-wellness-explainer", label: "Wellness Plan explainer video." },
      { id: "deliver-urgent-video", label: "When to call LiliVet urgent care video." },
      {
        id: "deliver-organized-folders",
        label: "Organized folders by use case: website, ads, GBP, brochure, social, My Pet Diary, team, facility."
      }
    ]
  }
} satisfies Record<string, PhotoshootChecklistSection>;

export type PhotoshootChecklistId = keyof typeof photoshootChecklistSections;

export const photoshootShotCategories: Array<{
  id: Extract<PhotoshootChecklistId, "brand" | "team" | "wellness" | "diary" | "urgent" | "facility" | "parent" | "gbp" | "print" | "social">;
  title: string;
  description: string;
  badge: string;
  icon: PhotoshootCategoryIcon;
}> = [
  {
    id: "brand",
    title: "Brand & Rebrand Hero",
    description: "Main website, campaign, brochure, social banner, and launch visuals.",
    badge: "Highest Priority",
    icon: "sparkles"
  },
  {
    id: "team",
    title: "Team Portraits",
    description: "Trust-building portraits of veterinarians, technicians, front-desk staff, and the full team.",
    badge: "Trust",
    icon: "users"
  },
  {
    id: "wellness",
    title: "Wellness Plan Shots",
    description: "Puppy, kitten, adult, senior, vaccine, diagnostic, and preventive-care content.",
    badge: "Revenue",
    icon: "heart-pulse"
  },
  {
    id: "diary",
    title: "My Pet Diary",
    description: "Documentary-style storytelling covering arrival, examination, test review, progress, and milestones.",
    badge: "Signature Campaign",
    icon: "book-heart"
  },
  {
    id: "urgent",
    title: "Urgent Care",
    description: "Calm, capable, same-day care visuals without creating fear or panic.",
    badge: "Advertising",
    icon: "siren"
  },
  {
    id: "facility",
    title: "Facility & Equipment",
    description: "Reception, exam rooms, treatment areas, laboratory, diagnostics, and medical equipment.",
    badge: "Credibility",
    icon: "hospital"
  },
  {
    id: "parent",
    title: "Pet Parent Experience",
    description: "Arrival, check-in, consultation, reassurance, discharge, and owner-pet interactions.",
    badge: "Emotion",
    icon: "hand-heart"
  },
  {
    id: "gbp",
    title: "Google Business Profile",
    description: "Real, bright, local trust-building images for Google Search and Maps.",
    badge: "Local Visibility",
    icon: "map"
  },
  {
    id: "print",
    title: "Brochure & Print Assets",
    description: "Clean compositions with negative space for wellness plans, flyers, posters, and print campaigns.",
    badge: "Print",
    icon: "file-stack"
  },
  {
    id: "social",
    title: "Social Media & Reels",
    description: "Vertical clips, behind-the-scenes care, pet greetings, examinations, and team moments.",
    badge: "Content",
    icon: "clapperboard"
  }
];

export const shootDirectionBullets = [
  "The shoot should present LiliVet as trusted, modern, warm, and medically capable.",
  "Final assets need to work across the rebrand, website, wellness plans, urgent care, Google Business Profile, and My Pet Diary.",
  "Real pet-owner emotion should feel calm, clear, and clinically credible."
];

export const visualDirectionBullets = [
  "Premium healthcare feel",
  "Soft green, white, and neutral palette",
  "Natural light",
  "Real pet-owner emotion",
  "Clean clinical spaces",
  "Calm and confident care moments",
  "Minimal backgrounds",
  "Negative space for marketing copy"
];

export const clinicReadinessItems = [
  "Clean reception",
  "Clean exam rooms",
  "Remove clutter",
  "Hide trash bins",
  "Hide loose cables",
  "Remove outdated branding",
  "Prepare new branded materials",
  "Keep uniforms consistent",
  "Prepare brochures, forms, and tablets"
];

export const consentPrivacyItems = [
  "Staff consent",
  "Pet-parent consent",
  "Pet media consent",
  "Website usage consent",
  "Social media usage consent",
  "Advertising usage consent",
  "Google Business Profile usage consent",
  "Do not expose private medical data",
  "Do not display personal information",
  "Do not show graphic medical procedures"
];

export const stagedDataWarning =
  "Any report, form, tablet, computer screen, or medical document visible in the shoot must use staged data or have all private information hidden.";

export const assetGroups = [
  {
    title: "Printed Materials",
    items: ["Wellness plan brochures", "Clipboards", "Forms", "Report examples", "Branded sheets"]
  },
  {
    title: "Clinical Props",
    items: [
      "Stethoscope",
      "Scale",
      "Clean laboratory props",
      "Vaccination preparation props",
      "Diagnostic equipment"
    ]
  },
  {
    title: "Pet Models",
    items: ["Puppy", "Kitten", "Adult dog", "Adult cat", "Senior pet, where possible"]
  },
  {
    title: "Comfort Items",
    items: ["Treats", "Toys", "Towels", "Neutral blankets", "Collars", "Pet tags", "Bandanas"]
  }
];

export const deliverableGroups = [
  {
    title: "Photography Package",
    items: [
      "Website hero photography",
      "Team portraits",
      "Wellness-plan photography",
      "Urgent-care photography",
      "My Pet Diary photography",
      "Google Business Profile photos",
      "Print-ready photography",
      "Social-media photography"
    ]
  },
  {
    title: "Video Package",
    items: [
      "60-second brand video",
      "30-second rebrand-launch video",
      "15-second puppy-wellness ad",
      "15-second urgent-care ad",
      "15-second My Pet Diary ad",
      "Five short reels",
      "Clinic walkthrough",
      "Meet-the-Team video",
      "Wellness Plan explainer",
      "My Pet Diary sample story"
    ]
  },
  {
    title: "Required Formats",
    items: ["16:9 horizontal", "9:16 vertical", "4:5 portrait", "1:1 square"]
  },
  {
    title: "Organized Handoff",
    items: [
      "Website",
      "Advertising",
      "Google Business Profile",
      "Brochures",
      "Social Media",
      "My Pet Diary",
      "Team",
      "Facility",
      "Urgent Care",
      "Wellness Plans"
    ]
  }
];

export function getPhotoshootChecklistStorageKey(id: PhotoshootChecklistId) {
  return `lilivet:photoshoot-guidelines:${id}`;
}
