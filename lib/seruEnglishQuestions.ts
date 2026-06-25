export type SentenceCompletionQuestion = {
  id: string;
  type: "sentence_completion";
  category: "SERU English - Complete the Sentence";
  difficulty: "easy" | "medium" | "hard";
  sentence: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type MultiSentenceCompletionQuestion = {
  id: string;
  type: "multi_sentence_completion";
  category: "SERU English - Advanced Sentence Completion";
  difficulty: "hard";
  sentence: string;
  options: string[];
  correctAnswers: [string, string, string];
  explanation: string;
};

type SingleSentenceSeed = [
  id: string,
  sentence: string,
  options: string[],
  correctAnswer: string,
  explanation: string
];

type AdvancedSentenceSeed = [
  id: string,
  sentence: string,
  options: string[],
  correctAnswers: [string, string, string],
  explanation: string
];

const singleSentenceSeeds: SingleSentenceSeed[] = [
  ["polite-manner", "A licensed driver should always speak to passengers in a ___ manner.", ["polite", "quickly", "heavy", "delayed"], "polite", "\"Polite\" means respectful and well-mannered, which fits the sentence."],
  ["journey-completed", "The passenger asked for a receipt after the journey was ___.", ["completed", "spoken", "carried", "opened"], "completed", "A journey is completed when it has finished."],
  ["phone-driving", "Drivers must not use a mobile phone while they are ___.", ["driving", "sleeping", "reading", "parking"], "driving", "The sentence refers to using a phone during a journey, so \"driving\" is correct."],
  ["listened-carefully", "The customer was unhappy, so the driver listened ___.", ["carefully", "loudly", "late", "empty"], "carefully", "\"Listened carefully\" means paying attention to what the customer is saying."],
  ["into-vehicle", "A wheelchair user may need extra time to get ___ the vehicle.", ["into", "above", "under", "beside"], "into", "A person gets into a vehicle."],
  ["journey-began", "The driver checked the route before the journey ___.", ["began", "broken", "beginning", "begin"], "began", "\"Began\" is the correct past tense form."],
  ["lost-item", "If a passenger leaves a bag behind, the driver should report the ___ item.", ["lost", "loose", "late", "low"], "lost", "A forgotten item is usually called a lost item."],
  ["before-collecting", "The driver arrived early but waited until the booking time ___ collecting the passenger.", ["before", "under", "across", "during"], "before", "\"Before collecting the passenger\" correctly describes waiting first."],
  ["licensed-operator", "A private hire journey must be booked through a licensed ___.", ["operator", "engine", "passenger", "pavement"], "operator", "Private hire bookings are made through a licensed operator."],
  ["clean-tidy", "The driver kept the vehicle clean and ___.", ["tidy", "hungry", "narrow", "broken"], "tidy", "\"Clean and tidy\" is a common phrase meaning neat and well kept."],
  ["clear-instructions", "The passenger gave the driver clear ___ about the destination.", ["instructions", "accidents", "windows", "tickets"], "instructions", "Instructions are directions or information about what to do."],
  ["requests-otherwise", "The driver should take a suitable route unless the passenger ___ otherwise.", ["requests", "carries", "repairs", "forgets"], "requests", "\"Requests otherwise\" means asks for something different."],
  ["difficult-situation", "It is important to remain calm when dealing with a difficult ___.", ["situation", "mirror", "receipt", "licence"], "situation", "A difficult situation is a problem or challenging event."],
  ["quiet-journey", "The driver lowered the radio because the passenger wanted a ___ journey.", ["quiet", "sharp", "crowded", "missing"], "quiet", "A quiet journey has little noise."],
  ["explained-clearly", "The driver apologised for the delay and explained the reason ___.", ["clearly", "dirty", "heavy", "silent"], "clearly", "\"Clearly\" means in a way that is easy to understand."],
  ["appropriate-assistance", "The passenger was elderly, so the driver offered ___ assistance.", ["appropriate", "dangerous", "careless", "expensive"], "appropriate", "Appropriate assistance means suitable help for the passenger's needs."],
  ["seatbelts-required", "A driver must check that passengers wear seat belts where this is ___.", ["required", "reduced", "refused", "repeated"], "required", "\"Required\" means something must be done."],
  ["pickup-location", "The booking details showed the passenger's pickup ___.", ["location", "complaint", "weather", "payment"], "location", "Pickup location means the place where the passenger should be collected."],
  ["remain-professional", "The driver should avoid arguments and remain ___.", ["professional", "careless", "impatient", "noisy"], "professional", "A professional driver behaves calmly and respectfully."],
  ["charged-correctly", "After the trip, the driver made sure the fare was charged ___.", ["correctly", "loudly", "nearby", "slowly"], "correctly", "\"Correctly\" means accurately or without mistake."]
];

export const sentenceCompletionQuestions: SentenceCompletionQuestion[] =
  singleSentenceSeeds.map(([id, sentence, options, correctAnswer, explanation]) => ({
  id: `seru-english-single-${id}`,
  type: "sentence_completion",
  category: "SERU English - Complete the Sentence",
  difficulty: "easy",
  sentence,
  options,
  correctAnswer,
  explanation
}));

const advancedSentenceSeeds: AdvancedSentenceSeed[] = [
  ["licensing-request", "A licensed driver ___ respond ___ a reasonable TfL request ___ the deadline given.", ["must", "may", "to", "from", "before", "after", "unless"], ["must", "to", "before"], "\"Must\" shows obligation, \"respond to\" is the correct phrase, and \"before the deadline\" shows timing."],
  ["passenger-assistance", "The driver ___ offer appropriate help ___ the passenger asks, but they ___ not touch mobility equipment without permission.", ["should", "must", "when", "while", "cannot", "can", "between"], ["should", "when", "cannot"], "\"Should\" gives professional advice, \"when\" introduces the situation, and \"cannot\" fits the restriction."],
  ["operator-update", "The destination ___ changed during the journey, ___ the operator was updated ___ the record stayed accurate.", ["was", "were", "therefore", "however", "so", "because", "while"], ["was", "so", "because"], "\"Was\" agrees with destination, \"so\" links the action, and \"because\" explains the reason."],
  ["safe-stopping", "A driver ___ stop ___ a red route ___ signs show that stopping is allowed.", ["may", "must", "on", "in", "unless", "before", "through"], ["may", "on", "unless"], "\"May\" shows permission, \"on a red route\" is the right phrase, and \"unless\" introduces the condition."],
  ["complaint-response", "The passenger ___ unhappy about the fare, ___ the driver stayed calm and gave an ___ explanation.", ["was", "were", "however", "therefore", "accurate", "serious", "between"], ["was", "however", "accurate"], "\"Was\" agrees with passenger, \"however\" contrasts the response, and \"accurate\" describes the explanation."],
  ["safeguarding-report", "The driver ___ report a serious concern ___ the proper channel ___ making personal accusations.", ["should", "can", "through", "between", "without", "because", "after"], ["should", "through", "without"], "\"Should\" fits responsible action, \"through the proper channel\" is correct, and \"without\" avoids unsupported accusations."],
  ["accessibility-time", "The passenger ___ extra time ___ getting into the vehicle, ___ the driver waited patiently.", ["needed", "needs", "for", "from", "therefore", "however", "unless"], ["needed", "for", "therefore"], "\"Needed\" matches the past situation, \"for getting into\" is correct, and \"therefore\" shows the result."],
  ["route-discussion", "The driver ___ explain the route ___ a clear way ___ the passenger is unsure.", ["can", "cannot", "in", "at", "if", "unless", "between"], ["can", "in", "if"], "\"Can\" shows ability, \"in a clear way\" is correct, and \"if\" introduces the passenger's uncertainty."],
  ["lost-property", "A phone ___ found ___ the back seat, and it ___ be reported to the operator.", ["was", "were", "on", "to", "in", "must", "should"], ["was", "on", "should"], "\"Was found\" matches one phone, \"on the back seat\" gives position, and \"should be reported\" fits the professional action."],
  ["medical-emergency", "The passenger ___ unwell, so the driver stopped ___ a safe place ___ calling for help.", ["felt", "feel", "at", "between", "before", "unless", "from"], ["felt", "at", "before"], "\"Felt\" is past tense, \"at a safe place\" fits the sentence, and \"before calling\" shows sequence."],
  ["booking-checks", "Before the journey starts, the driver ___ check the name, destination, and any ___ booking notes ___ the operator.", ["should", "may", "relevant", "reasonable", "from", "through", "while"], ["should", "relevant", "from"], "\"Should check\" is professional advice, \"relevant booking notes\" fits the meaning, and notes come \"from\" the operator."],
  ["professional-language", "A driver ___ use respectful language ___ speaking with passengers, especially ___ a disagreement occurs.", ["must", "may", "while", "between", "when", "because", "through"], ["must", "while", "when"], "\"Must\" shows a strong duty, \"while speaking\" is correct, and \"when\" introduces the situation."],
  ["fatigue-break", "The driver ___ tired after a long shift, ___ they took a break ___ accepting another booking.", ["was", "were", "therefore", "however", "before", "after", "in"], ["was", "therefore", "before"], "\"Was\" agrees with driver, \"therefore\" shows the result, and the break happens \"before\" another booking."],
  ["rideshare-privacy", "In a shared journey, passengers ___ not know each other, so personal details ___ be kept private ___ the trip.", ["may", "must", "should", "can", "during", "between", "from"], ["may", "should", "during"], "\"May\" shows possibility, \"should\" gives expected conduct, and \"during the trip\" gives the time."],
  ["vehicle-condition", "If a safety fault ___ found, the vehicle ___ not be suitable ___ private hire work.", ["is", "are", "may", "must", "for", "through", "at"], ["is", "may", "for"], "\"Is found\" agrees with one fault, \"may not be suitable\" shows risk, and \"for private hire work\" is correct."],
  ["equality-service", "Passengers ___ receive fair service ___ their disability, age, or background, ___ the journey is difficult.", ["should", "may", "regardless of", "because of", "even when", "unless", "through"], ["should", "regardless of", "even when"], "\"Should\" gives the expectation, \"regardless of\" means not affected by, and \"even when\" adds a difficult condition."],
  ["collision-record", "After a collision, the driver ___ record accurate details and report damage ___ the required process ___ continuing work.", ["must", "can", "through", "between", "before", "while", "from"], ["must", "through", "before"], "\"Must\" shows obligation, \"through the required process\" is correct, and reporting comes \"before\" continuing work."],
  ["fare-explanation", "The fare ___ higher than expected, ___ the driver explained the reason ___ and calmly.", ["was", "were", "so", "because", "clearly", "clear", "through"], ["was", "so", "clearly"], "\"Was\" agrees with fare, \"so\" links the passenger concern to the response, and \"clearly\" describes the explanation."],
  ["pickup-sequence", "The driver checked the booking ___ arriving, confirmed the passenger ___ pickup, and started the journey ___ both details matched.", ["before", "after", "at", "on", "when", "unless", "through"], ["before", "at", "when"], "\"Before arriving\" shows sequence, \"at pickup\" gives place, and \"when\" introduces the condition."],
  ["suitable-route", "A suitable route ___ take account of traffic, safety, and the passenger's needs; ___, it ___ still follow road rules.", ["should", "must", "however", "because", "therefore", "can", "between"], ["should", "however", "must"], "\"Should\" introduces the route choice, \"however\" contrasts it with rules, and \"must\" shows road rules are required."]
];

export const advancedSentenceCompletionQuestions: MultiSentenceCompletionQuestion[] =
  advancedSentenceSeeds.map(([id, sentence, options, correctAnswers, explanation]) => ({
  id: `seru-english-advanced-${id}`,
  type: "multi_sentence_completion",
  category: "SERU English - Advanced Sentence Completion",
  difficulty: "hard",
  sentence,
  options,
  correctAnswers,
  explanation
}));

export function scoreSentenceCompletion(
  question: SentenceCompletionQuestion,
  selectedAnswer: string | null
) {
  return selectedAnswer === question.correctAnswer;
}

export function scoreMultiSentenceCompletion(
  question: MultiSentenceCompletionQuestion,
  answers: Array<string | null>
) {
  const blankResults = question.correctAnswers.map(
    (answer, index) => answers[index] === answer
  );

  return {
    blankResults,
    correct: blankResults.every(Boolean)
  };
}

export function placeWordInBlank(
  answers: Array<string | null>,
  blankIndex: number,
  word: string
) {
  return answers.map((answer, index) => {
    if (index === blankIndex) return word;
    return answer === word ? null : answer;
  });
}

export function clearBlank(answers: Array<string | null>, blankIndex: number) {
  return answers.map((answer, index) => (index === blankIndex ? null : answer));
}

export function clearAllBlanks(blankCount: number) {
  return Array.from({ length: blankCount }, () => null as string | null);
}
