export enum AppView {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  GENERATE = 'generate',
  ATTEMPT = 'attempt',
  RESULT = 'result',
  HISTORY = 'history',
  PROFILE = 'profile',
  PROGRESS = 'progress',
  LEADERBOARD = 'leaderboard',
  AI_QUESTIONS = 'ai_questions',
}
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}
export enum QuestionType {
  CODING = 'Coding',
  THEORY = 'Theory',
  SYSTEM_DESIGN = 'System Design',
}
export enum Domain {
  DSA = 'Data Structures & Algorithms',
  FRONTEND = 'Frontend Development',
  BACKEND = 'Backend Development',
  SYSTEM_DESIGN = 'System Design',
  DATABASE = 'Database Management',
  DEVOPS = 'DevOps',
}
export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  domain: Domain;
  type: QuestionType;
  codeStarter?: string;
  testCases?: { input: string; expectedOutput: string }[];
  hints?: string[];
  constraints?: string[];
}
export interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  correctSolution?: string;
  referenceSolution?: string;
  complexityAnalysis?: string;
  testResults?: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
  passedTests?: number;
  totalTests?: number;
}
export interface Attempt {
  id: string;
  date: string;
  question: Question;
  userAnswer: string;
  evaluation?: Evaluation;
  timeSpentSeconds: number;
}
export interface UserStats {
  totalAttempts: number;
  averageScore: number;
  questionsSolved: number;
  streakDays: number;
  domainPerformance: Record<string, number>;
}