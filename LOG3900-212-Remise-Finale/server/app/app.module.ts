import { DateService } from '@app/services/date/date.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';
import { GameCreationGateway } from './gateways/game-creation/game-creation.gateway';
import { GameManagerGateway } from './gateways/game-manager/game-manager.gateway';
import { Quiz, quizSchema } from './model/database/quiz';
import { QuizService } from './services/quiz/quiz.service';
import { GameCreationService } from './services/game-creation/game-creation.service';
import { GameManagerService } from './services/game-manager/game-manager.service';
import { TimeService } from './services/time/time.service';
import { ChatChannelGateway } from './gateways/chatroom/chatroom';
import { ChatChannelService } from './services/chatroom/chatroom.service';
import { SessionService } from './services/session/session.service';
import { SessionController } from './controllers/session/session.controller';
import { User, userSchema } from './model/database/session.schema';
import { SessionGateway } from './gateways/session/session.gateway';
import { AuthController } from './controllers/password-reset/password';
import { AuthService } from './services/password-reset/password.service';
import { QuizController } from './controllers/quiz/quiz.controller';
import { QuestionController } from './controllers/quiz/question.controller';
import { QuestionService } from './services/quiz/question.service';
import { QuestionBase, QuestionQCM, QuestionQRE, QuestionQRL } from './model/database/question';
import { CountdownService } from './services/countdown/countdown.service';
import { FriendGateway } from './gateways/friends/friends.gateway';
import { FriendService } from './services/friends/friends';
import { ChannelMessage, ChannelMessageSchema } from './model/database/message.schema';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            connectionName: 'Games',
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_1'),
            }),
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            connectionName: 'Users',
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_2'),
            }),
        }),
        MongooseModule.forFeature([{ name: User.name, schema: userSchema }], 'Users'),
        MongooseModule.forFeature([{ name: Quiz.name, schema: quizSchema }], 'Games'),
        MongooseModule.forFeature([{ name: ChannelMessage.name, schema: ChannelMessageSchema }], 'Games'),
        MongooseModule.forFeatureAsync(
            [
                {
                    name: 'Question',
                    useFactory: () => {
                        const baseSchema = SchemaFactory.createForClass(QuestionBase);
                        baseSchema.set('discriminatorKey', 'type');
                        baseSchema.set('versionKey', false);
                        baseSchema.discriminator('QCM', SchemaFactory.createForClass(QuestionQCM));
                        baseSchema.discriminator('QRE', SchemaFactory.createForClass(QuestionQRE));
                        baseSchema.discriminator('QRL', SchemaFactory.createForClass(QuestionQRL));

                        return baseSchema;
                    },
                },
            ],
            'Games',
        ),
    ],
    controllers: [SessionController, AuthController, QuizController, QuestionController],
    providers: [
        DateService,
        GameCreationService,
        QuizService,
        QuestionService,
        Logger,
        GameManagerService,
        TimeService,
        GameManagerGateway,
        GameCreationGateway,
        ChatChannelGateway,
        ChatChannelService,
        SessionService,
        SessionGateway,
        AuthService,
        CountdownService,
        FriendGateway,
        FriendService,
    ],
})
export class AppModule {}
