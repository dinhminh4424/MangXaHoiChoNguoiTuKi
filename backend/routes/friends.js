// send, accept, reject, cancel, list requests, list friends, remove friend
exports.getFriends = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendships = await Friend.find({
            $or: [{ userA: userId }, { userB: userId }]
        }).populate('userA userB', 'username email');
        const friends = friendships.map(f => { (f.userA.id === userId ? f.userB : f.userA) });
        res.status(200).json({ friends });
    }
    catch (error) {
        res.status(500).json({ message: "Server error.", error });
    }
};
