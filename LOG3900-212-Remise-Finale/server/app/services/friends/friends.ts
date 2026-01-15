import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@app/model/database/session.schema';
import { SessionService } from '../session/session.service';

@Injectable()
export class FriendService {
    @InjectModel(User.name, 'Users') private readonly userModel: Model<UserDocument>;

    constructor(private readonly sessionService: SessionService) {
        this.sessionService = sessionService;
    }

    async sendFriendRequest(senderId: string, receiverId: string): Promise<string> {
        const sender = await this.userModel.findById(senderId);
        const receiver = await this.userModel.findById(receiverId);

        if (!sender || !receiver) {
            throw new NotFoundException('Utilisateur introuvable.');
        }

        if (sender.friends.includes(receiverId) || receiver.friends.includes(senderId)) {
            throw new BadRequestException('Vous êtes déjà amis.');
        }

        if (receiver.friendRequestsReceived.includes(senderId)) {
            throw new BadRequestException('Demande déjà envoyée.');
        }

        sender.friendRequestsSent.push(receiverId);
        receiver.friendRequestsReceived.push(senderId);

        await sender.save();
        await receiver.save();

        return this.sessionService.getSocketIdByUserId(receiver._id.toString());
    }

    async cancelFriendRequest(senderId: string, receiverId: string): Promise<string> {
        const sender = await this.userModel.findById(senderId);
        const receiver = await this.userModel.findById(receiverId);

        if (!sender || !receiver) {
            throw new NotFoundException('Utilisateur introuvable.');
        }

        sender.friendRequestsSent = sender.friendRequestsSent.filter((id) => id !== receiverId);
        receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter((id) => id !== senderId);

        await sender.save();
        await receiver.save();

        return this.sessionService.getSocketIdByUserId(receiver._id.toString());
    }

    async acceptFriendRequest(userId: string, requesterId: string): Promise<string> {
        const user = await this.userModel.findById(userId);
        const requester = await this.userModel.findById(requesterId);

        if (!user || !requester) {
            throw new NotFoundException('Utilisateur introuvable.');
        }

        if (!user.friendRequestsReceived.includes(requesterId)) {
            throw new BadRequestException("Aucune demande d'ami trouvée.");
        }

        user.friends.push(requesterId);
        requester.friends.push(userId);

        user.friendRequestsReceived = user.friendRequestsReceived.filter((id) => id !== requesterId);
        requester.friendRequestsSent = requester.friendRequestsSent.filter((id) => id !== userId);

        await user.save();
        await requester.save();

        return this.sessionService.getSocketIdByUserId(requester._id.toString());
    }

    async rejectFriendRequest(userId: string, requesterId: string): Promise<string> {
        const user = await this.userModel.findById(userId);
        const requester = await this.userModel.findById(requesterId);

        if (!user || !requester) {
            throw new NotFoundException('Utilisateur introuvable.');
        }

        user.friendRequestsReceived = user.friendRequestsReceived.filter((id) => id !== requesterId);
        requester.friendRequestsSent = requester.friendRequestsSent.filter((id) => id !== userId);

        await user.save();
        await requester.save();

        return this.sessionService.getSocketIdByUserId(requester._id.toString());
    }

    async removeFriend(userId: string, friendId: string): Promise<string> {
        const user = await this.userModel.findById(userId);
        const friend = await this.userModel.findById(friendId);

        if (!user || !friend) {
            throw new NotFoundException('Utilisateur introuvable.');
        }

        user.friends = user.friends.filter((id) => id !== friendId);
        friend.friends = friend.friends.filter((id) => id !== userId);

        await user.save();
        await friend.save();

        return this.sessionService.getSocketIdByUserId(friend._id.toString());
    }

    async searchUsers(query: string, userId: string) {
        const user = await this.userModel.findById(userId);

        if (!user) {
            throw new NotFoundException('Utilisateur introuvable.');
        }

        return await this.userModel.find({
            username: { $regex: '^' + query, $options: 'i' },
            _id: { $ne: userId },
        });
    }
}
