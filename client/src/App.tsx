import { useEffect, useReducer, useState } from "react";
import "./App.css";
import MessageList from "./components/MessageList";
import Message from "./components/Message";
import MessageSender from "./components/MessageSender";
import axios from "axios";
//import { io, Socket } from "socket.io-client";
import {
  useEventSource,
  useEventSourceListener,
} from "@react-nano/use-event-source";
// installera @react-nano/use-event-source

const uuid = () => window.crypto.randomUUID();

const API_ENDPOINT = "http://localhost:4000";

const sendNewMessage = async (message: Message): Promise<Message[]> => {
  await axios.post(`${API_ENDPOINT}/chat`, message, {
    withCredentials: true,
    // withCredentials : true,  allow you to set a cookie value in this origin domain as a response from another domain
    // without u cannot set a cookie value as a response from t.ex a fech to another url.
  });

  return getMessages();
};

const getMessages = async () => {
  const response = await axios.get<Message[]>(`${API_ENDPOINT}/chat`, {
    withCredentials: true,
  });
  return response.data;
};

type MessageAction = {
  type: "add" | "remove" | "replace";
  message?: Message;
  messages?: Message[];
};
const messageReducer = (state: Message[], action: MessageAction): Message[] => {
  if (action.type === "add" && action.message) {
    return [...state, action.message];
  } else if (action.type === "remove" && action.message) {
    return state.filter((m) => action.message?.id !== m.id);
  } else if (action.type === "replace" && action.messages) {
    return action.messages;
  } else {
    return state;
  }
};

function App() {
  const [text, setText] = useState<string>("");
  const [messages, dispatch] = useReducer(messageReducer, []);
  const [eventSource, eventSourceStatus] = useEventSource(
    `${API_ENDPOINT}/sse`,
    true
  );
  // vi har anvent en react library som hjälper oss att få eventSource lite mer hanterligt
  // i useEventSource vi anger url där functionen ska koppla sig, och true är till för credentials, som är för att det ska funka med cors, cockies osv

  // den function nedan är vår lyssnare som uppdaterar saker och thing åt oss

  useEventSourceListener(
    eventSource,
    ["message", "messages"],
    // message är en default sträng som tar emot server-sent-event data
    (evt) => {
      /// console.log("got event of type", evt.type);
      // en callback som vi anropar när vi får ett meddelande från server
      if (evt.type === "message") {
        const message = JSON.parse(evt.data) as Message;
        console.log("got message", message);
        dispatch({
          type: "add",
          message: message,
        });
      } else if (evt.type === "messages") {
        const messages = JSON.parse(evt.data) as Message[];
        console.log(evt.type, messages);
        dispatch({
          type: "replace",
          messages: messages,
        });
      }
    },
    [dispatch]
    // dispach anrop så den vet vad man ska beroende
  );

  const sendMessage = (message: Message) => {
    console.log("send message", message);
    sendNewMessage(message);
    // glöm inte bort withCredentials: true
  };

  return (
    <article>
      <header>
        <h2>Async Chat Demo</h2>
      </header>
      <main>
        <MessageList messages={messages} />
      </main>
      <footer>
        <MessageSender
          tex={text}
          onChang={setText}
          onSend={() => {
            sendMessage({ id: uuid(), text: text });
            setText("");
          }}
        />
      </footer>
    </article>
  );
}

export default App;

// React.StrictMode i index.tsx kör 2 ggr statements av en ogrundligt anledning.
// ta bort det för tillfället
