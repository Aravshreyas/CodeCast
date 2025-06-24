import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import {
  Send,
  UserCircle,
  Crown,
  Hand,
  Check,
  X,
  Code,
  MessageSquare,
  Users,
  PlusCircle,
} from 'lucide-react';

import { useAppContext } from '../context/AppContext';
import PromptModal from '../components/PromptModal';

const Classroom = () => {
  const { sessionId } = useParams();
  const { userInfo, theme } = useAppContext();

  const [sessionDetails, setSessionDetails] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [reactions, setReactions] = useState({});
  const [code, setCode] = useState(
    '// Welcome to CodeCast! The instructor will start typing soon...'
  );
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [editorController, setEditorController] = useState(null);
  const [controlRequests, setControlRequests] = useState([]);
  const [hasRequestedControl, setHasRequestedControl] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'participants', 'prompts'
  const [prompts, setPrompts] = useState([]);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptDesc, setNewPromptDesc] = useState('');
  const [newPromptCode, setNewPromptCode] = useState('');
  const [activePrompt, setActivePrompt] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reactionTimeouts = useRef({});

  const isInstructor = userInfo?._id === sessionDetails?.instructor;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchSessionAndPrompts = async () => {
      if (!userInfo) return;
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/sessions/${sessionId}`,
          config
        );
        setSessionDetails(data);
        setParticipants(data.participants);
        setEditorController({
          id: data.instructor,
          name:
            data.participants.find((p) => p._id === data.instructor)?.name ||
            'Instructor',
        });

        if (userInfo.role === 'instructor') {
          const promptsRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/prompts`,
            config
          );
          setPrompts(promptsRes.data);
        }
      } catch (err) {
        setError('Could not fetch session details.');
      }
    };
    fetchSessionAndPrompts();
  }, [sessionId, userInfo]);

  useEffect(() => {
    if (!sessionDetails || !userInfo) return;

    socketRef.current = io(import.meta.env.VITE_API_URL);
    const socket = socketRef.current;

    socket.on('connect', () =>
      socket.emit('join-room', sessionDetails.inviteCode, userInfo._id)
    );
    socket.on('code-update', (data) => setCode(data.code));
    socket.on('new-message', (message) =>
      setMessages((prev) => [...prev, message])
    );
    socket.on('participants-update', (updatedParticipants) =>
      setParticipants(updatedParticipants)
    );
    socket.on('new-reaction', ({ userId, reaction }) => {
      if (reactionTimeouts.current[userId]) {
        clearTimeout(reactionTimeouts.current[userId]);
      }
      setReactions((prev) => ({ ...prev, [userId]: reaction }));
      reactionTimeouts.current[userId] = setTimeout(() => {
        setReactions((prev) => {
          const newReactions = { ...prev };
          delete newReactions[userId];
          return newReactions;
        });
      }, 5000);
    });
    socket.on('new-control-request', ({ requester }) => {
      if (!controlRequests.some((req) => req.id === requester.id)) {
        setControlRequests((prev) => [...prev, requester]);
      }
    });
    socket.on('control-granted', ({ controller }) => {
      setEditorController(controller);
      setControlRequests([]);
      setHasRequestedControl(false);
    });
    socket.on('request-denied', () => setHasRequestedControl(false));
    socket.on('control-revoked', () =>
      setEditorController({
        id: sessionDetails.instructor,
        name:
          sessionDetails.participants.find(
            (p) => p._id === sessionDetails.instructor
          )?.name || 'Instructor',
      })
    );
    socket.on('new-prompt', ({ prompt }) => setActivePrompt(prompt));

    return () => {
      Object.values(reactionTimeouts.current).forEach(clearTimeout);
      socket.disconnect();
    };
  }, [sessionDetails, userInfo]);

  const handleEditorChange = (value) => {
    if (userInfo?._id === editorController?.id) {
      setCode(value);
      socketRef.current?.emit('code-update', {
        room: sessionDetails.inviteCode,
        code: value,
      });
    }
  };

  const handleSendReaction = (reaction) =>
    socketRef.current?.emit('send-reaction', {
      room: sessionDetails.inviteCode,
      userId: userInfo._id,
      reaction,
    });

  const handleRequestControl = () => {
    setHasRequestedControl(true);
    socketRef.current?.emit('request-control', {
      room: sessionDetails.inviteCode,
      requester: { id: userInfo._id, name: userInfo.name },
    });
  };

  const handleGrantControl = (requester) =>
    socketRef.current?.emit('grant-control', {
      room: sessionDetails.inviteCode,
      controller: requester,
    });

  const handleDenyControl = (requesterId) => {
    setControlRequests((prev) => prev.filter((req) => req.id !== requesterId));
    socketRef.current?.emit('deny-control', {
      room: sessionDetails.inviteCode,
      requesterId: requesterId,
    });
  };

  const handleRevokeControl = () =>
    socketRef.current?.emit('revoke-control', {
      room: sessionDetails.inviteCode,
    });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('send-message', {
        room: sessionDetails.inviteCode,
        user: { name: userInfo.name, id: userInfo._id },
        text: newMessage.trim(),
      });
      setNewMessage('');
    }
  };

  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/prompts`,
        {
          title: newPromptTitle,
          description: newPromptDesc,
          starterCode: newPromptCode,
        },
        config
      );
      setPrompts((prev) => [...prev, data]);
      setShowCreatePrompt(false);
      setNewPromptTitle('');
      setNewPromptDesc('');
      setNewPromptCode('');
    } catch (err) {
      console.error('Failed to create prompt', err);
    }
  };

  const handleBroadcastPrompt = (prompt) => {
    socketRef.current?.emit('broadcast-prompt', {
      room: sessionDetails.inviteCode,
      prompt,
    });
  };

  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!sessionDetails)
    return <div className="text-center py-10">Loading session...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <PromptModal
        prompt={activePrompt}
        onClose={() => {
          setCode(activePrompt.starterCode);
          setActivePrompt(null);
        }}
      />
      {isInstructor &&
        controlRequests.map((req) => (
          <div
            key={req.id}
            className="bg-blue-100 dark:bg-blue-900 border-b border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-2 flex justify-between items-center animate-pulse"
          >
            <span>
              <strong>{req.name}</strong> is requesting control.
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleGrantControl(req)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => handleDenyControl(req.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      <div className="flex flex-grow overflow-hidden">
        <div className="flex-grow flex flex-col">
          <div className="p-2 bg-gray-200 dark:bg-gray-800 flex justify-between items-center border-b border-gray-300 dark:border-gray-700">
            <h1 className="text-lg font-bold">Live Code Editor</h1>
            {editorController?.id !== sessionDetails.instructor ? (
              <div className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-4">
                <span>{editorController?.name} is currently editing.</span>
                {isInstructor && (
                  <button
                    onClick={handleRevokeControl}
                    className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm">
                <span className="font-semibold">Invite Code:</span>
                <span className="ml-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-mono">
                  {sessionDetails.inviteCode}
                </span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <Editor
              height="100%"
              language="javascript"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={code}
              onChange={handleEditorChange}
              options={{
                readOnly: userInfo?._id !== editorController?.id,
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <div className="w-96 flex flex-col bg-gray-50 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700">
          <div className="flex border-b border-gray-300 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 p-2 text-sm font-semibold flex items-center justify-center gap-2 ${
                activeTab === 'chat' ? 'bg-white dark:bg-gray-700' : ''
              }`}
            >
              <MessageSquare size={16} /> Chat
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 p-2 text-sm font-semibold flex items-center justify-center gap-2 ${
                activeTab === 'participants' ? 'bg-white dark:bg-gray-700' : ''
              }`}
            >
              <Users size={16} /> Participants
            </button>
            {isInstructor && (
              <button
                onClick={() => setActiveTab('prompts')}
                className={`flex-1 p-2 text-sm font-semibold flex items-center justify-center gap-2 ${
                  activeTab === 'prompts' ? 'bg-white dark:bg-gray-700' : ''
                }`}
              >
                <Code size={16} /> Prompts
              </button>
            )}
          </div>

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex flex-col flex-grow">
              <div className="flex-grow p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-3 flex flex-col ${
                      msg.user.id === userInfo._id
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >
                    <div
                      className={`inline-block p-2 rounded-lg ${
                        msg.user.id === userInfo._id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <div className="text-xs font-bold mb-1">
                        {msg.user.id === userInfo._id ? 'You' : msg.user.name}
                      </div>
                      <div>{msg.text}</div>
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-300 dark:border-gray-700 flex items-center"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow px-3 py-2 border rounded-l-lg bg-white dark:bg-gray-700"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div className="p-4 overflow-y-auto">
              <ul className="space-y-2">
                {participants.map((p) => (
                  <li
                    key={p._id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="w-6 text-xl">
                      {reactions[p._id] || <UserCircle size={20} />}
                    </span>
                    <span className="flex-grow">{p.name}</span>
                    {p._id === editorController?.id &&
                      p.role !== 'instructor' && (
                        <Hand
                          size={16}
                          className="text-green-500"
                          title="Has Control"
                        />
                      )}
                    {p.role === 'instructor' && (
                      <Crown
                        size={16}
                        className="text-yellow-500"
                        title="Instructor"
                      />
                    )}
                  </li>
                ))}
              </ul>
              {!isInstructor && (
                <div className="mt-6 border-t pt-4 border-gray-300 dark:border-gray-600">
                  <h3 className="text-lg font-bold mb-3">Actions</h3>
                  <div className="flex justify-around items-center">
                    <button
                      onClick={handleRequestControl}
                      disabled={hasRequestedControl}
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800"
                    >
                      Request Control
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendReaction('✋')}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-2xl"
                        title="Raise Hand"
                      >
                        ✋
                      </button>
                      <button
                        onClick={() => handleSendReaction('👍')}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-2xl"
                        title="Thumbs Up"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleSendReaction('❓')}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-2xl"
                        title="Question"
                      >
                        ❓
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prompts Tab (Instructor Only) */}
          {activeTab === 'prompts' && isInstructor && (
            <div className="p-4 flex-grow flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Prompts</h2>
                <button
                  onClick={() => setShowCreatePrompt(true)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <PlusCircle size={16} /> New
                </button>
              </div>
              <ul className="space-y-2 overflow-y-auto flex-grow">
                {prompts.map((p) => (
                  <li
                    key={p._id}
                    className="p-3 rounded-md bg-gray-100 dark:bg-gray-700"
                  >
                    <p className="font-bold">{p.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {p.description}
                    </p>
                    <button
                      onClick={() => handleBroadcastPrompt(p)}
                      className="w-full mt-2 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Broadcast
                    </button>
                  </li>
                ))}
                {prompts.length === 0 && (
                  <p className="text-sm text-gray-500">
                    You haven't created any prompts yet.
                  </p>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      {/* Create Prompt Modal */}
      {showCreatePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl relative">
            <button
              onClick={() => setShowCreatePrompt(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Create New Prompt</h2>
            <form onSubmit={handleCreatePrompt}>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={newPromptTitle}
                  onChange={(e) => setNewPromptTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Description
                </label>
                <textarea
                  value={newPromptDesc}
                  onChange={(e) => setNewPromptDesc(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700"
                  required
                ></textarea>
              </div>
              <div className="mb-6">
                <label className="block mb-1 text-sm font-medium">
                  Starter Code
                </label>
                <textarea
                  value={newPromptCode}
                  onChange={(e) => setNewPromptCode(e.target.value)}
                  rows="5"
                  className="w-full px-3 py-2 font-mono text-sm border rounded-lg bg-gray-50 dark:bg-gray-700"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save Prompt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classroom;