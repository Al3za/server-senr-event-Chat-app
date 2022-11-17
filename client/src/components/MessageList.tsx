import Message from "./Message";

const MessageRow = (props: { message: Message }) => {
  return <p>{props.message.text}</p>;
};

const MessageList = (props: { messages: Message[] }) => {
  return (
    <div className="MessageList">
      {props.messages.map((m) => (
        <MessageRow key={m.id} message={m} />
      ))}
    </div>
  );
};

export default MessageList;
