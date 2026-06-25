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
  ["passenger-entrance", "The passenger said ___ waiting by the entrance, but the driver could not see ___ because ___ were standing behind a bus.", ["they're", "their", "there", "where", "were", "them", "they"], ["they're", "them", "they"], "\"They're\" means \"they are\", \"them\" refers to the passengers, and \"they\" is the subject of the final clause."],
  ["meeting-place", "The driver asked ___ the passenger wanted to go, but they ___ not sure because ___ meeting place had changed.", ["where", "were", "we're", "their", "there", "they're", "your"], ["where", "were", "their"], "\"Where\" asks about place, \"were\" is past tense, and \"their\" shows possession."],
  ["vehicle-check", "___ responsible for checking ___ vehicle before the journey, especially when ___ carrying passengers.", ["you're", "your", "its", "it's", "there", "their", "too"], ["you're", "your", "it's"], "\"You're\" means \"you are\", \"your\" shows possession, and \"it's\" means \"it is\"."],
  ["bags-station", "The driver had ___ bags to load, but the passenger said it was not ___ much trouble because the journey was only ___ the station.", ["two", "to", "too", "there", "their", "passed", "past"], ["two", "too", "to"], "\"Two\" is the number, \"too much\" means more than expected or needed, and \"to\" shows direction."],
  ["weather-route", "The road was closed because of the ___, so the driver asked ___ the passenger wanted to wait or take another route ___ the park.", ["weather", "whether", "through", "threw", "there", "their", "were"], ["weather", "whether", "through"], "\"Weather\" means conditions outside, \"whether\" introduces a choice, and \"through\" means going from one side to another."],
  ["quiet-car-park", "The driver did not want to ___ the booking details, so they checked the address before leaving the ___ car park and driving ___ the station.", ["lose", "loose", "quiet", "quite", "to", "too", "two"], ["lose", "quiet", "to"], "\"Lose\" means misplace, \"quiet\" means not noisy, and \"to\" shows direction."],
  ["complaint-record", "The passenger's complaint could ___ the driver's record, but the final ___ would depend on the investigation and the evidence ___.", ["affect", "effect", "there", "their", "provided", "providing", "were"], ["affect", "effect", "provided"], "\"Affect\" is usually a verb, \"effect\" is usually a noun, and \"provided\" refers to evidence already given."],
  ["accept-except", "The operator agreed to ___ the booking, ___ for the journey that had already started, because the driver had ___ the pickup point.", ["accept", "except", "passed", "past", "there", "their", "they're"], ["accept", "except", "passed"], "\"Accept\" means agree to take, \"except\" means not including, and \"passed\" means went beyond."],
  ["useful-advice", "The driver gave ___ advice politely and did not ___ the passenger to leave ___ belongings behind.", ["useful", "useless", "advise", "advice", "their", "there", "they're"], ["useful", "advise", "their"], "\"Useful advice\" means helpful advice, \"advise\" is the verb, and \"their\" shows possession."],
  ["licensed-badge", "The passenger asked ___ the vehicle was licensed, and the driver showed ___ badge because ___ important to be clear.", ["whether", "weather", "their", "there", "its", "it's", "were"], ["whether", "their", "it's"], "\"Whether\" introduces a question, \"their\" shows possession, and \"it's\" means \"it is\"."],
  ["traffic-time", "The driver knew ___ was heavy traffic ahead, so ___ planned a different route to make sure the passenger arrived ___ time.", ["there", "their", "they're", "they", "too", "on", "in"], ["there", "they", "on"], "\"There\" introduces the traffic situation, \"they\" refers to the driver, and \"on time\" means not late."],
  ["hospital-entrance", "The passenger said ___ going to the hospital, but the driver asked ___ entrance they needed because several entrances ___ open.", ["they're", "their", "there", "where", "were", "we're", "which"], ["they're", "which", "were"], "\"They're\" means \"they are\", \"which\" asks for a specific choice, and \"were\" is past tense plural."],
  ["near-pickup", "The driver parked ___ the pickup point, checked ___ mirrors, and waited until the passengers ___ ready.", ["near", "nearly", "their", "there", "were", "where", "we're"], ["near", "their", "were"], "\"Near\" means close to, \"their\" shows possession, and \"were\" is the correct past tense verb."],
  ["fare-receipt", "The customer thought the fare was ___ high, so the driver explained the price ___ and checked that the receipt was printed ___.", ["too", "to", "two", "clearly", "clear", "correct", "correctly"], ["too", "clearly", "correctly"], "\"Too high\" means more than expected, \"clearly\" describes explaining, and \"correctly\" describes how the receipt was printed."],
  ["remain-calm", "The driver should ___ calm, listen to the passenger's concern, and avoid raising ___ voice even when ___ under pressure.", ["remain", "remaining", "their", "there", "they're", "your", "you're"], ["remain", "their", "they're"], "\"Remain calm\" is correct, \"their voice\" shows possession, and \"they're\" means \"they are\"."],
  ["wait-request", "The passenger asked ___ the driver could wait, but the driver said ___ next booking was soon and ___ not possible.", ["whether", "weather", "their", "there", "its", "it's", "were"], ["whether", "their", "it's"], "\"Whether\" introduces the request, \"their\" shows possession, and \"it's\" means \"it is\"."],
  ["two-minutes", "The driver had ___ minutes before the booking, so they checked the route ___ avoid delays and arrived ___ early.", ["two", "to", "too", "there", "their", "quite", "quiet"], ["two", "to", "quite"], "\"Two\" is the number, \"to\" shows purpose, and \"quite early\" means fairly early."],
  ["phone-seat", "The passenger left ___ phone in the vehicle, but the driver found it ___ the back seat and reported it ___ the operator.", ["their", "there", "they're", "on", "in", "to", "too"], ["their", "on", "to"], "\"Their\" shows possession, \"on the back seat\" gives position, and \"to the operator\" shows who received the report."],
  ["red-route", "The driver was not ___ to stop on the red route, so they explained the rule ___ and found a safer place ___ stop.", ["allowed", "aloud", "clearly", "clear", "to", "too", "two"], ["allowed", "clearly", "to"], "\"Allowed\" means permitted, \"clearly\" describes the explanation, and \"to stop\" shows purpose."],
  ["several-entrances", "The passengers ___ already outside, but the driver was unsure ___ they were standing because ___ were several entrances.", ["were", "we're", "where", "there", "their", "they're", "weather"], ["were", "where", "there"], "\"Were\" is past tense, \"where\" asks about place, and \"there were\" introduces the number of entrances."]
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
