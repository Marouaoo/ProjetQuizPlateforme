export interface Player {
    name: string;
    points: number;
    isInPlay: boolean;
    numberOfBonuses: number;
    qrlWrittenAnswer?: string;
    qrlGrade?: number;
    isChatActive: boolean;
    isAnswerConfirmed: boolean;
    isAnswerSelected: boolean;
}
