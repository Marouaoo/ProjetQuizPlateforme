import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { randomInt } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    private verificationCodes: Record<string, { code: number; expiresAt: number }> = {};

    constructor(private readonly configService: ConfigService) {
        this.configService = configService;
    }

    async sendVerificationCode(email: string) {
        const code = randomInt(100000, 999999);
        const expiresAt = Date.now() + 10 * 60 * 1000;
        this.verificationCodes[email] = { code, expiresAt };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASSWORD'),
            },
        });

        await transporter.sendMail({
            from: this.configService.get<string>('EMAIL_USER'),
            to: email,
            subject: 'Votre code de validation',
            text: `Votre code de validation est : ${code}. Il est valide pour 10 minutes.`,
        });
        return { message: 'Code envoyé avec succès' };
    }

    verifyCode(email: string, code: number): boolean {
        const storedCode = this.verificationCodes[email];
        if (!storedCode || storedCode.expiresAt < Date.now()) {
            return false;
        }
        if (storedCode.code !== code) {
            return false;
        }
        delete this.verificationCodes[email];
        return true;
    }
}
