export interface Player {
    id: string;
    name: string;
    points: number;
    isInPlay: boolean;
    numberOfBonuses: number;
    isOrganiser: boolean;
    isChatActive: boolean;
    isAnswerConfirmed: boolean;
    isAnswerModified: boolean;
    isAnswerSelected: boolean;
    timeWithoutModification: number;
    intervalId?;
    answers: string[];
    qrlWrittenAnswer?: string;
    qrlGrade?: number;
}
