import type { KnowledgeQuestionData } from "./knowledgeQuestions.ts";
import { phvHandbookQuestions } from "./seruPhvQuestions.ts";

const sourceNote = "Original SERU-style private hire learning content";

const starterSeruQuestions: KnowledgeQuestionData[] = [
  {
    id: "seru-driver-licence-check",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "What should a private hire driver do before starting work if they are unsure whether their licence conditions have changed?",
    options: [
      "Check the current licence conditions before working",
      "Ignore the conditions until renewal",
      "Ask a passenger to confirm the rules",
      "Only check after receiving a complaint"
    ],
    correctAnswer: "Check the current licence conditions before working",
    difficulty: "easy",
    category: "Driver licensing and responsibilities",
    sourceNote,
    isActive: true,
    explanation:
      "Drivers are responsible for understanding and following the conditions that apply to their licence.",
    tip: "Treat licensing conditions as a working checklist, not as paperwork to read only once."
  },
  {
    id: "seru-driver-badge-visibility",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "Why should a driver display required identification clearly when working?",
    options: [
      "It helps passengers and enforcement officers identify the licensed driver",
      "It replaces the need for safe driving",
      "It allows the driver to accept street hails",
      "It proves the fare has been paid"
    ],
    correctAnswer:
      "It helps passengers and enforcement officers identify the licensed driver",
    difficulty: "easy",
    category: "Driver licensing and responsibilities",
    sourceNote,
    isActive: true,
    explanation:
      "Clear identification supports passenger confidence and regulatory accountability.",
    tip: "Keep required driver identification visible and current whenever you are working."
  },
  {
    id: "seru-passenger-seatbelt-child",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A passenger is travelling with a young child. What is the safest first response?",
    options: [
      "Check that the child can travel safely and discuss suitable seating",
      "Start driving immediately because the journey is short",
      "Tell the passenger child safety is never the driver's concern",
      "Ask the child to sit on an adult's lap without checking"
    ],
    correctAnswer:
      "Check that the child can travel safely and discuss suitable seating",
    difficulty: "medium",
    category: "Passenger safety",
    sourceNote,
    isActive: true,
    explanation:
      "Passenger safety includes taking sensible steps before the journey begins, especially where children are involved.",
    tip: "Pause before moving off if anything about the seating or passenger safety looks uncertain."
  },
  {
    id: "seru-unsafe-dropoff",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A passenger asks to be dropped on a busy junction where stopping would be unsafe. What should the driver do?",
    options: [
      "Choose the nearest safe legal stopping place and explain calmly",
      "Stop exactly where requested",
      "Let the passenger open the door while moving slowly",
      "Reverse into the junction to save time"
    ],
    correctAnswer:
      "Choose the nearest safe legal stopping place and explain calmly",
    difficulty: "medium",
    category: "Passenger safety",
    sourceNote,
    isActive: true,
    explanation:
      "The driver should balance passenger needs with road safety and legal stopping requirements.",
    tip: "Use calm, practical explanations when safety means you cannot stop at the exact requested point."
  },
  {
    id: "seru-safeguarding-concern",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "If a driver has a genuine safeguarding concern about a passenger, what is the best approach?",
    options: [
      "Take appropriate action and report the concern through the correct channel",
      "Ignore it unless the passenger complains",
      "Post details on social media",
      "Ask other passengers to decide what to do"
    ],
    correctAnswer:
      "Take appropriate action and report the concern through the correct channel",
    difficulty: "medium",
    category: "Safeguarding",
    sourceNote,
    isActive: true,
    explanation:
      "Safeguarding means acting responsibly when there is a real concern about someone's welfare.",
    tip: "Keep safeguarding responses factual, timely, and routed through appropriate reporting channels."
  },
  {
    id: "seru-vulnerable-passenger",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A vulnerable passenger seems confused about their destination. What should the driver do?",
    options: [
      "Stay calm, confirm details safely, and seek appropriate support if needed",
      "Drive anywhere nearby and end the journey quickly",
      "Leave the passenger at the roadside",
      "Share the passenger's details with friends"
    ],
    correctAnswer:
      "Stay calm, confirm details safely, and seek appropriate support if needed",
    difficulty: "medium",
    category: "Safeguarding",
    sourceNote,
    isActive: true,
    explanation:
      "A calm and careful response helps protect the passenger while keeping the situation professional.",
    tip: "Do not rush decisions when a passenger may be vulnerable or disoriented."
  },
  {
    id: "seru-assistance-dog",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "How should a driver respond to a passenger travelling with an assistance dog?",
    options: [
      "Treat the passenger fairly and make reasonable adjustments where required",
      "Refuse the journey because all animals are optional",
      "Charge an automatic extra fee",
      "Ask the passenger to leave the dog unattended"
    ],
    correctAnswer:
      "Treat the passenger fairly and make reasonable adjustments where required",
    difficulty: "easy",
    category: "Equality and accessibility",
    sourceNote,
    isActive: true,
    explanation:
      "Accessibility duties require fair treatment and reasonable support for disabled passengers.",
    tip: "Understand assistance-dog and accessibility expectations before accepting work."
  },
  {
    id: "seru-accessible-communication",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A passenger has a hearing impairment. Which response is most professional?",
    options: [
      "Communicate clearly, patiently, and in a way the passenger can use",
      "Cancel because communication may take longer",
      "Speak aggressively so the passenger notices",
      "Ignore the passenger's instructions"
    ],
    correctAnswer:
      "Communicate clearly, patiently, and in a way the passenger can use",
    difficulty: "easy",
    category: "Equality and accessibility",
    sourceNote,
    isActive: true,
    explanation:
      "Good accessibility practice includes adapting communication so the passenger can understand and respond.",
    tip: "Patience and clarity are practical accessibility tools."
  },
  {
    id: "seru-discrimination",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "Which behaviour best supports equality in private hire work?",
    options: [
      "Providing a respectful service regardless of protected characteristics",
      "Only accepting passengers who speak the driver's first language",
      "Charging more because a passenger needs extra time",
      "Refusing journeys based on assumptions about disability"
    ],
    correctAnswer:
      "Providing a respectful service regardless of protected characteristics",
    difficulty: "easy",
    category: "Equality and accessibility",
    sourceNote,
    isActive: true,
    explanation:
      "Equality means passengers should be treated fairly and respectfully, without unlawful discrimination.",
    tip: "Focus on the passenger's journey needs, not personal assumptions."
  },
  {
    id: "seru-customer-delay",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "Traffic delays the journey. What should the driver do?",
    options: [
      "Communicate calmly and keep the passenger informed where safe",
      "Blame the passenger",
      "Drive dangerously to make up time",
      "Stop speaking for the rest of the journey"
    ],
    correctAnswer:
      "Communicate calmly and keep the passenger informed where safe",
    difficulty: "easy",
    category: "Customer service",
    sourceNote,
    isActive: true,
    explanation:
      "Clear communication helps passengers understand delays and reduces frustration.",
    tip: "Good customer service is often about calm updates and safe decisions."
  },
  {
    id: "seru-passenger-care",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A passenger says they feel unwell during the journey. What should the driver do first?",
    options: [
      "Check what help is needed and stop safely if appropriate",
      "Ignore the passenger until arrival",
      "Tell the passenger to leave immediately while moving",
      "Increase speed without discussion"
    ],
    correctAnswer:
      "Check what help is needed and stop safely if appropriate",
    difficulty: "medium",
    category: "Passenger safety",
    sourceNote,
    isActive: true,
    explanation:
      "Passenger care requires a safe, proportionate response when a passenger becomes unwell.",
    tip: "Safety first: communicate, stop safely if needed, and seek help when appropriate."
  },
  {
    id: "seru-complaint-response",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A passenger complains about the route after the journey. What is the most professional response?",
    options: [
      "Listen calmly and explain how they can raise the issue through the proper channel",
      "Argue until the passenger gives up",
      "Delete all journey details immediately",
      "Post the passenger's complaint online"
    ],
    correctAnswer:
      "Listen calmly and explain how they can raise the issue through the proper channel",
    difficulty: "medium",
    category: "Complaints and professionalism",
    sourceNote,
    isActive: true,
    explanation:
      "Professional complaint handling is calm, factual, and directed through the correct process.",
    tip: "Do not turn a complaint into an argument; keep it factual and respectful."
  },
  {
    id: "seru-professional-language",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "Which choice best reflects professional conduct with passengers?",
    options: [
      "Use respectful language and avoid personal or offensive comments",
      "Make jokes about a passenger's appearance",
      "Pressure passengers to discuss private matters",
      "Refuse to answer reasonable journey questions"
    ],
    correctAnswer:
      "Use respectful language and avoid personal or offensive comments",
    difficulty: "easy",
    category: "Complaints and professionalism",
    sourceNote,
    isActive: true,
    explanation:
      "Professional conduct includes respectful communication throughout the passenger journey.",
    tip: "A calm, respectful tone protects both passenger experience and driver professionalism."
  },
  {
    id: "seru-booking-records",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "Why are accurate booking and journey records important?",
    options: [
      "They support accountability, safety, and complaint handling",
      "They allow drivers to ignore licensing rules",
      "They prove every passenger paid in cash",
      "They replace vehicle maintenance checks"
    ],
    correctAnswer:
      "They support accountability, safety, and complaint handling",
    difficulty: "medium",
    category: "Private hire regulations",
    sourceNote,
    isActive: true,
    explanation:
      "Accurate records can support safe operations, customer service, and regulatory compliance.",
    tip: "Treat journey records as part of professional private hire work."
  },
  {
    id: "seru-street-hailing",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "What should a private hire driver remember about taking passengers without a proper booking?",
    options: [
      "Private hire journeys should be accepted through the required booking process",
      "Street hails are always allowed for private hire vehicles",
      "A booking is unnecessary if the passenger pays first",
      "Rules only apply outside central London"
    ],
    correctAnswer:
      "Private hire journeys should be accepted through the required booking process",
    difficulty: "medium",
    category: "Private hire regulations",
    sourceNote,
    isActive: true,
    explanation:
      "Private hire work depends on the correct booking process and operating rules.",
    tip: "Know the difference between private hire bookings and taxi-style street hails."
  },
  {
    id: "seru-route-discussion",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A passenger asks why a route was chosen. What is the best response?",
    options: [
      "Explain the route calmly, including safety or traffic considerations where relevant",
      "Refuse to discuss the route",
      "Tell the passenger they are not allowed to ask",
      "Switch off navigation and guess"
    ],
    correctAnswer:
      "Explain the route calmly, including safety or traffic considerations where relevant",
    difficulty: "easy",
    category: "Journey planning and conduct",
    sourceNote,
    isActive: true,
    explanation:
      "A clear explanation helps passengers understand route choices and supports trust.",
    tip: "Route confidence includes being able to explain a sensible decision."
  },
  {
    id: "seru-passenger-request-stop",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A passenger asks to stop somewhere that is not safe. What should the driver do?",
    options: [
      "Find a safe nearby place and explain the reason",
      "Stop immediately wherever the passenger asks",
      "Ignore the passenger completely",
      "Let the passenger exit into traffic"
    ],
    correctAnswer: "Find a safe nearby place and explain the reason",
    difficulty: "easy",
    category: "Journey planning and conduct",
    sourceNote,
    isActive: true,
    explanation:
      "Passenger requests should be handled professionally, but safety remains the priority.",
    tip: "Offer the nearest safe option when the exact request is not suitable."
  },
  {
    id: "seru-lost-property-found",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A driver finds a passenger's phone in the vehicle after a journey. What should they do?",
    options: [
      "Follow the operator or licensing lost-property process",
      "Keep the phone until the passenger pays a reward",
      "Throw it away to avoid responsibility",
      "Look through the phone to identify private contacts"
    ],
    correctAnswer: "Follow the operator or licensing lost-property process",
    difficulty: "easy",
    category: "Lost property",
    sourceNote,
    isActive: true,
    explanation:
      "Lost property should be handled through the proper process, not informally or for personal gain.",
    tip: "Do not inspect private contents unless a legitimate process requires limited identification."
  },
  {
    id: "seru-lost-property-passenger",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A passenger contacts the driver directly about lost property. What is the safest response?",
    options: [
      "Use the proper operator or reporting process and avoid unsafe private arrangements",
      "Meet the passenger alone at any requested location",
      "Demand a cash payment before returning it",
      "Refuse to respond and keep the item"
    ],
    correctAnswer:
      "Use the proper operator or reporting process and avoid unsafe private arrangements",
    difficulty: "medium",
    category: "Lost property",
    sourceNote,
    isActive: true,
    explanation:
      "Lost-property handling should protect the passenger, the driver, and the item.",
    tip: "Keep lost-property communication professional and traceable."
  },
  {
    id: "seru-road-safety-mobile",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "What should a driver do if they need to use a phone for work-related information?",
    options: [
      "Use it only when safe and legal, such as when parked appropriately",
      "Use it while driving if the message is short",
      "Ask the passenger to steer briefly",
      "Look down at the phone during turns"
    ],
    correctAnswer:
      "Use it only when safe and legal, such as when parked appropriately",
    difficulty: "easy",
    category: "Road safety awareness",
    sourceNote,
    isActive: true,
    explanation:
      "Road safety requires the driver to avoid unsafe distraction and follow the law.",
    tip: "If information can wait, wait. If it cannot, stop safely first."
  },
  {
    id: "seru-fatigue",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "Why is driver fatigue a safety risk?",
    options: [
      "It can reduce concentration and reaction time",
      "It improves route memory",
      "It makes passengers more comfortable",
      "It removes the need for breaks"
    ],
    correctAnswer: "It can reduce concentration and reaction time",
    difficulty: "easy",
    category: "Road safety awareness",
    sourceNote,
    isActive: true,
    explanation:
      "Tired drivers are more likely to make poor decisions or react slowly.",
    tip: "Plan rest and do not rely on confidence alone when tired."
  },
  {
    id: "seru-vehicle-cleanliness",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "Why does vehicle cleanliness matter in private hire work?",
    options: [
      "It supports passenger comfort, professionalism, and hygiene",
      "It proves the driver knows every road",
      "It allows unsafe driving",
      "It replaces licensing responsibilities"
    ],
    correctAnswer:
      "It supports passenger comfort, professionalism, and hygiene",
    difficulty: "easy",
    category: "Customer service",
    sourceNote,
    isActive: true,
    explanation:
      "A clean vehicle is part of a professional and comfortable passenger experience.",
    tip: "Small service details can affect passenger trust."
  },
  {
    id: "seru-confidentiality",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "What should a driver do with private information heard during a journey?",
    options: [
      "Respect confidentiality and avoid sharing passenger details",
      "Repeat it to the next passenger",
      "Post it online without names",
      "Use it to make jokes with friends"
    ],
    correctAnswer:
      "Respect confidentiality and avoid sharing passenger details",
    difficulty: "medium",
    category: "Complaints and professionalism",
    sourceNote,
    isActive: true,
    explanation:
      "Professional standards include respecting passenger privacy.",
    tip: "Treat passenger information as private unless there is a proper safety or legal reason to report it."
  },
  {
    id: "seru-fare-dispute",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "A fare dispute becomes tense. What should the driver do?",
    options: [
      "Stay calm, avoid escalation, and use the correct dispute process",
      "Lock the doors until payment is increased",
      "Shout until the passenger agrees",
      "Threaten to publish the passenger's details"
    ],
    correctAnswer:
      "Stay calm, avoid escalation, and use the correct dispute process",
    difficulty: "medium",
    category: "Complaints and professionalism",
    sourceNote,
    isActive: true,
    explanation:
      "Disputes should be handled calmly and through the correct process, not by intimidation.",
    tip: "De-escalation is a professional skill."
  },
  {
    id: "seru-regulatory-awareness",
    type: "knowledge",
    questionFamily: "seru",
    prompt: "Why should a driver keep up to date with regulatory changes?",
    options: [
      "Rules and responsibilities can change during a driver's working life",
      "Regulations only apply on the day of the test",
      "Updates are optional if the driver is experienced",
      "Passengers are responsible for telling drivers the rules"
    ],
    correctAnswer:
      "Rules and responsibilities can change during a driver's working life",
    difficulty: "medium",
    category: "Private hire regulations",
    sourceNote,
    isActive: true,
    explanation:
      "Professional drivers need current knowledge, not just test-day knowledge.",
    tip: "Make checking trusted updates part of your regular working routine."
  }
];

export const seruQuestionBank: KnowledgeQuestionData[] = [
  ...starterSeruQuestions,
  ...phvHandbookQuestions
];
