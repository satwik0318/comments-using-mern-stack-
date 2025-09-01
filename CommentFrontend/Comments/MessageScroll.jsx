import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Message from './Message/Message';
import { useMainContext } from './Context/Context';

function MessageScroll() {
  const {
    messageReset,
    messageUpdate,
    commentIncrement,
    setCommentIncrement,
    forceRefresh,
    setForceRefresh,
  } = useMainContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBottomBar, setShowBottomBar] = useState(true);
  const commentIncrementRef = useRef(commentIncrement);

  const loadInitialComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/comments?skip=0&limit=10`);
      setMessages(res.data);
      setLoading(false);
      setCommentIncrement(res.data.length);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialComments();
  }, [messageReset]);

  useEffect(() => {
    if (forceRefresh) {
      loadInitialComments();
      setForceRefresh(false);
    }
  }, [forceRefresh]);

  useEffect(() => {
    if (messageUpdate?.[0] === 1) {
      axios
        .post('http://localhost:5000/update-comment', {
          commentId: messageUpdate[1],
        })
        .then((res) => {
          const updated = res.data;
          const updatedList = [...messages];
          const index = updatedList.findIndex((m) => m._id === updated._id);
          if (index !== -1) {
            updatedList.splice(index, 1, updated);
            setMessages(updatedList);
          }
        })
        .catch((err) => console.error(err));
    } else if (messageUpdate?.[0] === 2) {
      const filtered = messages.filter((m) => m._id !== messageUpdate[1]);
      setMessages(filtered);
    }
  }, [messageUpdate]);

  const observer = useRef(
    new IntersectionObserver(async (entries) => {
      const first = entries[0];
      if (first.isIntersecting) {
        try {
          const res = await axios.post('http://localhost:5000/get-more-data', {
            commentIncrement: commentIncrementRef.current,
          });
          const newComments = res.data;
          if (newComments.length > 0) {
            setMessages((prev) => [...prev, ...newComments]);
            setCommentIncrement((prev) => prev + newComments.length);
          } else {
            setShowBottomBar(false);
          }
        } catch (error) {
          console.error('Error fetching more data:', error);
        }
      }
    }, { threshold: 1 })
  );

  const [bottomBar, setBottomBar] = useState(null);

  useEffect(() => {
    commentIncrementRef.current = commentIncrement;
  }, [commentIncrement]);

  useEffect(() => {
    const currentBottomBar = bottomBar;
    const currentObserver = observer.current;
    if (currentBottomBar) currentObserver.observe(currentBottomBar);
    return () => {
      if (currentBottomBar) currentObserver.unobserve(currentBottomBar);
    };
  }, [bottomBar]);

  return (
    <div className="comment-section">
      <h2>Comments</h2>
      {loading && <p>Loading...</p>}
      {messages.map((msg) => (
        <Message
          key={msg._id}
          useKey={msg._id}
          user={msg.user}
          message={msg.message}
          likes={msg.likes}
          replies={msg.replies}
        />
      ))}
      {messages.length > 9 && showBottomBar && (
        <div className="bottomBar" ref={setBottomBar}>
          <div className="loader"></div>
        </div>
      )}
    </div>
  );
}

export default MessageScroll;
