// High-resolution SVG data URI matching the TBT The Body Town Gym & Spa emblem
export const DEFAULT_TBT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="50%" stop-color="#c2410c" />
      <stop offset="100%" stop-color="#9a3412" />
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
  </defs>

  <!-- Background Circle for contrast -->
  <circle cx="200" cy="200" r="195" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>

  <!-- Outer Dynamic Oval Ring -->
  <ellipse cx="200" cy="140" rx="145" ry="85" fill="none" stroke="url(#bronzeGrad)" stroke-width="8" stroke-dasharray="800" stroke-dashoffset="60" transform="rotate(-6 200 140)"/>
  
  <!-- Muscle bodybuilder icon graphic -->
  <g transform="translate(110, 60) scale(0.9)">
    <!-- Dumbbell -->
    <g transform="translate(130, 20)">
      <circle cx="25" cy="25" r="28" fill="url(#bronzeGrad)" />
      <circle cx="25" cy="25" r="20" fill="#ffffff" />
      <circle cx="25" cy="25" r="14" fill="url(#bronzeGrad)" />
      <circle cx="25" cy="25" r="7" fill="#ffffff" />
      <!-- Bar -->
      <rect x="22" y="50" width="6" height="24" rx="2" fill="url(#bronzeGrad)" />
    </g>

    <!-- Head & Shoulders -->
    <circle cx="95" cy="40" r="22" fill="#ffffff" stroke="url(#bronzeGrad)" stroke-width="6"/>
    <!-- Face profile detail -->
    <path d="M96 26 C105 26 112 32 112 40 C112 46 108 52 102 56 L100 62 L90 62 L90 56" fill="none" stroke="url(#bronzeGrad)" stroke-width="4" stroke-linecap="round"/>
    
    <!-- Torso & Pecs -->
    <path d="M60 85 C68 70 82 66 100 66 C118 66 132 70 140 85 C146 96 142 110 134 118 C124 126 110 128 100 128 C90 128 76 126 66 118 C58 110 54 96 60 85 Z" fill="#ffffff" stroke="url(#bronzeGrad)" stroke-width="6"/>
    <path d="M100 68 L100 114" stroke="url(#bronzeGrad)" stroke-width="5" stroke-linecap="round"/>
    <path d="M72 98 C82 108 95 108 100 106 C105 108 118 108 128 98" fill="none" stroke="url(#bronzeGrad)" stroke-width="4"/>
    
    <!-- Flexed Bicep Right -->
    <path d="M136 78 C150 70 162 76 168 90 C172 100 168 112 156 118 L142 118" fill="#ffffff" stroke="url(#bronzeGrad)" stroke-width="6"/>
    <!-- Left Arm -->
    <path d="M64 78 C50 70 38 76 32 90 C28 100 32 112 44 118 L58 118" fill="#ffffff" stroke="url(#bronzeGrad)" stroke-width="6"/>

    <!-- Abs Lines -->
    <path d="M88 132 L112 132" stroke="url(#bronzeGrad)" stroke-width="4" stroke-linecap="round"/>
    <path d="M90 142 L110 142" stroke="url(#bronzeGrad)" stroke-width="4" stroke-linecap="round"/>
  </g>

  <!-- Blue Arc swoosh above TBT -->
  <path d="M 60 220 Q 200 200 340 220" fill="none" stroke="url(#bronzeGrad)" stroke-width="5" stroke-linecap="round" />

  <!-- TBT Bold Text -->
  <text x="200" y="278" font-family="'Plus Jakarta Sans', Impact, sans-serif" font-weight="900" font-size="74" fill="url(#blueGrad)" text-anchor="middle" letter-spacing="4">
    TBT
  </text>

  <!-- Blue Arc swoosh under TBT -->
  <path d="M 70 294 Q 200 310 330 294" fill="none" stroke="url(#bronzeGrad)" stroke-width="4" stroke-linecap="round" />

  <!-- THE BODY TOWN text -->
  <text x="200" y="328" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="24" fill="#1e3a8a" text-anchor="middle" letter-spacing="3">
    THE BODY TOWN
  </text>

  <!-- GYM & SPA text -->
  <text x="200" y="354" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="16" fill="#c2410c" text-anchor="middle" letter-spacing="5">
    - GYM &amp; SPA -
  </text>
</svg>
`)}`;

export const DEFAULT_GYM_SETTINGS = {
  gymName: "The Body Town Gym & Spa",
  address: "SCO-45, 2nd Floor, Pocket, 1, NAC Rd, Sector-13, Chandigarh, 160101",
  gstNumber: "04AAACB2194K1Z8",
  phone: "+91 98765 43210",
  email: "billing@thebodytowngym.com",
  website: "www.thebodytowngym.com",
  invoicePrefix: "TBT-2026-",
  nextReceiptNumber: 1042,
  currencySymbol: "₹",
  defaultTaxRate: 18,
  logoBase64: DEFAULT_TBT_LOGO_SVG,
  termsAndConditions: "1. Fees once paid are strictly non-refundable and non-transferable under any circumstances.\n2. Gym access card or registered biometric check-in is mandatory upon entry.\n3. Proper athletic gym attire and clean indoor training shoes must be worn on the workout floor.\n4. Members are required to re-rack all free weights and wipe down equipment after use."
};
