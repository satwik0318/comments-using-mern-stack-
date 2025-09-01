import React, { useRef, useState } from 'react';
import "./TopCommentsBox.css";
import { useMainContext } from "./Context/Context";
import axios from "axios";

const TopComments = (props) => {
  const { setMessageReset, setCommentIncrement, setForceRefresh } = useMainContext();
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
    const currMessage = event.target.value;
    setEnableBtn(!currMessage.trim());
  };

  const sendComment = async (event) => {
    event.preventDefault();
    const value = message.current.value.trim();
    if (!value) return;

    try {
      await axios.post("http://localhost:5000/new-comment", {
        messageData: value
      });
      message.current.value = '';
      setEnableBtn(true);
      setMessageReset(prev => !prev);
      setCommentIncrement(0);
      setForceRefresh(prev => !prev); // 🔄 trigger refresh
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  return (
    <form>
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
            disabled={enableBtn}
            onClick={sendComment}
          >
            COMMENT
          </button>
          <button
            className="commentButton"
            style={{ color: "gray", backgroundColor: "transparent" }}
            onClick={() => {
              setShowButtons(false);
              message.current.value = "";
              setEnableBtn(true);
            }}
          >
            CANCEL
          </button>
        </>
      )}
    </form>
  );
};

export default TopComments;
