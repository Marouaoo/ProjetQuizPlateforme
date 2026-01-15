import { validate } from 'class-validator';
import { UpdatePasswordDto } from './update-password.dto';

describe('UpdatePasswordDto', () => {
    it('should validate a valid DTO', async () => {
        const dto = new UpdatePasswordDto();
        dto.password = 'validpassword';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail validation with a password that exceeds max length', async () => {
        const dto = new UpdatePasswordDto();
        dto.password = 'toolongpassword12345612341234231423';

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
    });
});
