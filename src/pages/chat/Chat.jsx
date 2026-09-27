import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Send, Image as ImageIcon, Search, MessageSquare, 
  Phone, Building, Stethoscope, User, Clock, Check, 
  Sparkles, ArrowLeft, MoreVertical, Paperclip
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';
import getImageUrl from '../../utils/imageUrl';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const targetUserIdParam = searchParams.get('targetUserId');
  const appointmentIdParam = searchParams.get('appointmentId');
  const conversationIdParam = searchParams.get('conversationId');
  const user = useSelector((state) => state.auth.user);
  const myUserId = user?._id || user?.id;

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeConversationRef = useRef(activeConversation);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Hàm thêm tin nhắn tránh trùng lặp
  const addMessageIfNotExist = (newMsg) => {
    if (!newMsg || !newMsg._id) return;
    setMessages((prev) => {
      if (prev.some((m) => String(m._id) === String(newMsg._id))) {
        return prev;
      }
      return [...prev, newMsg];
    });
  };

  // 1. Tải danh sách các cuộc hội thoại
  const fetchConversations = async (autoSelectId = null) => {
    try {
      const res = await apiClient.get('/chat/conversations');
      const list = res.data.data || [];
      setConversations(list);

      const selectId = autoSelectId || conversationIdParam;
      if (selectId) {
        const found = list.find((c) => String(c._id) === String(selectId));
        if (found) {
          setActiveConversation(found);
        }
      } else if (list.length > 0 && !activeConversationRef.current) {
        setActiveConversation(list[0]);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  // 2. Xử lý khi có targetUserId hoặc conversationId trong query params
  useEffect(() => {
    const initTargetChat = async () => {
      if (targetUserIdParam && myUserId) {
        try {
          const res = await apiClient.post('/chat/conversations', {
            targetUserId: targetUserIdParam,
            appointmentId: appointmentIdParam || null
          });
          const convId = res.data.data?.conversation?._id;
          await fetchConversations(convId);
        } catch (err) {
          console.error('Lỗi khi tạo cuộc hội thoại mục tiêu:', err);
          fetchConversations();
        }
      } else {
        fetchConversations(conversationIdParam);
      }
    };
    initTargetChat();
  }, [targetUserIdParam, appointmentIdParam, conversationIdParam, myUserId]);

  // 3. Lắng nghe tin nhắn realtime xuyên suốt trên kênh cá nhân
  useEffect(() => {
    if (!myUserId) return;

    const socket = getSocket(myUserId);

    const handleReceiveMessage = (newMsg) => {
      const currentActive = activeConversationRef.current;

      // 1. Nếu tin nhắn thuộc cuộc hội thoại đang mở -> hiển thị ngay trên màn hình!
      if (currentActive && String(newMsg.conversation_id) === String(currentActive._id)) {
        addMessageIfNotExist(newMsg);
        scrollToBottom();
      }

      // 2. Cập nhật danh sách hội thoại bên trái: đưa hội thoại có tin nhắn mới lên đầu!
      setConversations((prev) => {
        const exists = prev.some((c) => String(c._id) === String(newMsg.conversation_id));
        if (!exists) {
          fetchConversations(currentActive?._id);
          return prev;
        }

        const isCurrentActive = currentActive && String(currentActive._id) === String(newMsg.conversation_id);
        const updated = prev.map((c) => {
          if (String(c._id) === String(newMsg.conversation_id)) {
            return {
              ...c,
              last_message: newMsg.message_type === 'IMAGE' ? '[Hình ảnh]' : newMsg.content,
              last_message_at: newMsg.created_at,
              unread_count: isCurrentActive ? 0 : (c.unread_count || 0) + 1
            };
          }
          return c;
        });

        return updated.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [myUserId]);

  // 4. Tải lịch sử tin nhắn & tham gia phòng socket khi đổi activeConversation
  useEffect(() => {
    if (!activeConversation || !myUserId) return;

    const socket = getSocket(myUserId);

    // Tham gia phòng socket của hội thoại
    socket.emit('join_conversation', activeConversation._id);

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await apiClient.get(`/chat/conversations/${activeConversation._id}/messages`);
        setMessages(res.data.data || []);
        // Reset unread count trên local state
        setConversations((prev) =>
          prev.map((c) =>
            String(c._id) === String(activeConversation._id) ? { ...c, unread_count: 0 } : c
          )
        );
      } catch (err) {
        console.error('Lỗi khi tải tin nhắn:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Lắng nghe typing
    const handleUserTyping = ({ conversationId }) => {
      if (String(conversationId) === String(activeConversation._id)) {
        setPartnerTyping(true);
      }
    };

    const handleUserStopTyping = ({ conversationId }) => {
      if (String(conversationId) === String(activeConversation._id)) {
        setPartnerTyping(false);
      }
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.emit('leave_conversation', activeConversation._id);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [activeConversation?._id, myUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping]);

  // Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;

    const content = inputMessage.trim();
    setInputMessage('');

    // Ngừng typing socket
    if (myUserId) {
      const socket = getSocket(myUserId);
      socket.emit('stop_typing', {
        conversationId: activeConversation._id,
        senderId: myUserId
      });
    }

    try {
      const res = await apiClient.post(`/chat/conversations/${activeConversation._id}/messages`, {
        content,
        messageType: 'TEXT'
      });
      if (res.data?.data) {
        addMessageIfNotExist(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err);
    }
  };

  // Gửi ảnh minh họa nhanh
  const handleSendImage = async () => {
    const imageUrl = prompt('Nhập đường dẫn URL ảnh thú cưng bạn muốn gửi:');
    if (!imageUrl || !imageUrl.trim() || !activeConversation) return;

    try {
      const res = await apiClient.post(`/chat/conversations/${activeConversation._id}/messages`, {
        fileUrl: imageUrl.trim(),
        messageType: 'IMAGE',
        content: '[Hình ảnh thú cưng]'
      });
      if (res.data?.data) {
        addMessageIfNotExist(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi gửi ảnh:', err);
    }
  };

  // Xử lý typing event
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (myUserId && activeConversation) {
      const socket = getSocket(myUserId);
      socket.emit('typing', {
        conversationId: activeConversation._id,
        senderName: user?.full_name || 'Người dùng',
        senderId: myUserId
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          conversationId: activeConversation._id,
          senderId: myUserId
        });
      }, 1500);
    }
  };

  const formatMediaUrl = (url) => {
    return getImageUrl(url, '');
  };

  const getPartnerAvatar = (partner) => {
    if (!partner) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    // 1. Nếu đối tác là Cơ sở Thú y / Cửa hàng (CLINIC) -> Ưu tiên tuyệt đối Logo cửa hàng
    if (partner.role === 'CLINIC' || partner.clinic) {
      const storeLogo = partner.clinic?.logo_url || partner.clinic?.image || partner.avatar_url;
      if (storeLogo) {
        return formatMediaUrl(storeLogo);
      }
      return 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
    }

    // 2. Nếu đối tác là Bác sĩ thú y (VETERINARIAN)
    if (partner.role === 'VETERINARIAN' || partner.veterinarian) {
      const vetAvatar = partner.veterinarian?.avatar_url || partner.avatar_url;
      if (vetAvatar) {
        return formatMediaUrl(vetAvatar);
      }
      return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80';
    }

    // 3. Khách hàng / Chủ thú cưng (PET_OWNER)
    if (partner.avatar_url) {
      return formatMediaUrl(partner.avatar_url);
    }

    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  };

  const getRoleLabel = (partner) => {
    if (partner?.clinic?.name) {
      return `🏥 ${partner.clinic.name}`;
    }
    if (partner?.role === 'VETERINARIAN') {
      return `👨‍⚕️ Bác sĩ thú y ${partner?.veterinarian?.specialty ? `(${partner.veterinarian.specialty})` : ''}`;
    }
    if (partner?.role === 'CLINIC') {
      return '🏥 Cơ sở Thú y';
    }
    return '🐾 Khách hàng';
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const name = (c.partner?.full_name || '').toLowerCase();
    const clinicName = (c.partner?.clinic?.name || '').toLowerCase();
    const kw = searchFilter.toLowerCase();
    return name.includes(kw) || clinicName.includes(kw);
  });

  return (
    <div className="w-full h-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 flex flex-col min-h-0">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* LEFT COLUMN: Conversation List */}
        <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-gray-100 flex-col h-full bg-slate-50/50 shrink-0 min-h-0`}>
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-white shrink-0">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <MessageSquare className="text-primary" size={22} />
              <span>Tin nhắn</span>
            </h2>

            {/* Search Filter */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Tìm người dùng, phòng khám..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100/60 p-2 min-h-0">
            {loadingConv ? (
              <div className="py-20 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-gray-400">Đang tải cuộc trò chuyện...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-16 text-center space-y-2 px-4">
                <div className="text-4xl">💬</div>
                <p className="text-xs font-bold text-gray-700">Chưa có hội thoại nào</p>
                <p className="text-[11px] text-gray-400">
                  Bấm "Nhắn tin" trên thẻ phòng khám hoặc dịch vụ để bắt đầu trò chuyện.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?._id === conv._id;
                const partner = conv.partner || {};
                const unread = conv.unread_count || 0;

                return (
                  <div
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-3.5 rounded-2xl flex items-center gap-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white shadow-md shadow-gray-200/50 border border-gray-100'
                        : 'hover:bg-white/80'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={getPartnerAvatar(partner)}
                        alt="Avatar"
                        className="w-12 h-12 rounded-2xl object-cover border border-gray-200 shadow-xs"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-xs truncate">
                          {partner.clinic?.name || partner.full_name || 'Người dùng'}
                        </h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {formatMessageTime(conv.last_message_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 truncate">
                        {conv.last_message || 'Bắt đầu cuộc trò chuyện'}
                      </p>

                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10px] font-semibold text-primary/80 truncate">
                          {getRoleLabel(partner)}
                        </span>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.2 bg-red-500 text-white font-extrabold text-[10px] rounded-full">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Window */}
        <div className={`${!activeConversation ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-white min-h-0`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-4 sm:px-6 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-2 -ml-1 rounded-xl text-gray-600 hover:bg-slate-100 transition-colors"
                    title="Quay lại danh sách"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="relative shrink-0">
                    <img
                      src={getPartnerAvatar(activeConversation.partner)}
                      alt="Avatar"
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-gray-100 shadow-xs"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-gray-900 truncate">
                      {activeConversation.partner?.clinic?.name || activeConversation.partner?.full_name || 'Đối tác'}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 truncate">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="truncate">{getRoleLabel(activeConversation.partner)}</span>
                      {activeConversation.partner?.phone && (
                        <span className="hidden sm:inline shrink-0">• 📞 {activeConversation.partner.phone}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 min-h-0">
                {loadingMessages ? (
                  <div className="py-20 text-center space-y-2">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-gray-400">Đang tải lịch sử trò chuyện...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-24 text-center space-y-2">
                    <div className="text-4xl">👋</div>
                    <p className="text-xs font-bold text-gray-700">Chưa có tin nhắn nào</p>
                    <p className="text-[11px] text-gray-400">
                      Hãy gửi tin nhắn đầu tiên để bắt đầu trao đổi với đối tác!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const msgSenderId = msg.sender_id?._id || msg.sender_id?.id || msg.sender_id;
                    const isMine = String(msgSenderId) === String(myUserId);

                    return (
                      <div
                        key={msg._id || Math.random()}
                        className={`flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMine && (
                          <img
                            src={getPartnerAvatar(activeConversation.partner)}
                            alt="Avatar"
                            className="w-7 h-7 rounded-xl object-cover mb-1 shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                        )}

                        <div
                          className={`max-w-[75%] sm:max-w-md rounded-2xl p-3.5 text-xs shadow-xs space-y-1.5 ${
                            isMine
                              ? 'bg-primary text-white rounded-br-none'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                          }`}
                        >
                          {msg.message_type === 'IMAGE' && msg.file_url ? (
                            <div className="rounded-xl overflow-hidden mb-1">
                              <img
                                src={formatMediaUrl(msg.file_url)}
                                alt="Ảnh gửi"
                                className="max-h-60 rounded-xl object-cover hover:scale-105 transition-transform"
                              />
                            </div>
                          ) : (
                            <p className="whitespace-pre-line leading-relaxed font-medium break-words">
                              {msg.content}
                            </p>
                          )}

                          <div
                            className={`text-[9px] flex items-center justify-end gap-1 ${
                              isMine ? 'text-emerald-100' : 'text-gray-400'
                            }`}
                          >
                            <span>{formatMessageTime(msg.created_at)}</span>
                            {isMine && <Check size={10} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {partnerTyping && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    <span>Đối phương đang soạn tin nhắn...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSendImage}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Gửi ảnh thú cưng"
                >
                  <ImageIcon size={18} />
                </button>

                <input
                  type="text"
                  placeholder="Nhập nội dung tin nhắn... (Nhấn Enter để gửi)"
                  value={inputMessage}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2.5 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-white font-bold transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl">
                💬
              </div>
              <h3 className="font-extrabold text-base text-gray-900">Trung tâm Tin nhắn Trực tuyến</h3>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Chọn một cuộc trò chuyện ở danh sách bên trái hoặc bấm "Nhắn tin" trên trang phòng khám để bắt đầu trao đổi.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Chat;
