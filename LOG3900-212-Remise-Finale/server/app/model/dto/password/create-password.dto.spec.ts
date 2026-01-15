import { validate } from 'class-validator';
import { CreatePasswordDto } from './create-password.dto';

describe('CreatePasswordDto', () => {
    it('should validate a valid DTO', async () => {
        const dto = new CreatePasswordDto();
        dto.password = 'valid';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail validation with a password that exceeds max length', async () => {
        const dto = new CreatePasswordDto();
        dto.password = 'toolongpassword123456123456';

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
    });
});
