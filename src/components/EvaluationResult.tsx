'use client';

import { useState } from 'react';

interface EvaluationResultProps {
  result: string;
}

export default function EvaluationResult({ result }: EvaluationResultProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const parseResult = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim());
    const sections: Array<{
      question: string;
      answer: string;
      score: string;
      feedback: string;
    }> = [];

    let currentSection = {
      question: '',
      answer: '',
      score: '',
      feedback: '',
    };

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.toLowerCase().startsWith('question:')) {
        if (currentSection.question) {
          sections.push({ ...currentSection });
          currentSection = {
            question: '',
            answer: '',
            score: '',
            feedback: '',
          };
        }
        currentSection.question = trimmedLine.substring(9).trim();
      } else if (
        trimmedLine.toLowerCase().startsWith("student's answer:") ||
        trimmedLine.toLowerCase().startsWith('student answer:')
      ) {
        const startIndex = trimmedLine.toLowerCase().indexOf('answer:') + 7;
        currentSection.answer = trimmedLine.substring(startIndex).trim();
      } else if (trimmedLine.toLowerCase().startsWith('score:')) {
        currentSection.score = trimmedLine.substring(6).trim();
      } else if (trimmedLine.toLowerCase().startsWith('feedback:')) {
        currentSection.feedback = trimmedLine.substring(9).trim();
      } else if (
        currentSection.feedback &&
        !trimmedLine.toLowerCase().includes('question:')
      ) {
        currentSection.feedback += ` ${trimmedLine}`;
      }
    }

    if (currentSection.question) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = parseResult(result);
  const totalPossibleScore = sections.reduce((sum, section) => {
    const scoreMatch = section.score.match(/\d+\/(\d+)/);
    return sum + (scoreMatch ? parseInt(scoreMatch[1]) : 0);
  }, 0);

  const totalAchievedScore = sections.reduce((sum, section) => {
    const scoreMatch = section.score.match(/(\d+)\/\d+/);
    return sum + (scoreMatch ? parseInt(scoreMatch[1]) : 0);
  }, 0);

  const percentage =
    totalPossibleScore > 0
      ? Math.round((totalAchievedScore / totalPossibleScore) * 100)
      : 0;

  const getScoreColor = (_scoreText: string) => {
    return 'text-white';
  };

  const getPercentageColor = (_percent: number) => {
    return 'text-[#16e16e]';
  };

  return (
    <div className="bg-[#181414] border border-gray-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#181414] p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Evaluation Results
            </h2>
            <div className="flex items-center space-x-6">
              <div className="text-sm text-white">
                Total Score:{' '}
                <span className={`font-bold ${getPercentageColor(percentage)}`}>
                  {totalAchievedScore}/{totalPossibleScore}
                </span>
              </div>
              <div className="text-sm text-white">
                Percentage:{' '}
                <span className={`font-bold ${getPercentageColor(percentage)}`}>
                  {percentage}%
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Questions:{' '}
                <span className="font-bold text-white">{sections.length}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {sections.length > 0 ? (
            <div className="space-y-6">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="bg-[#181414] rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      Question {index + 1}
                    </h3>
                    {section.score && (
                      <span
                        className={`font-bold ${getScoreColor(section.score)}`}
                      >
                        {section.score}
                      </span>
                    )}
                  </div>

                  {section.question && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-400 mb-1">
                        Question:
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {section.question}
                      </p>
                    </div>
                  )}

                  {section.answer && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-400 mb-1">
                        Student's Answer:
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed bg-[#181414] p-3 rounded border border-gray-700">
                        {section.answer}
                      </p>
                    </div>
                  )}

                  {section.feedback && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1">
                        Feedback:
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {section.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Raw Evaluation Result
              </h3>
              <div className="text-left bg-[#181414] p-4 rounded-lg border border-gray-700">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {result}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
