import React, { useState, useRef, useContext, useEffect } from 'react';
import SubCommentsBox from '../SubCommentsBox';
import { useMainContext } from '../Context/Context';
import axios from 'axios';

const showReply = React.createContext();
export function useOpenReply() {
  return useContext(showReply);
}

const SubMessage = (props) => {
  const { setMessageUpdate } = useMainContext();
  const likeIcon = useRef();
  const [openReply, setOpenReply] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(props.likes);
  const [showNested, setShowNested] = useState(false);

  const toggleReplyBox = () => setOpenReply((prev) => !prev);
  const toggleNestedReplies = () => setShowNested((prev) => !prev);

  useEffect(() => {
    const likedSub = JSON.parse(localStorage.getItem('likedSubCommentIds')) || [];
    if (likedSub.includes(props.subId)) {
      setIsLiked(true);
      likeIcon.current.style.color = '#4688de';
    }
  }, [props.subId]);

  const likeComment = async () => {
    const likedSub = JSON.parse(localStorage.getItem('likedSubCommentIds')) || [];
    const alreadyLiked = likedSub.includes(props.subId);
    const inc = alreadyLiked ? -1 : 1;

    setLikes((prev) => prev + inc);
    setIsLiked(!alreadyLiked);
    likeIcon.current.style.color = alreadyLiked ? 'gray' : '#4688de';

    try {
      await axios.post('http://localhost:5000/like-comment', {
        commentId: props.subId,
        isSubComment: true,
        parentId: props.parentKey,
        increment: inc,
      });

      if (alreadyLiked) {
        const updated = likedSub.filter((id) => id !== props.subId);
        localStorage.setItem('likedSubCommentIds', JSON.stringify(updated));
      } else {
        likedSub.push(props.subId);
        localStorage.setItem('likedSubCommentIds', JSON.stringify(likedSub));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const deleteMessage = async () => {
    await axios.post('http://localhost:5000/delete-sub-comments', {
      messageId: props.parentKey,
      subId: props.subId,
    });
    setMessageUpdate([1, props.parentKey]);
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
          {openReply && <SubCommentsBox parentKey={props.subId} autoFocus={true} />}
        </showReply.Provider>

        {props.replies?.length > 0 && (
          <>
            <div onClick={toggleNestedReplies} className="arrowReplies">
              <i className={`fas fa-caret-${showNested ? 'up' : 'down'}`}></i>
              <div>View {props.replies.length} replies</div>
            </div>

            {showNested && (
              <section className="subMessages">
                {props.replies.map((reply) => (
                  <SubMessage
                    key={reply._id}
                    subId={reply._id}
                    parentKey={props.subId}
                    user={reply.user}
                    message={reply.message}
                    likes={reply.likes}
                    replies={reply.replies}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default SubMessage;
