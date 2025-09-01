import React, { useState, useRef, useContext, useEffect } from 'react';
import './Message.css';
import CommentsBox from '../CommentsBox';
import SubMessage from './SubMessage';
import axios from 'axios';
import { useMainContext } from '../Context/Context';

const showReply = React.createContext();
export function useOpenReply() {
  return useContext(showReply);
}

const Message = (props) => {
  const { setMessageUpdate } = useMainContext();
  const likeIcon = useRef();
  const [arrowUp, setArrowUp] = useState(false);
  const [openReply, setOpenReply] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(props.likes);

  const toggleReplyBox = () => setOpenReply((prev) => !prev);
  const toggleArrow = () => setArrowUp((prev) => !prev);

  useEffect(() => {
    const liked = JSON.parse(localStorage.getItem('likedCommentIds')) || [];
    if (liked.includes(props.useKey)) {
      setIsLiked(true);
      likeIcon.current.style.color = '#4688de';
    }
  }, [props.useKey]);

  const likeComment = async () => {
    const liked = JSON.parse(localStorage.getItem('likedCommentIds')) || [];
    const alreadyLiked = liked.includes(props.useKey);
    const inc = alreadyLiked ? -1 : 1;

    setLikes(prev => prev + inc);
    setIsLiked(!alreadyLiked);
    likeIcon.current.style.color = alreadyLiked ? 'gray' : '#4688de';

    try {
      await axios.post('http://localhost:5000/like-comment', {
        commentId: props.useKey,
        increment: inc
      });
      if (alreadyLiked) {
        const updated = liked.filter(id => id !== props.useKey);
        localStorage.setItem('likedCommentIds', JSON.stringify(updated));
      } else {
        liked.push(props.useKey);
        localStorage.setItem('likedCommentIds', JSON.stringify(liked));
      }
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const deleteMessage = async () => {
    await axios.post('http://localhost:5000/delete-comment', {
      messageId: props.useKey
    });
    setMessageUpdate([2, props.useKey]);
  };

  return (
    <div className="hell">
      <section className="MessageContainer">
        <section className="messageHeader">
          <i className="fas fa-user-circle user-icon"></i>
          <div className="messageUser">{props.user}</div>
        </section>

        <div className="messageText">{props.message}</div>

        <section className="messageIconsContainer">
          <i className="fas fa-thumbs-up" ref={likeIcon} onClick={likeComment}></i>
          <div>{likes}</div>
          <i className="fas fa-thumbs-down"></i>
          <div onClick={toggleReplyBox}>REPLY</div>
          <div onClick={deleteMessage} style={{ color: 'red' }}>DELETE</div>
        </section>

        <showReply.Provider value={toggleReplyBox}>
          {openReply && <CommentsBox useKey={props.useKey} autoFocus={true} />}
        </showReply.Provider>

        {props.replies?.length > 0 && (
          <section className="arrowReplies" onClick={toggleArrow}>
            <i className={`fas fa-caret-${arrowUp ? 'up' : 'down'}`}></i>
            <div>View {props.replies.length} replies</div>
          </section>
        )}

        {arrowUp && props.replies?.length > 0 && (
          <section className="subMessages">
            {props.replies.map((reply) => (
              <SubMessage
                key={reply._id}
                subId={reply._id}
                parentKey={props.useKey}
                user={reply.user}
                message={reply.message}
                likes={reply.likes}
                replies={reply.replies}
              />
            ))}
          </section>
        )}
      </section>
    </div>
  );
};

export default Message;
