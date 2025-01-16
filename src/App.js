import React, { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import "./App.css";
import axios from "axios";

const socket = io.connect("ws://familychat-app.vercel.app");
const apiUrl = "ws://familychat-app.vercel.app/api/data";
const myPromise = new Promise((resolve, reject) => {
  axios
    .get(apiUrl)
    .then((res) => {
      const data = res.data;
      resolve(data);
    })
    .catch((err) => {
      console.error("Error in promise:", err);
      reject(err);
    });
});

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState("");
  const [apiData, setApiData] = useState("");

  // Memoize getMessages to prevent unnecessary re-creations of the function
  const getMessages = useCallback(async () => {
    try {
      const response = await myPromise;
      console.log("response", response);
      setApiData(response.msg);
    } catch (error) {
      console.error("error", error);
      setApiData("Error occurred");
    }
  }, []); // Empty dependency array, since getMessages doesn't depend on any other state or props

  useEffect(() => {
    getMessages();
  }, [getMessages]); // Now the dependency array includes getMessages

  // Setting up socket listeners
  useEffect(() => {
    // Setup the 'receive_message' listener
    const handleReceiveMessage = (receivedMessage) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: receivedMessage, isMine: false },
      ]);
    };

    socket.on("receive_message", handleReceiveMessage);

    // Cleanup the socket listener when the component unmounts
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, []); // Empty dependency array means it will run once on mount

  const sendMessage = (e) => {
    e.preventDefault();
    if (message && room) {
      socket.emit("send_message", { message, room });
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: message, isMine: true },
      ]);
      setMessage("");
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (room !== "") {
      socket.emit("join_room", room);
    }
  };

  return (
    <div className="chat-container">
      <h1>Api Data</h1>
      <p>{apiData ? apiData : "Loading..."}</p>
      <h1>Room</h1>

      <form onSubmit={joinRoom} className="message-form">
        <input
          type="text"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button type="submit">Join Room</button>
      </form>

      <h1>Chat</h1>

      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.isMine ? "my-message" : "partner-message"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
