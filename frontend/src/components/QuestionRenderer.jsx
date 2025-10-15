import React from 'react';

/**
 * Generic renderer for quiz questions by type.
 * Props:
 *  - question: { question, type, options?, correctAnswer? }
 *  - value: current answer value (string)
 *  - onChange: (newVal: string) => void
 *  - disabled?: boolean
 */
const QuestionRenderer = ({ question, value, onChange, disabled = false }) => {
  const type = question.type || 'multiple-choice';

  if (type === 'true-false') {
    const opts = ['True', 'False']; // enforce exactly 2 choices
    return (
      <div className="space-y-3">
        {opts.map((opt, idx) => (
          <label key={idx} className={`block p-3 border rounded-lg cursor-pointer ${value===opt ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input
              type="radio"
              name="answer"
              className="mr-3"
              checked={value===opt}
              onChange={() => onChange(opt)}
              disabled={disabled}
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (type === 'fill-blank' || type === 'identification') {
    return (
      <div>
        <input
          type="text"
          className="w-full p-3 border rounded-lg"
          placeholder="Type your answer..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    );
  }

  // default: multiple-choice
  const opts = Array.isArray(question.options) ? question.options : [];
  return (
    <div className="space-y-3">
      {opts.map((opt, idx) => (
        <label key={idx} className={`block p-3 border rounded-lg cursor-pointer ${value===opt ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
          <input
            type="radio"
            name="answer"
            className="mr-3"
            checked={value===opt}
            onChange={() => onChange(opt)}
            disabled={disabled}
          />
          {opt}
        </label>
      ))}
    </div>
  );
};

export default QuestionRenderer;