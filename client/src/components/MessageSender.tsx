interface mess {
    tex: string;
    onChang: (item: string) => void;
    onSend: () => void;
  }
  
  const MessageSender = (props: mess) => {
    return (
      <div className="MessageSender">
        <input
          type="text"
          value={props.tex}
          placeholder="Type message here..."
          onChange={(e) => props.onChang(e.target.value)}
        />
        <button onClick={() => props.onSend()}>Send</button>
      </div>
    );
  };
  
  export default MessageSender;
  