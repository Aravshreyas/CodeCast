const ClassroomSession = require('../models/ClassroomSession');
const { AccessToken } = require('livekit-server-sdk');

const createSession = async (req, res) => {
    try {
        const session = new ClassroomSession({ instructor: req.user._id, participants: [req.user._id] });
        const createdSession = await session.save();
        res.status(201).json(createdSession);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getSessionDetails = async (req, res) => {
    try {
        const session = await ClassroomSession.findById(req.params.id).populate('participants', 'name role');
        if (session) {
            res.json(session);
        } else {
            res.status(404).json({ message: 'Session not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const joinSession = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const session = await ClassroomSession.findOne({ inviteCode });

        if (!session) {
            return res.status(404).json({ message: 'Session not found with this invite code.' });
        }

        if (!session.participants.includes(req.user._id)) {
            session.participants.push(req.user._id);
            await session.save();
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getLiveKitToken = async (req, res) => {
    const roomName = req.params.id; // Use session ID as the room name
    const participantName = req.user.name;
    const participantIdentity = req.user._id.toString();

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
        identity: participantIdentity,
        name: participantName,
    });
    at.addGrant({ roomJoin: true, room: roomName });

    res.json({ token: await at.toJwt() });
};



module.exports = { createSession, getSessionDetails, joinSession, getLiveKitToken };
