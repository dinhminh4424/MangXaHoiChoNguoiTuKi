const Friend = require('../models/Friend');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

// Send a friend request
exports.sendFriendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user.id;
        if (senderId === receiverId) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself." });
        }

        const existingRequest = await FriendRequest.findOne({
            sender: senderId,
            receiver: receiverId,
            status: 'pending',
        });
        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already sent." });
        }
        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverId,
        });
        await newRequest.save();
        res.status(201).json({ message: "Friend request sent.", request: newRequest });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error });
    }
};

// Accept a friend request
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;
        const request = await FriendRequest.findById(requestId);
        if (!request || request.receiver.toString() !== userId || request.status !== 'pending') {
            return res.status(404).json({ message: "Friend request not found." });
        }
        request.status = 'accepted';
        await request.save();
        const friendship = new Friend({
            userA: request.sender,
            userB: request.receiver,
        });
        await friendship.save();
        res.status(200).json({ message: "Friend request accepted.", request });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error });
    }
};

// Reject a friend request
exports.rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;
        const request = await FriendRequest.findById(requestId);
        if (!request || request.receiver.toString() !== userId || request.status !== 'pending') {
            return res.status(404).json({ message: "Friend request not found." });
        }
        request.status = 'rejected';
        await request.save();
        res.status(200).json({ message: "Friend request rejected.", request });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error });
    }
};

// Cancel a sent friend request
exports.cancelFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;
        const request = await FriendRequest.findById(requestId);
        if (!request || request.sender.toString() !== userId || request.status !== 'pending') {
            return res.status(404).json({ message: "Friend request not found." });
        }
        request.status = 'cancelled';
        await request.save();
        res.status(200).json({ message: "Friend request cancelled.", request });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error });
    }
};

// Get all friend requests for the logged-in user
exports.getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await FriendRequest.find({ receiver: userId, status: 'pending' })
            .populate('sender', 'username email');
        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error });
    }
};
// Get all friends for the logged-in user
exports.getFriends = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendships = await Friend.find({
            $or: [{ userA: userId }, { userB: userId }],
            status: 'accepted',
        }).populate('userA userB', 'username email');
        const friends = friendships.map(f => (f.userA.id === userId ? f.userB : f.userA));
        res.status(200).json({ friends });
    }
    catch (error) {
        res.status(500).json({ message: "Server error.", error });
    }
};

// Remove a friend
exports.removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.id;
        const friendship = await Friend.findOneAndDelete({
            $or: [
                { userA: userId, userB: friendId },
                { userA: friendId, userB: userId }
            ],
            status: 'accepted',
        });
        if (!friendship) {
            return res.status(404).json({ message: "Friend not found." });
        }
        res.status(200).json({ message: "Friend removed." });
    } catch (error) {
        res.status(500).json({ message: "Server error.", error });
    }
};