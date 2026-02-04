import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the primary risk of using high leverage (20x+) in futures trading?",
    options: [
      "Higher transaction fees",
      "Liquidation can occur with small price movements",
      "Slower order execution",
      "Limited profit potential"
    ],
    correctAnswer: 1,
    explanation: "High leverage amplifies both gains AND losses. A 5% move against you at 20x leverage means a 100% loss (liquidation)."
  },
  {
    id: 2,
    question: "What does 'funding rate' indicate in perpetual futures?",
    options: [
      "The exchange's transaction fee",
      "The interest rate for margin loans",
      "Periodic payments between longs and shorts based on market sentiment",
      "The minimum capital required to trade"
    ],
    correctAnswer: 2,
    explanation: "Funding rate is a mechanism to keep perpetual futures prices anchored to spot. Positive rate = longs pay shorts (market is bullish). Negative = shorts pay longs."
  },
  {
    id: 3,
    question: "If you enter a LONG position at $50,000 with 10x leverage and a 5% stop-loss, at what price will you be stopped out?",
    options: [
      "$49,500",
      "$47,500",
      "$49,000",
      "$45,000"
    ],
    correctAnswer: 1,
    explanation: "With 10x leverage, a 5% stop-loss means you're risking 50% of your margin. Stop-loss = $50,000 - ($50,000 × 0.05) = $47,500."
  },
  {
    id: 4,
    question: "What is 'inverse learning' in the context of AI trading signals?",
    options: [
      "Using AI to predict market crashes",
      "Learning from losing trades and inverting the signal for similar conditions",
      "Trading against the AI's recommendations",
      "Using historical data in reverse chronological order"
    ],
    correctAnswer: 1,
    explanation: "Inverse learning analyzes your losing trades, identifies the entry conditions, and inverts the signal. If a LONG lost under certain conditions, the AI will suggest SHORT next time."
  },
  {
    id: 5,
    question: "What is the maximum recommended position size as a percentage of your total capital for high-risk futures trades?",
    options: [
      "50-70%",
      "20-30%",
      "5-10%",
      "1-3%"
    ],
    correctAnswer: 3,
    explanation: "Professional traders risk 1-3% per trade to survive losing streaks. Even with a 60% win rate, risking 10%+ per trade can wipe out your account quickly."
  }
];

interface TradingQuizProps {
  onPass: () => void;
  onClose: () => void;
}

export default function TradingQuiz({ onPass, onClose }: TradingQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      const correctCount = QUIZ_QUESTIONS.reduce((count, q, index) => {
        return count + (selectedAnswers[index] === q.correctAnswer ? 1 : 0);
      }, 0);
      setScore(correctCount);
      setShowResults(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setScore(0);
  };

  const passThreshold = 4; // Need 4/5 correct to pass
  const passed = score >= passThreshold;

  if (showResults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                Quiz Passed!
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-600" />
                Quiz Failed
              </>
            )}
          </CardTitle>
          <CardDescription>
            You scored {score} out of {QUIZ_QUESTIONS.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passed ? (
            <>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-100">
                  You've demonstrated sufficient understanding of high-risk futures trading. You can now access
                  "Very High Risk" signals with leverage up to 50x.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={onPass} className="flex-1">
                  Unlock High-Risk Mode
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-900 dark:text-red-100 mb-2">
                  You need at least {passThreshold} correct answers to unlock high-risk trading. Review the explanations below:
                </p>
              </div>
              <div className="space-y-4">
                {QUIZ_QUESTIONS.map((q, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === q.correctAnswer;
                  return (
                    <div key={q.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{q.question}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your answer: {q.options[userAnswer]}
                          </p>
                          {!isCorrect && (
                            <p className="text-xs text-green-600 mt-1">
                              Correct answer: {q.options[q.correctAnswer]}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1">
                  Retry Quiz
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">
            Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
          </Badge>
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
        </div>
        <CardTitle>High-Risk Trading Knowledge Check</CardTitle>
        <CardDescription>
          You must pass this quiz to unlock "Very High Risk" signals with leverage above 20x.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-lg font-medium mb-4">{question.question}</p>
          <RadioGroup value={selectedAnswer?.toString()} onValueChange={(v) => handleAnswerSelect(parseInt(v))}>
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleNext}
            disabled={selectedAnswer === undefined}
            className="flex-1"
          >
            {currentQuestion < QUIZ_QUESTIONS.length - 1 ? "Next Question" : "Submit Quiz"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
