type QuestionFeedbackProps = {
  status: "correct" | "incorrect" | "neutral";
  message: string;
};

const statusStyles = {
  correct: "border-green-200 bg-green-50 text-success",
  incorrect: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-blue-200 bg-blue-50 text-road"
};

export function QuestionFeedback({ status, message }: QuestionFeedbackProps) {
  return (
    <div
      className={`mt-4 rounded-md border px-4 py-3 text-sm font-medium ${statusStyles[status]}`}
    >
      {message}
    </div>
  );
}
