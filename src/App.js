/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css"; // Assuming you have a CSS file for styling
import axios from "axios";

const socket = io.connect("https://familychat-app.vercel.app");

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState("");
  const [apiData, setApiData] = useState("");
  const apiUrl = "https://familychat-app.vercel.app/api/data";
  const myPromise = new Promise((resolve, reject) => {
    axios
      .get(apiUrl) // Der URL muss korrekt definiert sein
      .then((res) => {
        const data = res.data;
        resolve(data); // Erfolg, Daten zurückgeben
      })
      .catch((err) => {
        reject("promise err", err); // Fehler, Fehler zurückgeben
      });
  });

  const getMessages = async () => {
    try {
      const response = await myPromise;
      console.log("response", response);
      setApiData(response.msg);
    } catch (error) {
      console.error("error", error);
      setApiData("Error occurred");
    }
  };

  useEffect(() => {
    getMessages();
  }, []);

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

  const setupSocketListeners = () => {
    socket.on("receive_message", (receivedMessage) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: receivedMessage, isMine: false },
      ]);
    });
  };

  if (!socket.hasListeners("receive_message")) {
    setupSocketListeners();
  }

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
      {/*       {number} */}
    </div>
  );
}

export default App;
