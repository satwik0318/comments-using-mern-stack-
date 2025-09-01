import React, { useRef, useState } from 'react';
import './TopCommentsBox.css';
import { useOpenReply } from './Message/Message';
import { useMainContext } from './Context/Context';
import axios from 'axios';

const SubCommentsBox = (props) => {
  const { setMessageUpdate } = useMainContext();
  const changeOpenReply = useOpenReply();
  const message = useRef(null);

  const [showCommentLine, setCommentLine] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [enableBtn, setEnableBtn] = useState(true);

  const commentFocus = () => {
    setCommentLine(true);
    setShowButtons(true);
  };

  const commentFocusOut = () => {
    setCommentLine(false);
  };

  const commentStroke = (event) => {
    const currMessage = event.target.value.trim();
    setEnableBtn(currMessage === '');
  };

  const sendComment = async (event) => {
    event.preventDefault();
    try {
      await axios.post('http://localhost:5000/new-sub-comment', {
        messageId: props.parentKey,
        messageData: message.current.value,
      });

      setMessageUpdate([1, props.parentKey]);
      message.current.value = '';
      setEnableBtn(true);
      changeOpenReply();
    } catch (err) {
      console.error('Error submitting sub-comment:', err);
    }
  };

  return (
    <form onSubmit={sendComment}>
      <section className="commentBox">
        <input
          autoFocus={props.autoFocus}
          type="text"
          placeholder="Add a comment"
          ref={message}
          onFocus={commentFocus}
          onBlur={commentFocusOut}
          onKeyUp={commentStroke}
        />
        {showCommentLine && <div className="commentLine"></div>}
      </section>

      {showButtons && (
        <>
          <button
            className="commentButton sendButton"
            type="submit"
            disabled={enableBtn}
          >
            COMMENT
          </button>
          <button
            className="commentButton"
            type="button"
            style={{ color: 'gray', backgroundColor: 'transparent' }}
            onClick={() => {
              setShowButtons(false);
              changeOpenReply();
            }}
          >
            CANCEL
          </button>
        </>
      )}
    </form>
  );
};

export default SubCommentsBox;
