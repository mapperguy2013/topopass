export type KnowledgeQuestionData = {
  id: string;
  type: "knowledge";
  prompt: string;
  options: string[];
  correctAnswer: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  sourceNote: string;
  isActive: boolean;
  questionFamily?: "topographical" | "seru";
  explanation?: string;
  tip?: string;
  incorrectExplanations?: Record<string, string>;
};

export const knowledgeQuestionBank: KnowledgeQuestionData[] = [
  {
    id: "knowledge-cardinal-direction",
    type: "knowledge",
    prompt: "Which direction is opposite north?",
    options: ["South", "East", "West", "North-east"],
    correctAnswer: "South",
    difficulty: "easy",
    category: "Direction sense",
    sourceNote: "General map-reading principle",
    isActive: true,
    explanation: "South is the cardinal direction opposite north.",
    tip: "Memorise the four cardinal opposites: north/south and east/west."
  },
  {
    id: "knowledge-road-atlas-index",
    type: "knowledge",
    prompt: "What should you use first to locate a named street in a printed street atlas?",
    options: ["Street index", "Scale bar", "Compass rose", "Cover map"],
    correctAnswer: "Street index",
    difficulty: "easy",
    category: "Map interpretation",
    sourceNote: "Printed street-atlas navigation",
    isActive: true,
    explanation: "A street index identifies the page and grid area for a named street.",
    tip: "Use the index first, then move to the page grid instead of scanning the whole map."
  },
  {
    id: "knowledge-route-check",
    type: "knowledge",
    prompt: "Before tracing a route, which two locations should be confirmed on the map?",
    options: [
      "Start and destination",
      "Nearest two parks",
      "Two borough boundaries",
      "North and south map edges"
    ],
    correctAnswer: "Start and destination",
    difficulty: "medium",
    category: "Route planning",
    sourceNote: "Point-to-point route preparation",
    isActive: true,
    explanation: "Confirming both endpoints establishes the journey that must be planned.",
    tip: "Mark the start and destination mentally before choosing roads between them."
  },
  {
    id: "knowledge-map-scale",
    type: "knowledge",
    prompt: "What does a map scale help you estimate?",
    options: [
      "Distance on the ground",
      "Road speed limits",
      "Traffic volume",
      "Building opening hours"
    ],
    correctAnswer: "Distance on the ground",
    difficulty: "easy",
    category: "Map interpretation",
    sourceNote: "General map-reading principle",
    isActive: true,
    explanation: "The scale relates a distance measured on the map to distance on the ground.",
    tip: "Use scale to compare route options, especially when two routes look similar."
  },
  {
    id: "knowledge-grid-reference-order",
    type: "knowledge",
    prompt: "When reading a grid reference, which value is normally read first?",
    options: ["Easting", "Northing", "Elevation", "Distance"],
    correctAnswer: "Easting",
    difficulty: "medium",
    category: "Map interpretation",
    sourceNote: "Standard grid-reference convention",
    isActive: true,
    explanation: "Grid references are normally read eastings first, then northings.",
    tip: "Remember: go across first, then up."
  },
  {
    id: "knowledge-one-way-arrow",
    type: "knowledge",
    prompt: "What does an arrow shown along a one-way street indicate?",
    options: [
      "Permitted travel direction",
      "Direction of north",
      "Nearest station",
      "Road gradient"
    ],
    correctAnswer: "Permitted travel direction",
    difficulty: "easy",
    category: "Map interpretation",
    sourceNote: "General road-map symbol knowledge",
    isActive: true,
    explanation: "The arrow shows the direction in which traffic may travel on that street.",
    tip: "Check one-way arrows before committing to a route through central London."
  },
  {
    id: "knowledge-route-junction-check",
    type: "knowledge",
    prompt: "Why should junctions be checked carefully when planning a route?",
    options: [
      "To confirm roads connect in the required direction",
      "To count nearby buildings",
      "To identify the map publisher",
      "To measure the page margin"
    ],
    correctAnswer: "To confirm roads connect in the required direction",
    difficulty: "medium",
    category: "Route planning",
    sourceNote: "Route continuity and junction awareness",
    isActive: true,
    explanation: "Junction checks confirm that the chosen streets connect as intended.",
    tip: "Trace through each junction slowly and confirm the next road name."
  },
  {
    id: "knowledge-landmark-orientation",
    type: "knowledge",
    prompt: "How can a major station or landmark help during map reading?",
    options: [
      "It provides a recognisable orientation point",
      "It replaces the need to read road names",
      "It proves every nearby road is two-way",
      "It sets the map scale"
    ],
    correctAnswer: "It provides a recognisable orientation point",
    difficulty: "easy",
    category: "London geography",
    sourceNote: "Landmark-based orientation",
    isActive: true,
    explanation: "Recognisable landmarks help establish position and orientation on the map.",
    tip: "Use major stations, parks, and rivers as anchor points before reading smaller streets."
  }
];

