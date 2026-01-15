import { ChartData } from 'chart.js';
import { Question } from './question';

export interface Histograms {
    grades: number[][];
    histograms: ChartData[];
    choices: string[][];
    questions: Question[];
}
