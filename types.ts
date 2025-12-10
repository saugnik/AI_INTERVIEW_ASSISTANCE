/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum AppView {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  GENERATE = 'generate',
  ATTEMPT = 'attempt',
  RESULT = 'result',
  HISTORY = 'history',
  PROFILE = 'profile',
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
  testCases?: {input: string; expectedOutput: string}[];
  hints?: string[];
  constraints?: string[];
}

export interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  correctSolution: string;
  complexityAnalysis?: string;
}

export interface Attempt {
  id: string;
  date: string; // ISO string
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
  domainPerformance: Record<string, number>; // Domain -> Avg Score
}
