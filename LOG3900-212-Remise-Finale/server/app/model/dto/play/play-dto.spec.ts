import { validate } from 'class-validator';
import { PlayHistoryDto } from './play-dto';

describe('PlayHistoryDto', () => {
    it('should validate a valid DTO', async () => {
        const dto = new PlayHistoryDto();
        dto.accessCode = '1234';
        dto.game = 'Test Game';
        dto.playersList = [];
        dto.startTime = new Date();

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid data', async () => {
        const dto = new PlayHistoryDto();
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
