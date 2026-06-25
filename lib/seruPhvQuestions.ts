import type { KnowledgeQuestionData } from "./knowledgeQuestions.ts";

export type PhvHandbookSection = {
  id: string;
  name: string;
  handbookSection: string;
  description: string;
};

type PhvDifficulty = "beginner" | "intermediate" | "advanced";

type PhvSeed = [
  topic: string,
  difficulty: PhvDifficulty,
  prompt: string,
  correctAnswer: string,
  distractors: [string, string, string],
  explanation: string
];

export const PHV_HANDBOOK_SOURCE = "PHV Driver Handbook";

export const phvHandbookSections: PhvHandbookSection[] = [
  {
    id: "seru_phv_driver_licensing",
    name: "London PHV Driver Licensing",
    handbookSection: "Section 1: London PHV Driver Licensing",
    description:
      "Licensing, eligibility, right to work, checks, assessments, reporting duties, and TfL requests."
  },
  {
    id: "seru_phv_vehicle_requirements",
    name: "Licensing Requirements for PHVs",
    handbookSection: "Section 2: Licensing Requirements for PHVs",
    description:
      "Vehicle licensing, discs, insurance, inspections, damage reports, exemptions, and vehicle condition."
  },
  {
    id: "seru_phv_private_hire_journeys",
    name: "Carrying out Private Hire Journeys",
    handbookSection: "Section 3: Carrying out Private Hire Journeys",
    description:
      "Bookings, operator responsibilities, street hails, pickup checks, refusals, and journey conduct."
  },
  {
    id: "seru_phv_staying_safe",
    name: "Staying Safe",
    handbookSection: "Section 4: Staying Safe",
    description:
      "Driver safety, passenger safety, conflict reduction, reporting incidents, route clarity, and impairment risks."
  },
  {
    id: "seru_phv_driver_behaviour",
    name: "Driver Behaviour",
    handbookSection: "Section 5: Driver Behaviour",
    description:
      "Professional conduct, customer care, complaints, unacceptable behaviour, and passenger confidence."
  },
  {
    id: "seru_phv_driving_parking",
    name: "Driving and Parking in London",
    handbookSection: "Section 6: Driving and Parking in London",
    description:
      "Taxi-only spaces, bus lanes, ranks, red routes, waiting restrictions, safe stopping, and obstruction."
  },
  {
    id: "seru_phv_safer_driving",
    name: "Safer Driving",
    handbookSection: "Section 7: Safer Driving",
    description:
      "Speed, manoeuvres, distraction, vulnerable road users, vehicle checks, and weather-aware driving."
  },
  {
    id: "seru_phv_equality_disability",
    name: "Being Aware of Equality and Disability",
    handbookSection: "Section 8: Being Aware of Equality and Disability",
    description:
      "Accessible communication, assistance dogs, wheelchair users, older passengers, and fair treatment."
  },
  {
    id: "seru_phv_safeguarding",
    name: "Safeguarding Children and Adults at Risk",
    handbookSection: "Section 9: Safeguarding Children and Adults at Risk",
    description:
      "Recognising concerns, children, adults at risk, exploitation, abuse, emergency reporting, and operator updates."
  },
  {
    id: "seru_phv_ridesharing",
    name: "Ridesharing",
    handbookSection: "Section 10: Ridesharing",
    description:
      "Shared journeys, separate fares, booking requirements, passenger expectations, privacy, and additional pickups."
  }
] as const;

