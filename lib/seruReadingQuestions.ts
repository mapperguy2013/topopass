export type SeruReadingQuestion = {
  id: string;
  type: "reading_comprehension";
  questionFamily: "seru";
  category: "SERU Reading and Understanding";
  categoryId: "seru_reading_understanding";
  title: string;
  passage: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  source: "Original SERU reading practice";
  handbookSection: string;
  topic: string;
};

export const SERU_READING_UNDERSTANDING_CATEGORY =
  "SERU Reading and Understanding";

export const SERU_READING_UNDERSTANDING_QUESTIONS: SeruReadingQuestion[] = [
  {
    id: "seru-reading-001",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Checking the booking",
    passage:
      "A private hire driver arrives near a busy station to collect a passenger. Before starting the journey, the driver checks the passenger's name and destination against the booking details from the licensed operator. The passenger asks to change the destination before getting in. The driver remains polite and explains that the operator should be updated so the journey record stays accurate and the booking can still be managed properly. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "Why should the operator be updated when the destination changes?",
    options: [
      "So the booking record stays accurate",
      "So the driver can avoid speaking to the passenger",
      "So the passenger must cancel the journey",
      "So the vehicle becomes a taxi"
    ],
    correctAnswer: "So the booking record stays accurate",
    explanation:
      "The passage says the operator should be updated so the journey record stays accurate and manageable.",
    difficulty: "easy",
    source: "Original SERU reading practice",
    handbookSection: "Carrying out Private Hire Journeys",
    topic: "Booking details"
  },
  {
    id: "seru-reading-002",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Unsafe pickup request",
    passage:
      "A passenger messages the driver and asks to be collected from the middle of a red route outside a shop. Traffic is heavy, and stopping there would block a lane. The driver does not ignore the passenger. Instead, the driver replies calmly, chooses a nearby legal side road, and explains where the vehicle will wait. The driver also updates the operator so the pickup point is clear. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What is the safest decision described in the passage?",
    options: [
      "Using a nearby legal side road",
      "Stopping in the traffic lane",
      "Ignoring the passenger's message",
      "Cancelling every red route booking"
    ],
    correctAnswer: "Using a nearby legal side road",
    explanation:
      "The driver chooses a nearby legal side road because stopping at the requested place would block traffic.",
    difficulty: "medium",
    source: "Original SERU reading practice",
    handbookSection: "Driving and Parking in London",
    topic: "Safe stopping"
  },
  {
    id: "seru-reading-003",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Lost property after a journey",
    passage:
      "After completing a journey, a driver notices a small wallet on the rear seat. The driver does not open every compartment or contact the passenger privately. Instead, the driver records where and when the item was found, keeps it safe, and follows the operator's lost property process. The driver understands that property should be handled in a traceable way that protects both the passenger and the driver. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What does the passage suggest about lost property?",
    options: [
      "It should be handled through a traceable process",
      "It should be kept until a reward is offered",
      "It should be searched in detail by the driver",
      "It should be left in the vehicle for the next passenger"
    ],
    correctAnswer: "It should be handled through a traceable process",
    explanation:
      "The passage says the driver records details, keeps the item safe, and follows the operator's process.",
    difficulty: "easy",
    source: "Original SERU reading practice",
    handbookSection: "Driver Behaviour",
    topic: "Lost property"
  },
  {
    id: "seru-reading-004",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Assistance dog journey",
    passage:
      "A passenger arrives with an assistance dog and confirms the booking details. The driver is worried about dog hair in the vehicle, but remembers that assistance dogs support disabled passengers. The driver speaks respectfully, makes space where possible, and completes the booked journey. After the passenger leaves, the driver cleans the vehicle as part of normal professional preparation for the next customer. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What is the main reason the driver completes the journey?",
    options: [
      "The dog is part of the passenger's accessibility support",
      "The driver wants to avoid cleaning the vehicle",
      "The passenger does not need a booking",
      "Assistance dogs must travel in the boot"
    ],
    correctAnswer: "The dog is part of the passenger's accessibility support",
    explanation:
      "The passage explains that assistance dogs support disabled passengers, so the driver treats the journey fairly.",
    difficulty: "easy",
    source: "Original SERU reading practice",
    handbookSection: "Being Aware of Equality and Disability",
    topic: "Assistance dogs"
  },
  {
    id: "seru-reading-005",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Wheelchair user needing time",
    passage:
      "A wheelchair user books a suitable private hire vehicle for a hospital appointment. At pickup, the passenger explains that they need a few extra minutes to get ready and position safely. The driver checks that the vehicle is stopped legally, stays patient, and avoids rushing the passenger. The driver understands that reasonable time and calm communication can make the journey safer and more respectful. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What can be inferred about the driver's behaviour?",
    options: [
      "The driver is respecting the passenger's mobility needs",
      "The driver is refusing the booking",
      "The driver is asking the passenger to hurry",
      "The driver is treating the appointment as unimportant"
    ],
    correctAnswer: "The driver is respecting the passenger's mobility needs",
    explanation:
      "The driver allows extra time, checks safe stopping, and avoids rushing the passenger.",
    difficulty: "medium",
    source: "Original SERU reading practice",
    handbookSection: "Being Aware of Equality and Disability",
    topic: "Wheelchair access"
  },
  {
    id: "seru-reading-006",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Unaccompanied child booking",
    passage:
      "A driver receives a booking for a young passenger travelling alone from a sports centre to a home address. The booking notes include the name of the adult who will meet the child at the destination. Before leaving, the driver confirms the details with the operator and keeps the journey professional. On arrival, the driver checks that the named adult is present before ending the booking. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "Which action happens last in the passage?",
    options: [
      "The driver checks that the named adult is present",
      "The driver receives the booking",
      "The driver confirms details with the operator",
      "The booking notes include an adult's name"
    ],
    correctAnswer: "The driver checks that the named adult is present",
    explanation:
      "The passage says this check happens on arrival before the booking ends.",
    difficulty: "medium",
    source: "Original SERU reading practice",
    handbookSection: "Safeguarding Children and Adults at Risk",
    topic: "Child handover"
  },
  {
    id: "seru-reading-007",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Adult passenger at risk",
    passage:
      "Late at night, a driver collects an adult passenger who appears frightened and unsure about the destination. Another person outside the vehicle keeps answering for the passenger and tells the driver not to ask questions. The driver does not challenge anyone aggressively. The driver keeps calm, follows the booked journey only when safe, records relevant details, and reports the concern through the appropriate route after considering immediate safety. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "Why is this a safeguarding situation?",
    options: [
      "The passenger may not be able to speak freely",
      "The driver dislikes late-night work",
      "The destination is unfamiliar",
      "The passenger is carrying luggage"
    ],
    correctAnswer: "The passenger may not be able to speak freely",
    explanation:
      "The passage describes another person controlling the conversation while the passenger appears frightened.",
    difficulty: "hard",
    source: "Original SERU reading practice",
    handbookSection: "Safeguarding Children and Adults at Risk",
    topic: "Adults at risk"
  },
  {
    id: "seru-reading-008",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Reducing conflict",
    passage:
      "A passenger becomes angry because roadworks have delayed the journey. The driver keeps both hands on the wheel, uses a calm voice, and explains that the route will be adjusted when safe. The driver does not argue or make personal comments. When the passenger continues shouting, the driver focuses on safe driving and contacts the operator at the next safe opportunity. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "Which phrase best describes the driver's approach?",
    options: [
      "Calm de-escalation and safe driving",
      "Ignoring all passenger concerns",
      "Arguing until the passenger stops",
      "Changing route without checking safety"
    ],
    correctAnswer: "Calm de-escalation and safe driving",
    explanation:
      "The driver uses a calm voice, avoids argument, keeps driving safely, and contacts the operator safely.",
    difficulty: "medium",
    source: "Original SERU reading practice",
    handbookSection: "Staying Safe",
    topic: "Conflict reduction"
  },
  {
    id: "seru-reading-009",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Vehicle damage after a journey",
    passage:
      "After a late journey, a driver notices that a rear door mirror has been damaged. The vehicle can still move, but the mirror does not give a clear view. The driver decides not to accept another booking until the issue is reported and the vehicle is made safe. The driver also keeps a note of when the damage was discovered and follows the operator's reporting process. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "Why does the driver stop accepting bookings?",
    options: [
      "The damaged mirror may affect safe driving",
      "The driver wants a longer break",
      "The operator has cancelled all journeys",
      "A damaged mirror means the licence is automatically renewed"
    ],
    correctAnswer: "The damaged mirror may affect safe driving",
    explanation:
      "The mirror does not give a clear view, so the driver treats it as a safety issue.",
    difficulty: "medium",
    source: "Original SERU reading practice",
    handbookSection: "Licensing Requirements for PHVs",
    topic: "Vehicle condition"
  },
  {
    id: "seru-reading-010",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Red route stopping",
    passage:
      "A passenger asks to be dropped directly outside an office on a red route. The driver sees signs showing that stopping is not allowed at that time. The driver explains the restriction and offers a safe legal place nearby. The passenger is frustrated, but the driver stays polite and makes clear that road rules and safety must be followed during private hire journeys. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What does the word restriction mean in the passage?",
    options: [
      "A rule that limits what can be done",
      "A passenger's preferred destination",
      "A faster route through traffic",
      "A type of private hire licence"
    ],
    correctAnswer: "A rule that limits what can be done",
    explanation:
      "The signs show stopping is not allowed, so restriction means a limiting rule.",
    difficulty: "easy",
    source: "Original SERU reading practice",
    handbookSection: "Driving and Parking in London",
    topic: "Red routes"
  },
  {
    id: "seru-reading-011",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Mobile phone distraction",
    passage:
      "During a journey, the driver's phone receives several operator messages about later bookings. The passenger suggests reading them quickly while traffic is moving slowly. The driver refuses politely and waits until the vehicle is parked safely and legally before checking the phone. The driver understands that slow traffic does not remove the risk of distraction or the responsibility to stay in control. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What is the main point of the passage?",
    options: [
      "Phone messages should wait until it is safe and legal",
      "Slow traffic makes phone use safe",
      "Passengers may decide when the driver reads messages",
      "Operator messages are never important"
    ],
    correctAnswer: "Phone messages should wait until it is safe and legal",
    explanation:
      "The driver waits until parked safely and legally because distraction remains a risk.",
    difficulty: "easy",
    source: "Original SERU reading practice",
    handbookSection: "Safer Driving",
    topic: "Distraction"
  },
  {
    id: "seru-reading-012",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Complaint about route",
    passage:
      "At the end of a journey, a passenger says the route was too long and asks for the driver's personal phone number to discuss it later. The driver listens, avoids arguing, and explains that the operator has the booking record and can handle complaints through the correct channel. The driver keeps the response factual and does not share private contact details. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "Why does the driver direct the passenger to the operator?",
    options: [
      "The operator has the booking record and complaint process",
      "The driver wants to hide the journey",
      "The passenger is not allowed to complain",
      "The route was definitely wrong"
    ],
    correctAnswer: "The operator has the booking record and complaint process",
    explanation:
      "The passage says the operator has the booking record and can handle complaints correctly.",
    difficulty: "medium",
    source: "Original SERU reading practice",
    handbookSection: "Driver Behaviour",
    topic: "Complaints"
  },
  {
    id: "seru-reading-013",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Professional language",
    passage:
      "A passenger is quiet during the journey and gives short answers. The driver avoids making personal remarks about the passenger's appearance, mood, or private life. Instead, the driver confirms the destination, asks only necessary journey questions, and keeps the conversation respectful. The passenger may choose not to chat, and the driver understands that professionalism includes knowing when not to continue a conversation. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What does the passage show about professional language?",
    options: [
      "It should be respectful and relevant to the journey",
      "It should force the passenger to talk",
      "It should include comments about appearance",
      "It should avoid confirming the destination"
    ],
    correctAnswer: "It should be respectful and relevant to the journey",
    explanation:
      "The driver asks only necessary journey questions and avoids personal remarks.",
    difficulty: "easy",
    source: "Original SERU reading practice",
    handbookSection: "Driver Behaviour",
    topic: "Professional conduct"
  },
  {
    id: "seru-reading-014",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Reporting a safeguarding concern",
    passage:
      "A driver drops off a passenger and later thinks the situation may have involved exploitation. The driver writes down factual details such as time, location, vehicle journey information, and what was actually seen or heard. The driver avoids guessing about motives and reports the concern through the appropriate route. The driver knows that factual information is more useful than rumours or emotional descriptions. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "Which detail would be most useful according to the passage?",
    options: [
      "What the driver actually saw or heard",
      "A guess about everyone's motives",
      "A social media opinion",
      "A rumour from another driver"
    ],
    correctAnswer: "What the driver actually saw or heard",
    explanation:
      "The passage says factual information, including what was seen or heard, is more useful than guesses.",
    difficulty: "hard",
    source: "Original SERU reading practice",
    handbookSection: "Safeguarding Children and Adults at Risk",
    topic: "Reporting concerns"
  },
  {
    id: "seru-reading-015",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Booking through an operator",
    passage:
      "A person outside a venue asks a private hire driver for a ride without using the operator. The driver explains that private hire journeys must be arranged through the proper booking process. The person says they are in a hurry and offers cash. The driver still refuses the unbooked journey and suggests arranging a booking through a licensed operator before any trip starts. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What is the driver refusing?",
    options: [
      "An unbooked private hire journey",
      "A journey arranged by a licensed operator",
      "A passenger who has confirmed a booking",
      "A request for the destination"
    ],
    correctAnswer: "An unbooked private hire journey",
    explanation:
      "The person asks for a ride without using the operator, so the driver refuses an unbooked journey.",
    difficulty: "easy",
    source: "Original SERU reading practice",
    handbookSection: "Carrying out Private Hire Journeys",
    topic: "Operator bookings"
  },
  {
    id: "seru-reading-016",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Ridesharing expectations",
    passage:
      "During a booked rideshare journey, the first passenger is surprised when the app shows another pickup. The driver explains that the shared journey was arranged by the operator and may include other booked passengers. The driver keeps each passenger's personal details private and confirms only the information needed for safe pickup and drop-off. The driver also keeps the route explanation calm and brief. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What should the driver avoid sharing?",
    options: [
      "Other passengers' personal details",
      "That the journey is shared",
      "The need for a safe pickup",
      "Basic route information"
    ],
    correctAnswer: "Other passengers' personal details",
    explanation:
      "The passage says the driver keeps each passenger's personal details private.",
    difficulty: "medium",
    source: "Original SERU reading practice",
    handbookSection: "Ridesharing",
    topic: "Passenger privacy"
  },
  {
    id: "seru-reading-017",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Respectful communication",
    passage:
      "A passenger speaks English slowly and asks the driver to repeat a route explanation. The driver does not laugh or show impatience. The driver repeats the information in simple language and checks that the passenger understands before moving off. The driver knows that respectful communication helps passengers who may be tired, anxious, disabled, older, or unfamiliar with London. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What is the best summary of the driver's communication?",
    options: [
      "Patient, clear, and respectful",
      "Rushed and dismissive",
      "Silent and confusing",
      "Joking and personal"
    ],
    correctAnswer: "Patient, clear, and respectful",
    explanation:
      "The driver repeats information simply, checks understanding, and avoids impatience.",
    difficulty: "easy",
    source: "Original SERU reading practice",
    handbookSection: "Being Aware of Equality and Disability",
    topic: "Communication"
  },
  {
    id: "seru-reading-018",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Medical emergency",
    passage:
      "Halfway through a journey, a passenger says they have chest pain and feel faint. The driver does not continue as if nothing has happened. The driver finds a safe place to stop, asks whether emergency help is needed, and follows urgent instructions where appropriate. The driver also updates the operator when it is safe to do so, because the booking and passenger welfare need to be managed. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What should the driver prioritise first?",
    options: [
      "The passenger's immediate welfare and safe stopping",
      "Completing the fare quickly",
      "Avoiding any operator update",
      "Continuing without asking questions"
    ],
    correctAnswer: "The passenger's immediate welfare and safe stopping",
    explanation:
      "The driver stops safely and checks whether emergency help is needed before focusing on other matters.",
    difficulty: "medium",
    source: "Original SERU reading practice",
    handbookSection: "Staying Safe",
    topic: "Medical emergency"
  },
  {
    id: "seru-reading-019",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Fatigue and safe driving",
    passage:
      "A driver has worked several long shifts and begins missing simple route instructions. The next booking is short, but the driver feels tired and notices slower reactions. Instead of relying on confidence, the driver takes a proper break and only returns to work when alert. The driver understands that fatigue can affect judgement even on familiar roads and even near the end of a shift. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "What can be inferred from the passage?",
    options: [
      "Short journeys can still be unsafe when a driver is tired",
      "Fatigue only matters on long motorway journeys",
      "Familiar roads remove the need for alertness",
      "Confidence is enough to overcome tiredness"
    ],
    correctAnswer: "Short journeys can still be unsafe when a driver is tired",
    explanation:
      "The driver takes a break even though the next booking is short because tiredness affects judgement.",
    difficulty: "medium",
    source: "Original SERU reading practice",
    handbookSection: "Safer Driving",
    topic: "Fatigue"
  },
  {
    id: "seru-reading-020",
    type: "reading_comprehension",
    questionFamily: "seru",
    category: SERU_READING_UNDERSTANDING_CATEGORY,
    categoryId: "seru_reading_understanding",
    title: "Confirming route clearly",
    passage:
      "Before leaving a hotel pickup, the driver confirms the passenger's destination and checks whether they have a preferred route. The passenger says they need to arrive near a side entrance, not the main entrance. The driver updates the route, explains the likely stopping point, and starts the journey only after the details are clear. This helps avoid confusion at the end of the trip. This helps keep the journey professional, traceable, and safe for everyone involved.",
    question: "Why does the driver ask about the preferred route and entrance?",
    options: [
      "To make the journey details clear before starting",
      "To avoid using the operator's booking",
      "To prove the passenger knows London",
      "To delay the passenger unnecessarily"
    ],
    correctAnswer: "To make the journey details clear before starting",
    explanation:
      "The driver confirms details before leaving so the destination and stopping point are clear.",
    difficulty: "easy",
    source: "Original SERU reading practice",
    handbookSection: "Carrying out Private Hire Journeys",
    topic: "Destination confirmation"
  }
];

export function getSeruReadingUnderstandingQuestions() {
  return SERU_READING_UNDERSTANDING_QUESTIONS;
}

export function scoreSeruReadingQuestion(
  question: SeruReadingQuestion,
  selectedAnswer: string | null
) {
  return selectedAnswer === question.correctAnswer;
}

export function validateSeruReadingUnderstandingQuestions(
  questions = SERU_READING_UNDERSTANDING_QUESTIONS
) {
  return questions.every(
    (question) =>
      question.type === "reading_comprehension" &&
      question.categoryId === "seru_reading_understanding" &&
      question.options.length === 4 &&
      question.options.includes(question.correctAnswer) &&
      question.passage.trim().split(/\s+/).length >= 70 &&
      question.passage.trim().split(/\s+/).length <= 130
  );
}
