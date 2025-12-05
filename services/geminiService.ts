
import { GoogleGenAI, Type } from '@google/genai';
import { Difficulty, Domain, Evaluation, Question, QuestionType } from '../types';

function getApiKey(): string {
  try {
    // Prefer an explicit localStorage entry (key: 'GEMINI_API_KEY') for quick local testing
    const fromLocalStorage =
      typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;

    // Vite exposes client env vars under import.meta.env with the VITE_ prefix.
    // Cast to any to avoid TypeScript complaints in this mixed runtime file.
    // Example .env.local entry for client testing: VITE_GEMINI_API_KEY=your_key_here
    const fromViteEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GEMINI_API_KEY : undefined;

    // Server-side env (Node) may use process.env.GEMINI_API_KEY or process.env.API_KEY
    const fromProcessEnv =
      (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.API_KEY)) ||
      undefined;

    return fromLocalStorage || fromViteEnv || fromProcessEnv || '';
  } catch (err) {
    return (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.API_KEY)) || '';
  }
}

function getAI() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. For client-side testing set VITE_GEMINI_API_KEY in .env.local (and restart) or store it in localStorage under "GEMINI_API_KEY". For production, keep the key on the server and proxy requests — do not expose secrets to the browser.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

export const generateQuestion = async (
  domain: Domain,
  difficulty: Difficulty,
  type: QuestionType
): Promise<Question> => {
  const prompt = `Generate a single unique ${difficulty} interview question for ${domain} of type ${type}.
  Ensure the question is challenging and realistic for top-tier tech interviews.
  For Coding questions, provide a starter code snippet and test cases.
  For System Design, provide clear requirements.
  `;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {type: Type.STRING},
          description: {type: Type.STRING},
          codeStarter: {type: Type.STRING},
          constraints: {type: Type.ARRAY, items: {type: Type.STRING}},
          hints: {type: Type.ARRAY, items: {type: Type.STRING}},
          testCases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                input: {type: Type.STRING},
                expectedOutput: {type: Type.STRING}
              }
            }
          }
        },
        required: ['title', 'description']
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  
  return {
    id: crypto.randomUUID(),
    domain,
    difficulty,
    type,
    title: data.title,
    description: data.description,
    codeStarter: data.codeStarter || (type === QuestionType.CODING ? '// Write your solution here\n' : ''),
    constraints: data.constraints || [],
    hints: data.hints || [],
    testCases: data.testCases || []
  };
};

export const evaluateAttempt = async (
  question: Question,
  userAnswer: string
): Promise<Evaluation> => {
  const prompt = `Evaluate the following answer for the interview question: "${question.title}".
  
  Question Description:
  ${question.description}
  
  User Answer:
  ${userAnswer}
  
  Provide a score out of 100, detailed feedback, list strengths and improvements, and provide the optimal correct solution (code or text).
  `;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: {type: Type.INTEGER},
          feedback: {type: Type.STRING},
          strengths: {type: Type.ARRAY, items: {type: Type.STRING}},
          improvements: {type: Type.ARRAY, items: {type: Type.STRING}},
          correctSolution: {type: Type.STRING},
          complexityAnalysis: {type: Type.STRING}
        },
        required: ['score', 'feedback', 'correctSolution']
      }
    }
  });

  const data = JSON.parse(response.text || '{}');

  return {
    score: data.score,
    feedback: data.feedback,
    strengths: data.strengths || [],
    improvements: data.improvements || [],
    correctSolution: data.correctSolution,
    complexityAnalysis: data.complexityAnalysis
  };
};