knowledgeQuestionBank.push(
  {
    id: "knowledge-paddington-location",
    type: "knowledge",
    prompt: "Which major railway station is closely associated with Praed Street and the Paddington area?",
    options: ["Paddington", "Waterloo", "Fenchurch Street", "Blackfriars"],
    correctAnswer: "Paddington",
    difficulty: "easy",
    category: "Stations and transport hubs",
    sourceNote: "London station location knowledge",
    isActive: true,
    explanation: "Paddington station sits in west central London by Praed Street.",
    tip: "Associate Paddington with Praed Street, Edgware Road, and routes toward west London."
  },
  {
    id: "knowledge-waterloo-river-side",
    type: "knowledge",
    prompt: "On which side of the River Thames is Waterloo station?",
    options: ["South side", "North side", "East side only", "Inside Hyde Park"],
    correctAnswer: "South side",
    difficulty: "easy",
    category: "Stations and transport hubs",
    sourceNote: "London station and river orientation",
    isActive: true,
    explanation: "Waterloo station is on the south side of the Thames near the South Bank.",
    tip: "Use the Thames as a major orientation line when locating central London stations."
  },
  {
    id: "knowledge-liverpool-street-area",
    type: "knowledge",
    prompt: "Liverpool Street station is in which broad part of central London?",
    options: ["The City", "South Kensington", "Paddington", "Brixton"],
    correctAnswer: "The City",
    difficulty: "medium",
    category: "Stations and transport hubs",
    sourceNote: "London station area knowledge",
    isActive: true,
    explanation: "Liverpool Street station is in the City of London near Bishopsgate.",
    tip: "Link Liverpool Street with the City, Bishopsgate, Moorgate, and eastbound routes."
  },
  {
    id: "knowledge-victoria-nearby-area",
    type: "knowledge",
    prompt: "Which area is Victoria station closest to?",
    options: ["Westminster", "Camden Town", "Greenwich", "Whitechapel"],
    correctAnswer: "Westminster",
    difficulty: "easy",
    category: "Stations and transport hubs",
    sourceNote: "London station area knowledge",
    isActive: true,
    explanation: "Victoria station is close to Westminster, Buckingham Palace Road, and Victoria Street.",
    tip: "Use Victoria as a western Westminster anchor point."
  },
  {
    id: "knowledge-st-thomas-location",
    type: "knowledge",
    prompt: "St Thomas' Hospital is beside which major London landmark area?",
    options: ["Westminster Bridge and the Houses of Parliament", "Oxford Circus", "Camden Market", "Hyde Park Corner"],
    correctAnswer: "Westminster Bridge and the Houses of Parliament",
    difficulty: "medium",
    category: "Hospitals and key public buildings",
    sourceNote: "London hospital location knowledge",
    isActive: true,
    explanation: "St Thomas' Hospital is on the south bank of the Thames opposite Parliament.",
    tip: "For hospitals, learn the nearest bridge or main road as well as the name."
  },
  {
    id: "knowledge-great-ormond-street-area",
    type: "knowledge",
    prompt: "Great Ormond Street Hospital is in which central London area?",
    options: ["Bloomsbury", "Mayfair", "Limehouse", "Chelsea"],
    correctAnswer: "Bloomsbury",
    difficulty: "medium",
    category: "Hospitals and key public buildings",
    sourceNote: "London hospital location knowledge",
    isActive: true,
    explanation: "Great Ormond Street Hospital is in Bloomsbury, north of Holborn.",
    tip: "Bloomsbury contains several important hospitals, squares, and academic landmarks."
  },
  {
    id: "knowledge-uclh-road",
    type: "knowledge",
    prompt: "University College Hospital is most closely associated with which road corridor?",
    options: ["Euston Road", "King's Road", "Commercial Road", "Park Lane"],
    correctAnswer: "Euston Road",
    difficulty: "medium",
    category: "Hospitals and key public buildings",
    sourceNote: "London hospital location knowledge",
    isActive: true,
    explanation: "University College Hospital is near Euston Road and Tottenham Court Road.",
    tip: "Use Euston Road as a key east-west driver orientation route."
  },
  {
    id: "knowledge-heathrow-direction",
    type: "knowledge",
    prompt: "From central London, Heathrow Airport is generally in which direction?",
    options: ["West", "East", "North-east", "South-east"],
    correctAnswer: "West",
    difficulty: "easy",
    category: "London geography",
    sourceNote: "London airport orientation",
    isActive: true,
    explanation: "Heathrow Airport lies west of central London.",
    tip: "Learn airports by compass direction: Heathrow west, City east, Gatwick south."
  },
  {
    id: "knowledge-city-airport-area",
    type: "knowledge",
    prompt: "London City Airport is in which broad area?",
    options: ["Docklands", "Hammersmith", "Hampstead", "Richmond"],
    correctAnswer: "Docklands",
    difficulty: "medium",
    category: "London geography",
    sourceNote: "London airport orientation",
    isActive: true,
    explanation: "London City Airport is in the Royal Docks/Docklands area of east London.",
    tip: "Associate London City Airport with the eastern side of London and the docks."
  },
  {
    id: "knowledge-tower-bridge-position",
    type: "knowledge",
    prompt: "Tower Bridge is immediately east of which bridge?",
    options: ["London Bridge", "Westminster Bridge", "Vauxhall Bridge", "Albert Bridge"],
    correctAnswer: "London Bridge",
    difficulty: "medium",
    category: "Bridges and river crossings",
    sourceNote: "River crossing sequence knowledge",
    isActive: true,
    explanation: "Tower Bridge is the next major Thames crossing east of London Bridge.",
    tip: "Practise Thames bridges in sequence to improve route planning across the river."
  },
  {
    id: "knowledge-westminster-bridge-landmark",
    type: "knowledge",
    prompt: "Which landmark is closest to Westminster Bridge?",
    options: ["Houses of Parliament", "Royal Albert Hall", "Camden Market", "British Museum"],
    correctAnswer: "Houses of Parliament",
    difficulty: "easy",
    category: "Bridges and river crossings",
    sourceNote: "River crossing and landmark knowledge",
    isActive: true,
    explanation: "Westminster Bridge crosses the Thames by the Houses of Parliament.",
    tip: "When learning a bridge, learn the landmark at each end."
  },
  {
    id: "knowledge-euston-road-route",
    type: "knowledge",
    prompt: "Euston Road forms part of which important central London road corridor?",
    options: ["A501 / Inner Ring Road corridor", "A4 westway only", "South Circular", "M25"],
    correctAnswer: "A501 / Inner Ring Road corridor",
    difficulty: "hard",
    category: "Major roads and routes",
    sourceNote: "Central London road knowledge",
    isActive: true,
    explanation: "Euston Road is part of the A501 corridor across north central London.",
    tip: "Use A-road corridors to create a road-first mental map."
  },
  {
    id: "knowledge-park-lane-edge",
    type: "knowledge",
    prompt: "Park Lane runs along the eastern edge of which park?",
    options: ["Hyde Park", "Regent's Park", "Victoria Park", "Battersea Park"],
    correctAnswer: "Hyde Park",
    difficulty: "easy",
    category: "Major roads and routes",
    sourceNote: "Road and park orientation",
    isActive: true,
    explanation: "Park Lane forms the eastern boundary of Hyde Park.",
    tip: "Use large parks as road-orientation blocks, especially Hyde Park and Regent's Park."
  },
  {
    id: "knowledge-strand-route",
    type: "knowledge",
    prompt: "The Strand helps connect Trafalgar Square toward which area?",
    options: ["Aldwych and Fleet Street", "Hampstead Heath", "Canary Wharf", "Brixton"],
    correctAnswer: "Aldwych and Fleet Street",
    difficulty: "medium",
    category: "Major roads and routes",
    sourceNote: "Central London road knowledge",
    isActive: true,
    explanation: "The Strand runs east from Trafalgar Square toward Aldwych and Fleet Street.",
    tip: "Learn named central roads as links between major nodes."
  },
  {
    id: "knowledge-hyde-park-corner",
    type: "knowledge",
    prompt: "Hyde Park Corner is a major junction near which park?",
    options: ["Hyde Park", "Clapham Common", "Greenwich Park", "Victoria Park"],
    correctAnswer: "Hyde Park",
    difficulty: "easy",
    category: "Landmarks and destinations",
    sourceNote: "Park and junction location knowledge",
    isActive: true,
    explanation: "Hyde Park Corner is at the south-east corner of Hyde Park.",
    tip: "Corners of large parks often form useful navigation junctions."
  },
  {
    id: "knowledge-regents-park-position",
    type: "knowledge",
    prompt: "Regent's Park is generally north of which major road corridor?",
    options: ["Marylebone Road / Euston Road", "Commercial Road", "Old Kent Road", "Brompton Road"],
    correctAnswer: "Marylebone Road / Euston Road",
    difficulty: "medium",
    category: "Landmarks and destinations",
    sourceNote: "Park and road orientation",
    isActive: true,
    explanation: "Regent's Park sits north of the Marylebone Road and Euston Road corridor.",
    tip: "Relate parks to the main roads that border them."
  },
  {
    id: "knowledge-british-museum-area",
    type: "knowledge",
    prompt: "The British Museum is in which area?",
    options: ["Bloomsbury", "Knightsbridge", "Wapping", "Peckham"],
    correctAnswer: "Bloomsbury",
    difficulty: "easy",
    category: "Landmarks and destinations",
    sourceNote: "London landmark location knowledge",
    isActive: true,
    explanation: "The British Museum is in Bloomsbury near Great Russell Street.",
    tip: "Museum locations often make strong central London anchor points."
  },
  {
    id: "knowledge-tate-modern-river-side",
    type: "knowledge",
    prompt: "Tate Modern is on which side of the Thames?",
    options: ["South side", "North side", "West side of Hyde Park", "Inside the City"],
    correctAnswer: "South side",
    difficulty: "medium",
    category: "Landmarks and destinations",
    sourceNote: "London gallery and river orientation",
    isActive: true,
    explanation: "Tate Modern is on Bankside, on the south side of the Thames.",
    tip: "Use Bankside, South Bank, and the river bridges together when reading this area."
  },
  {
    id: "knowledge-national-gallery-square",
    type: "knowledge",
    prompt: "The National Gallery faces which major square?",
    options: ["Trafalgar Square", "Russell Square", "Sloane Square", "Berkeley Square"],
    correctAnswer: "Trafalgar Square",
    difficulty: "easy",
    category: "Landmarks and destinations",
    sourceNote: "London landmark location knowledge",
    isActive: true,
    explanation: "The National Gallery is on the north side of Trafalgar Square.",
    tip: "Pair major buildings with the square or road they face."
  },
  {
    id: "knowledge-royal-albert-hall-area",
    type: "knowledge",
    prompt: "Royal Albert Hall is closest to which area?",
    options: ["South Kensington", "Shoreditch", "Paddington Basin", "Clerkenwell"],
    correctAnswer: "South Kensington",
    difficulty: "medium",
    category: "Landmarks and destinations",
    sourceNote: "London venue location knowledge",
    isActive: true,
    explanation: "Royal Albert Hall is in the South Kensington area near Kensington Gore.",
    tip: "Learn major venues with their nearest main roads and parks."
  },
  {
    id: "knowledge-o2-area",
    type: "knowledge",
    prompt: "The O2 arena is located on which peninsula?",
    options: ["Greenwich Peninsula", "Isle of Dogs", "Chelsea Embankment", "Battersea Reach"],
    correctAnswer: "Greenwich Peninsula",
    difficulty: "medium",
    category: "Landmarks and destinations",
    sourceNote: "London venue location knowledge",
    isActive: true,
    explanation: "The O2 is on the Greenwich Peninsula in east/south-east London.",
    tip: "For large venues, learn the wider district and river position."
  },
  {
    id: "knowledge-savoy-location",
    type: "knowledge",
    prompt: "The Savoy hotel is associated with which central London road?",
    options: ["Strand", "Baker Street", "Edgware Road", "Old Street"],
    correctAnswer: "Strand",
    difficulty: "medium",
    category: "Landmarks and destinations",
    sourceNote: "London hotel location knowledge",
    isActive: true,
    explanation: "The Savoy is located off the Strand near the river and Covent Garden.",
    tip: "Hotels are useful pickup landmarks; learn the nearest named road."
  },
  {
    id: "knowledge-dorchester-location",
    type: "knowledge",
    prompt: "The Dorchester hotel is on which road?",
    options: ["Park Lane", "Euston Road", "Borough High Street", "Whitechapel Road"],
    correctAnswer: "Park Lane",
    difficulty: "medium",
    category: "Landmarks and destinations",
    sourceNote: "London hotel location knowledge",
    isActive: true,
    explanation: "The Dorchester is on Park Lane by Hyde Park.",
    tip: "Associate Park Lane with major hotels and Hyde Park."
  },
  {
    id: "knowledge-borough-market-station",
    type: "knowledge",
    prompt: "Borough Market is closest to which major railway station?",
    options: ["London Bridge", "Paddington", "Marylebone", "Victoria"],
    correctAnswer: "London Bridge",
    difficulty: "easy",
    category: "Landmarks and destinations",
    sourceNote: "London market location knowledge",
    isActive: true,
    explanation: "Borough Market is beside London Bridge station in Southwark.",
    tip: "Markets often sit beside busy stations or historic road junctions."
  },
  {
    id: "knowledge-covent-garden-area",
    type: "knowledge",
    prompt: "Covent Garden is most closely associated with which central London activity area?",
    options: ["Theatres and market streets", "Airport terminals", "Royal docks", "Motorway services"],
    correctAnswer: "Theatres and market streets",
    difficulty: "easy",
    category: "Landmarks and destinations",
    sourceNote: "Central London district knowledge",
    isActive: true,
    explanation: "Covent Garden is a central theatre, market, and visitor area.",
    tip: "For dense central areas, learn nearby stations and street patterns."
  },
  {
    id: "knowledge-downing-street-area",
    type: "knowledge",
    prompt: "Downing Street is off which major road?",
    options: ["Whitehall", "Camden High Street", "Kingsland Road", "Bayswater Road"],
    correctAnswer: "Whitehall",
    difficulty: "medium",
    category: "Hospitals and key public buildings",
    sourceNote: "Government landmark location knowledge",
    isActive: true,
    explanation: "Downing Street is off Whitehall in Westminster.",
    tip: "Government landmarks cluster around Whitehall, Parliament, and Westminster."
  },
  {
    id: "knowledge-royal-courts-road",
    type: "knowledge",
    prompt: "The Royal Courts of Justice are on which road?",
    options: ["Strand", "Marylebone Road", "Commercial Road", "Park Lane"],
    correctAnswer: "Strand",
    difficulty: "medium",
    category: "Hospitals and key public buildings",
    sourceNote: "Civic landmark location knowledge",
    isActive: true,
    explanation: "The Royal Courts of Justice are on the Strand near Temple.",
    tip: "Civic buildings are useful for route planning because they sit on major roads."
  },
  {
    id: "knowledge-route-main-then-local",
    type: "knowledge",
    prompt: "For a clear central London route, what is usually a sensible first planning approach?",
    options: [
      "Use main roads for the longer section, then local streets near the destination",
      "Ignore main roads and use only alleys",
      "Choose the route with the most turns",
      "Cross the river whenever possible"
    ],
    correctAnswer: "Use main roads for the longer section, then local streets near the destination",
    difficulty: "medium",
    category: "Route planning",
    sourceNote: "Route-planning strategy",
    isActive: true,
    explanation: "Main roads give a clearer structure, while local roads complete the final approach.",
    tip: "Plan the route in stages: leave, connect, approach, arrive."
  },
  {
    id: "knowledge-route-avoid-restricted",
    type: "knowledge",
    prompt: "When a map shows a road restriction, what should a driver do?",
    options: ["Plan a legal alternative route", "Assume the restriction does not apply", "Drive through if it is shorter", "Ignore nearby one-way arrows"],
    correctAnswer: "Plan a legal alternative route",
    difficulty: "medium",
    category: "Map interpretation",
    sourceNote: "Driver-focused map reading",
    isActive: true,
    explanation: "Restrictions can prevent a route from being legally usable by car.",
    tip: "Always check one-way streets, restricted turns, and access restrictions before finalising a route."
  },
  {
    id: "knowledge-river-crossing-choice",
    type: "knowledge",
    prompt: "When planning a route across the Thames, what should be checked early?",
    options: ["The most suitable bridge for the start and destination", "The nearest theatre only", "The colour of the map background", "The number of hotel labels"],
    correctAnswer: "The most suitable bridge for the start and destination",
    difficulty: "medium",
    category: "Bridges and river crossings",
    sourceNote: "River crossing route planning",
    isActive: true,
    explanation: "Choosing the right bridge early avoids unnecessary east-west detours along the river.",
    tip: "Learn bridge sequence and connect each bridge to nearby main roads."
  },
  {
    id: "knowledge-final-approach-check",
    type: "knowledge",
    prompt: "Why is the final approach to a destination important?",
    options: ["One-way streets and access points may affect the last few turns", "The map scale stops working near destinations", "Stations replace road names", "All local roads become pedestrian only"],
    correctAnswer: "One-way streets and access points may affect the last few turns",
    difficulty: "hard",
    category: "Route planning",
    sourceNote: "Driver-focused destination approach",
    isActive: true,
    explanation: "The last few streets can determine whether a route is practical for a driver.",
    tip: "After selecting the main route, trace the last turns carefully into the destination."
  },
  {
    id: "knowledge-thames-orientation",
    type: "knowledge",
    prompt: "Why is the River Thames especially useful when reading a London map?",
    options: ["It provides a clear east-west orientation feature through central London", "It shows every speed limit", "It replaces road hierarchy", "It marks the boundary of all boroughs"],
    correctAnswer: "It provides a clear east-west orientation feature through central London",
    difficulty: "easy",
    category: "Map interpretation",
    sourceNote: "London orientation knowledge",
    isActive: true,
    explanation: "The Thames is a prominent feature that helps orient north/south and bridge choices.",
    tip: "Use the river first, then bridge names, then nearby roads."
  }
);