const phvSeedsBySection: Record<string, PhvSeed[]> = {
  seru_phv_driver_licensing: [
    ["Licensed work", "beginner", "When should a person start working as a London private hire driver?", "Only after the required private hire driver licence is granted", ["As soon as an operator offers work", "After passing only a theory quiz", "Whenever the vehicle is insured"], "A driver should not work until the proper licence is in place."],
    ["Right to work", "beginner", "Why does right-to-work evidence matter for a PHV driver licence?", "It helps confirm the person is allowed to work legally", ["It replaces the driving licence", "It proves route knowledge", "It removes the need for identity checks"], "Licensing checks include whether the applicant can legally work."],
    ["DBS checks", "intermediate", "What is the main purpose of a DBS check in driver licensing?", "To help assess whether the applicant is suitable to work with the public", ["To test vehicle emissions", "To set the fare for journeys", "To choose an operator"], "Background checks support public safety and suitability decisions."],
    ["Medical fitness", "beginner", "Why is medical fitness considered before licensing a private hire driver?", "Because drivers must be fit enough to drive passengers safely", ["Because it decides the vehicle colour", "Because it sets the insurance price", "Because it replaces vehicle inspection"], "Medical fitness is part of safe passenger transport."],
    ["Assessments", "intermediate", "What do topographical and SERU-style requirements help check?", "They help check practical knowledge and communication needed for licensed work", ["They allow street hails", "They replace operator bookings", "They remove the need to follow road signs"], "Assessment requirements support safe and professional private hire work."],
    ["Reporting offences", "advanced", "A licensed driver is charged with a serious offence. What should they do?", "Follow the required reporting process promptly", ["Wait until licence renewal", "Tell passengers instead of TfL", "Ignore it if no journey was affected"], "Drivers have responsibilities to report relevant changes or incidents."],
    ["TfL requests", "intermediate", "How should a driver respond to a reasonable licensing request from TfL?", "Provide accurate information within the requested timescale", ["Delete the message", "Ask a passenger to answer it", "Only respond if the operator insists"], "Responding accurately helps maintain licensing accountability."],
    ["Licence conditions", "beginner", "Why should drivers read their licence conditions carefully?", "They explain duties the driver must follow while licensed", ["They are optional advice only", "They apply only outside London", "They are written for passengers only"], "Licence conditions are part of the driver's working responsibilities."],
    ["Suspension", "advanced", "What should a driver do if their licence is suspended?", "Stop working as a licensed driver unless and until they are allowed to resume", ["Work only at night", "Accept cash jobs only", "Cover the badge and continue"], "A suspended licence means the driver should not carry on licensed work."],
    ["Keeping details current", "intermediate", "Why should a driver keep licensing contact details up to date?", "So important notices and requests can reach them", ["So passengers can call directly", "So the vehicle needs no inspection", "So fares are always higher"], "Missing official notices can create licensing problems for the driver."]
  ],
  seru_phv_vehicle_requirements: [
    ["Vehicle licence", "beginner", "What should a PHV driver check before using a vehicle for private hire work?", "That the vehicle is properly licensed for private hire use", ["That it looks like a taxi", "That it has the largest boot", "That it is parked near a rank"], "The vehicle must be licensed for the work being carried out."],
    ["Licence discs", "beginner", "Why are PHV licence discs important?", "They help show the vehicle is licensed for private hire use", ["They allow bus lane use everywhere", "They replace insurance", "They prove the driver owns the car"], "Licence discs support enforcement and passenger confidence."],
    ["Damaged disc", "intermediate", "If a licence disc is missing or badly damaged, what is the safest response?", "Report it and follow the replacement or instruction process before working if required", ["Ignore it until the next service", "Make a handwritten copy", "Cover the window with a sticker"], "Missing or damaged licensing information should be dealt with properly."],
    ["Insurance", "beginner", "What type of insurance must be in place for private hire journeys?", "Insurance that covers hire or reward private hire work", ["Basic social-only cover", "Home contents insurance", "Passenger travel insurance only"], "The vehicle must have suitable cover for the work being done."],
    ["Collision damage", "intermediate", "Why should collision damage be reported through the proper process?", "Because damage can affect safety and licensing suitability", ["Because it always cancels the booking", "Because passengers must repair it", "Because it replaces an inspection"], "Damage may affect whether a vehicle is safe or compliant."],
    ["Vehicle condition", "beginner", "What should a driver do if the vehicle develops a serious safety fault?", "Stop using it for work until it is made safe", ["Continue if the fare is short", "Ask passengers to ignore it", "Drive faster to finish early"], "A driver should not use an unsafe vehicle for passenger journeys."],
    ["Manufacturer letters", "advanced", "Why might a driver need to read official vehicle or manufacturer letters carefully?", "They may contain safety or compliance instructions affecting the vehicle", ["They are only advertising", "They replace the driving licence", "They allow street hailing"], "Vehicle notices can affect safe and legal operation."],
    ["Inspection", "intermediate", "What is a licensing inspection intended to support?", "It checks whether the vehicle meets required standards", ["It chooses the driver's route", "It sets the passenger tip", "It replaces daily driver checks"], "Inspection helps confirm a vehicle is suitable for licensed use."],
    ["Exemption notices", "advanced", "What should a driver do with an exemption notice that applies to their vehicle?", "Understand when and how the exemption applies", ["Use it for every vehicle", "Show it instead of insurance", "Treat it as permission to ignore all rules"], "Exemptions are specific and should be understood accurately."],
    ["Daily checks", "beginner", "Why are simple vehicle checks useful before starting work?", "They help spot issues with safety, cleanliness, or readiness", ["They guarantee no traffic", "They remove licensing conditions", "They replace customer service"], "Regular checks reduce avoidable problems during journeys."]
  ],
  seru_phv_private_hire_journeys: [
    ["Licensed operator", "beginner", "How should a London private hire journey normally be arranged?", "Through a licensed private hire operator", ["By accepting a street hail", "By waiting on a taxi rank", "By asking people at a bus stop"], "Private hire journeys rely on proper operator booking."],
    ["Street hails", "beginner", "Why must a PHV driver not accept a street hail?", "Private hire work must be pre-booked through the correct process", ["Street hails are quicker", "Street hails are only for airport trips", "Street hails replace insurance"], "PHVs are not taxis and should not take unbooked street hails."],
    ["Taxi-like behaviour", "intermediate", "Which behaviour could make a PHV look as if it is acting like a taxi?", "Waiting for walk-up passengers in a way that invites street hails", ["Confirming a booked passenger's name", "Keeping the vehicle clean", "Following a booked route"], "PHV drivers should avoid taxi-style plying for hire."],
    ["Booking details", "beginner", "What should a driver confirm before collecting a passenger?", "The booking details such as passenger, pickup, and destination information", ["The passenger's favourite music only", "The nearest taxi rank", "The colour of nearby buses"], "Confirming details helps ensure the right passenger and journey."],
    ["Pickup conduct", "intermediate", "What is a professional way to handle a busy pickup point?", "Stop safely, confirm the passenger, and avoid blocking traffic", ["Stop anywhere immediately", "Sound the horn continuously", "Ask strangers to find the passenger"], "Safe, calm pickup conduct protects passengers and other road users."],
    ["Refusing bookings", "advanced", "When should a driver refuse or stop a journey?", "Only for a valid safety, legal, or operator-supported reason", ["Whenever the destination is unfamiliar", "Whenever traffic is heavy", "Whenever the passenger asks a question"], "Refusals should be based on valid reasons, not personal preference."],
    ["Reporting refusal", "intermediate", "If a driver cannot carry out a booking for a valid reason, what should they do?", "Tell the operator through the correct process", ["Hide the booking record", "Tell only the next passenger", "Post the reason publicly"], "Operators need accurate updates when a booking cannot be completed."],
    ["Operator role", "beginner", "Why are operators central to private hire journeys?", "They take and manage bookings for private hire work", ["They replace the driver's licence", "They allow street hails", "They set every traffic signal"], "The operator booking process is a key difference from taxi work."],
    ["Licence checker", "intermediate", "Why might a passenger or operator use a licence checker?", "To help confirm a driver or vehicle is licensed", ["To choose the fastest road", "To avoid booking records", "To calculate fuel use"], "Licence checking supports confidence and compliance."],
    ["Drop-off conduct", "beginner", "What should a driver consider when dropping off a passenger?", "A safe and legal place to stop", ["The nearest taxi rank only", "The driver's favourite shortcut", "Whether the road name is long"], "Drop-offs should balance passenger convenience with safety and legality."]
  ],
  seru_phv_staying_safe: [
    ["Driver safety", "beginner", "Which habit can help a driver stay safer during work?", "Keeping booking and route details clear before setting off", ["Ignoring passenger details", "Leaving doors unlocked in every situation", "Sharing personal plans with strangers"], "Clear information reduces confusion and supports safer working."],
    ["Passenger safety", "beginner", "What should a driver do before moving off?", "Check that passengers are safely inside and the journey is ready to start", ["Start while doors are still open", "Ask passengers to stand", "Ignore seat belt concerns"], "Moving off safely is part of passenger care."],
    ["Conflict reduction", "intermediate", "A passenger becomes annoyed about a delay. What is the safest first response?", "Stay calm, listen, and explain what can be done", ["Shout back immediately", "Refuse to speak at all", "Drive dangerously to save time"], "Calm communication can reduce conflict."],
    ["Aggressive behaviour", "advanced", "If a passenger becomes violent or threatening, what should the driver prioritise?", "Personal safety and emergency help where needed", ["Winning the argument", "Recording for entertainment", "Finishing the fare at any cost"], "Threatening behaviour should be handled with safety as the priority."],
    ["Hate crime", "intermediate", "What should a driver do after witnessing or experiencing a hate crime during work?", "Report it through the appropriate emergency or non-emergency route", ["Ignore it as part of the job", "Retaliate verbally", "Post names online"], "Hate crime should be taken seriously and reported."],
    ["Passenger confirmation", "beginner", "Why should a driver confirm the passenger matches the booking?", "It reduces the risk of collecting the wrong person", ["It allows street hails", "It avoids route planning", "It replaces operator records"], "Confirming the booking protects both passenger and driver."],
    ["Route clarity", "intermediate", "How can route and fare clarity improve safety?", "It reduces confusion and helps passengers understand the journey", ["It guarantees no traffic", "It removes the need to drive safely", "It stops all complaints"], "Clear expectations can prevent avoidable disputes."],
    ["Operator updates", "beginner", "When should a driver update the operator during a problem?", "When the operator needs accurate information to manage the booking safely", ["Only after deleting journey details", "Only if the passenger asks for cash", "Never during any issue"], "Operator updates support safety and accountability."],
    ["Drugs and alcohol", "beginner", "Why must a driver avoid working while impaired by alcohol or drugs?", "Impairment affects judgement, reaction time, and passenger safety", ["It improves confidence", "It makes traffic lighter", "It replaces route knowledge"], "Impaired driving is unsafe and unprofessional."],
    ["CCTV awareness", "advanced", "If CCTV or recording is used in a vehicle, what should the driver remember?", "Use it lawfully and respect privacy requirements", ["Use it to embarrass passengers", "Share clips for entertainment", "Hide all notices"], "Recording systems must be handled responsibly and lawfully."]
  ],
  seru_phv_driver_behaviour: [
    ["Professional service", "beginner", "Which behaviour best shows professional private hire service?", "Being punctual, polite, and respectful", ["Arguing with passengers", "Ignoring reasonable questions", "Making unsafe shortcuts"], "Professional service is built on reliability and respect."],
    ["Customer care", "beginner", "How should a driver respond to a passenger who needs extra time?", "Allow reasonable time and avoid rushing them", ["Drive away immediately", "Charge a penalty without explanation", "Refuse all future bookings"], "Good customer care includes patience where appropriate."],
    ["Complaints", "intermediate", "What is the best response to a complaint during a journey?", "Listen calmly and explain the proper complaint route if needed", ["Argue until the passenger stops", "Delete all booking details", "Insult the passenger"], "Complaints should be handled calmly and professionally."],
    ["TfL response", "advanced", "If TfL asks a driver for information about an incident, what should the driver provide?", "Accurate and honest information", ["A guess designed to protect the driver", "Nothing unless the passenger pays", "Only social media comments"], "Accurate responses support fair investigation and licensing decisions."],
    ["Unacceptable behaviour", "beginner", "Which behaviour is clearly unacceptable for a licensed driver?", "Threatening or intimidating a passenger", ["Confirming a booking", "Opening the boot safely", "Explaining a delay calmly"], "Passengers should feel safe and respected."],
    ["Sexual behaviour", "advanced", "What should a driver remember about sexual comments or behaviour towards passengers?", "They are inappropriate and can be a serious licensing concern", ["They are acceptable if meant as a joke", "They are allowed after midnight", "They replace customer service"], "Sexualised behaviour can make passengers unsafe and is unacceptable."],
    ["Passenger confidence", "beginner", "Which action helps passengers feel safe?", "Using respectful language and keeping the journey professional", ["Making personal remarks", "Driving aggressively", "Refusing to answer basic journey questions"], "Professional communication helps passengers feel comfortable."],
    ["Inappropriate comments", "intermediate", "Why should drivers avoid comments about a passenger's appearance or personal life?", "Such comments can feel intrusive or unsafe", ["They improve the route", "They are required by operators", "They replace booking checks"], "Drivers should keep conversation respectful and appropriate."],
    ["Road users", "beginner", "How should PHV drivers behave towards other road users?", "With patience and regard for safety", ["As if passengers matter only", "By blocking junctions", "By using the horn to punish mistakes"], "Professional behaviour includes sharing the road safely."],
    ["Privacy", "intermediate", "A passenger discusses private information on a call. What should the driver do?", "Respect privacy and avoid repeating what they heard", ["Share the story with friends", "Join the conversation", "Record and post it"], "Passenger privacy is part of professional conduct."]
  ],
  seru_phv_driving_parking: [
    ["PHV not taxi", "beginner", "Which statement is correct about PHVs and taxis?", "PHVs must not use taxi-only privileges unless specifically allowed", ["PHVs can always use taxi ranks", "PHVs are the same as black cabs", "PHVs can always accept street hails"], "PHVs and taxis have different rules and privileges."],
    ["Bus lanes", "intermediate", "What should a PHV driver do before using a bus lane?", "Check signs to see whether PHVs are permitted", ["Use every bus lane", "Follow any bus without checking", "Assume night rules apply all day"], "Bus lane access depends on local signs and restrictions."],
    ["Taxi ranks", "beginner", "What should a PHV driver remember about taxi ranks?", "They are generally for taxis, not private hire vehicles", ["They are free parking for PHVs", "They replace operator bookings", "They are pickup points for street hails"], "Taxi ranks should not be treated as PHV waiting areas."],
    ["Charging points", "intermediate", "Why should a PHV avoid blocking an electric taxi charging point?", "It can prevent authorised vehicles from using the space", ["It improves passenger safety", "It creates a legal taxi rank", "It proves the PHV is licensed"], "Drivers should respect spaces reserved for specific users."],
    ["Safe stopping", "beginner", "What should a driver consider before stopping to pick up or drop off?", "Whether the place is safe and legal", ["Whether it is closest at any cost", "Whether the passenger waves", "Whether the road is busy enough"], "Stopping must not create danger or obstruction."],
    ["Zig-zag lines", "advanced", "Why should drivers be very careful around zig-zag road markings?", "They mark areas where stopping can be restricted for safety", ["They show taxi priority", "They mean free parking", "They show a recommended pickup bay"], "Zig-zag restrictions protect visibility and safety."],
    ["Red routes", "intermediate", "How should a PHV driver treat red route stopping rules?", "Read the signs and stop only where and when allowed", ["Ignore them for booked passengers", "Use them as waiting areas", "Assume they apply only to buses"], "Red routes have specific stopping controls."],
    ["Yellow lines", "intermediate", "What should a driver check before waiting on yellow lines?", "Nearby signs showing waiting restrictions", ["The passenger's mood", "The vehicle colour", "The nearest hotel name"], "Yellow line restrictions depend on signs and times."],
    ["Parking bays", "beginner", "Why should parking bay signs be read carefully?", "They explain who may use the bay and when", ["They show the fastest route", "They prove a booking exists", "They cancel road markings"], "Bay restrictions can vary by time and user type."],
    ["Obstruction", "beginner", "What is wrong with waiting where the vehicle blocks a crossing or junction?", "It can obstruct others and create danger", ["It always saves time legally", "It helps passengers find the car", "It shows the driver is nearby"], "Drivers should avoid obstructing pedestrians, cyclists, and traffic."]
  ],
  seru_phv_safer_driving: [
    ["Speed", "beginner", "What should guide a driver's speed choice?", "The speed limit, road conditions, and safety", ["The passenger's impatience only", "The fastest vehicle nearby", "The fare value"], "Safe speed depends on conditions as well as limits."],
    ["Manoeuvres", "intermediate", "Before turning or changing lane, what should a driver do?", "Check mirrors, signal where needed, and make the manoeuvre safely", ["Move first and check later", "Rely on passengers to watch", "Ignore cyclists"], "Safe manoeuvres require observation and control."],
    ["Distraction", "beginner", "Why is distraction dangerous for PHV drivers?", "It reduces attention and reaction time", ["It improves route memory", "It lowers traffic levels", "It removes the need for mirrors"], "Distraction increases the chance of mistakes."],
    ["Mobile phone", "beginner", "What is the safest way to deal with a work message while driving?", "Wait until safely and legally parked before handling it", ["Read it during a turn", "Ask a passenger to steer", "Hold the phone low"], "Phones should not distract from driving."],
    ["Vulnerable road users", "intermediate", "Which group needs extra care around junctions and crossings?", "Pedestrians, cyclists, motorcyclists, and other vulnerable road users", ["Only drivers of large vans", "Only passengers in the PHV", "Only parked vehicles"], "Vulnerable road users can be harder to see and more easily injured."],
    ["Cyclists", "intermediate", "How should a driver pass a cyclist?", "Leave safe space and avoid sudden close movements", ["Pass as closely as possible", "Sound the horn continuously", "Force the cyclist to stop"], "Safe passing protects cyclists and passengers."],
    ["Pedestrians", "beginner", "What should a driver do near pedestrian crossings?", "Slow, observe carefully, and be ready to stop", ["Speed up to clear the crossing", "Stop on the crossing to wait", "Ignore people waiting"], "Crossings require extra observation and patience."],
    ["Vehicle checks", "beginner", "Which items are sensible to check regularly?", "Lights, tyres, mirrors, and general vehicle condition", ["Seat colour only", "Radio volume only", "Passenger reviews only"], "Basic checks help identify safety problems."],
    ["Weather", "intermediate", "How should heavy rain or poor visibility affect driving?", "Increase caution and allow more time and space", ["Drive faster to finish", "Use no lights", "Follow very closely"], "Bad weather reduces visibility and grip."],
    ["Highway Code", "advanced", "Why should PHV drivers keep Highway Code knowledge current?", "It supports safe and lawful road decisions", ["It removes the need for local signs", "It applies only to learner drivers", "It is only for cyclists"], "Professional drivers should keep road-rule knowledge up to date."]
  ],
  seru_phv_equality_disability: [
    ["Assisting passengers", "beginner", "What is a respectful way to offer help to a disabled passenger?", "Ask what help they would like before assisting", ["Grab their arm without asking", "Refuse because help takes time", "Speak only to their companion"], "Asking first respects independence and dignity."],
    ["Clear speech", "beginner", "How should a driver communicate with a passenger who needs information repeated?", "Speak clearly, patiently, and respectfully", ["Sound annoyed", "Shout from outside the car", "Ignore the request"], "Clear patient communication supports accessibility."],
    ["Extra time", "beginner", "Why might a passenger need extra time getting in or out?", "Mobility, age, luggage, or disability may make the process slower", ["They are always trying to delay", "It means the booking is invalid", "It removes safety duties"], "Drivers should allow reasonable time for passenger needs."],
    ["Direct communication", "intermediate", "If a disabled passenger travels with a companion, who should the driver speak to about the passenger's needs?", "The passenger directly where possible", ["Only the companion", "Only the operator", "No one"], "Speaking directly respects the passenger as the customer."],
    ["Visual impairment", "advanced", "How should a driver guide a visually impaired passenger if help is accepted?", "Offer an arm and describe hazards or steps clearly", ["Push from behind", "Pull quickly by the hand", "Leave them to guess"], "Guiding should be safe, respectful, and agreed."],
    ["Assistance dogs", "beginner", "What should a driver remember about assistance dogs?", "They support disabled passengers and should be treated as part of accessibility duties", ["They are ordinary pets to refuse automatically", "They must travel in the boot", "They cancel the booking"], "Assistance dogs help passengers travel independently."],
    ["Wheelchair users", "intermediate", "What should a driver do when a wheelchair user books a suitable vehicle?", "Give safe, respectful support according to the vehicle and passenger needs", ["Rush the passenger", "Refuse because loading takes time", "Leave equipment loose"], "Wheelchair users should receive fair and safe service."],
    ["Equality duties", "intermediate", "What does equality in PHV service mean?", "Treating passengers fairly and avoiding unlawful discrimination", ["Choosing passengers by preference", "Charging more for protected characteristics", "Serving only easy journeys"], "Equality duties help ensure fair access to transport."],
    ["Refusal consequences", "advanced", "Why can refusing a disabled passenger without a valid reason be serious?", "It may breach equality responsibilities and licensing expectations", ["It is always a private choice", "It improves service ratings", "It has no possible consequence"], "Unfair refusal can harm passengers and create regulatory issues."],
    ["Respectful language", "beginner", "Which language choice is best with older or disabled passengers?", "Respectful, clear language focused on the passenger's travel needs", ["Patronising jokes", "Comments about appearance", "Impatient instructions"], "Respectful language supports dignity and trust."]
  ],
  seru_phv_safeguarding: [
    ["Meaning", "beginner", "What does safeguarding mean in private hire work?", "Taking action to help protect people at risk of harm", ["Choosing the shortest route only", "Checking tyre pressure", "Setting the fare"], "Safeguarding is about recognising and responding to welfare concerns."],
    ["Children", "beginner", "Who is normally considered a child for safeguarding awareness?", "A person under 18", ["Only a person under 10", "Only someone travelling with luggage", "Only someone in school uniform"], "Safeguarding awareness includes young people under 18."],
    ["Adults at risk", "intermediate", "What might make an adult at risk during a journey?", "They may need care or support and be unable to protect themselves from harm", ["They pay by card", "They choose a long route", "They sit in the back"], "Adults at risk may need extra awareness and appropriate support."],
    ["Unaccompanied children", "advanced", "What should a driver consider when collecting an unaccompanied child?", "Whether the booking and handover arrangements are clear and safe", ["Whether the fare is high enough", "Whether the child knows shortcuts", "Whether the vehicle is full"], "Clear arrangements reduce safeguarding risk."],
    ["Meeting adult", "intermediate", "Why might it matter who will meet a child at the destination?", "It helps ensure the child is handed over safely", ["It sets the route speed", "It changes the vehicle licence", "It replaces the booking"], "Safe handover can be important for child welfare."],
    ["Concern signs", "intermediate", "Which situation may need safeguarding awareness?", "A passenger appears controlled, frightened, or unable to speak freely", ["A passenger asks for a receipt", "A passenger carries shopping", "A passenger chooses the radio station"], "Behaviour and context can signal possible harm."],
    ["Exploitation", "advanced", "If a driver suspects exploitation or trafficking, what should they do?", "Report the concern through the appropriate urgent or non-urgent route", ["Ignore it to avoid paperwork", "Confront everyone aggressively", "Share names online"], "Serious safeguarding concerns should be reported safely."],
    ["Emergency 999", "beginner", "When is calling 999 appropriate?", "When there is immediate danger or an emergency", ["For every delayed booking", "For a fare question", "For a routine route change"], "999 is for emergencies requiring immediate help."],
    ["Non-emergency 101", "beginner", "When might 101 be more appropriate than 999?", "When reporting a non-emergency concern to police", ["When danger is immediate", "When someone needs urgent medical help", "When a crime is happening now"], "101 is used for non-emergency police contact."],
    ["Operator report", "intermediate", "Why should safeguarding concerns also be reported to the operator where appropriate?", "The operator may need to record and support the response", ["The operator decides police law", "It replaces emergency help", "It removes driver responsibility"], "Operators can help manage records and follow-up."]
  ],
  seru_phv_ridesharing: [
    ["Meaning", "beginner", "What is ridesharing in private hire context?", "A booked journey where passengers who may not know each other share travel", ["A taxi rank queue", "A driver taking street hails", "A vehicle inspection"], "Ridesharing involves sharing a journey arrangement."],
    ["Separate fares", "intermediate", "What can be different about fares in a rideshare journey?", "Passengers may pay separate fares for their booked places", ["The driver may charge any cash amount", "No booking record is needed", "The fare must be free"], "Ridesharing can involve separate fare arrangements managed by the operator."],
    ["Unknown passengers", "beginner", "What should a driver remember when passengers do not know each other?", "Keep the journey professional and manage expectations clearly", ["Share their personal details", "Encourage arguments", "Ignore all passenger concerns"], "Shared journeys need clear, respectful communication."],
    ["Operator booking", "beginner", "How should a rideshare PHV journey be arranged?", "Through a licensed operator booking process", ["By collecting people who wave", "By waiting at a taxi rank", "By accepting street offers"], "Rideshare journeys still need the correct private hire booking process."],
    ["Personal information", "intermediate", "Why should drivers avoid sharing passenger personal information during rideshare?", "Passengers still have privacy rights and safety expectations", ["It makes the journey faster", "It replaces the route", "It is required for every pickup"], "Privacy matters even when passengers share a vehicle."],
    ["Confirming rideshare", "beginner", "What should a driver do when collecting a rideshare passenger?", "Confirm the booking details and shared-journey arrangement", ["Assume every passenger is together", "Ignore destination details", "Tell passengers to choose the route alone"], "Confirming details avoids confusion in shared journeys."],
    ["Additional pickups", "intermediate", "How should a driver explain an additional pickup during a rideshare?", "Calmly explain it is part of the booked shared journey", ["Pretend it is a mistake", "Refuse to answer questions", "Ask passengers to arrange it themselves"], "Clear explanations help passengers understand the route."],
    ["Route expectations", "intermediate", "Why might a rideshare route not be the most direct route for one passenger?", "It may include booked pickups or drop-offs for other passengers", ["The driver is lost by default", "The operator has no record", "The vehicle cannot use main roads"], "Shared journeys can involve planned stops for different passengers."],
    ["Passenger comfort", "beginner", "What can help rideshare passengers feel comfortable?", "Respectful conduct and clear information about the journey", ["Personal questions about strangers", "Loud arguments", "Ignoring concerns"], "Professional conduct is especially important in shared spaces."],
    ["Managing issues", "advanced", "If passengers in a rideshare become uncomfortable with each other, what should the driver do?", "Stay calm, prioritise safety, and contact the operator or emergency services if needed", ["Take sides loudly", "Lock everyone in until arrival", "Post the incident online"], "Safety and operator support matter when a shared journey becomes difficult."]
  ]
};

