import { validate } from 'class-validator';
import { CreateGameDto } from './create-game.dto';

describe('CreateGameDto', () => {
    it('should validate a valid DTO', async () => {
        const dto = new CreateGameDto();
        dto._id = '12345';
        dto.title = 'Sample Game';
        dto.description = 'This is a sample game';
        dto.duration = 60;
        dto.lastModification = new Date();
        dto.isVisible = true;
        dto.questions = [
            {
                type: 'multiple-choice',
                text: 'What is 2 + 2?',
                points: 10,
                choices: [
                    {
                        text: 'Quebec',
                        isCorrect: true,
                    },
                ],
            },
        ];
        dto.fileName = 'testfile';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid data', async () => {
        const dto = new CreateGameDto();
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