function mapDifficulty(value: PhvDifficulty): KnowledgeQuestionData["difficulty"] {
  if (value === "beginner") return "easy";
  if (value === "intermediate") return "medium";
  return "hard";
}

export const phvHandbookQuestions: KnowledgeQuestionData[] =
  phvHandbookSections.flatMap((section) =>
    phvSeedsBySection[section.id].map(
      ([topic, seruDifficulty, prompt, correctAnswer, distractors, explanation], index) => ({
        id: `${section.id.replaceAll("_", "-")}-${String(index + 1).padStart(2, "0")}`,
        type: "knowledge",
        questionFamily: "seru",
        practiceArea: "seru-phv-handbook",
        questionSubtype: "multiple_choice",
        prompt,
        options: [correctAnswer, ...distractors],
        correctAnswer,
        difficulty: mapDifficulty(seruDifficulty),
        seruDifficulty,
        category: section.name,
        sectionId: section.id,
        sectionName: section.name,
        source: PHV_HANDBOOK_SOURCE,
        sourceNote: `${PHV_HANDBOOK_SOURCE} - original TopoPass practice question`,
        handbookSection: section.handbookSection,
        topic,
        isActive: true,
        explanation,
        tip: `Review ${section.name} in the latest PHV Driver Handbook guidance.`
      })
    )
  );
