import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
const REST_ENDPOINT =
  "https://11nfsd5x34.execute-api.us-east-2.amazonaws.com/default/messages?TableName=FIX-messages-test";
const WEBSOCKET_URL =
  "wss://bpugc3rkcj.execute-api.us-east-2.amazonaws.com/dev";

const App = () => {
  const [ordersData, setOrdersData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const [messageList, setMessageList] = useState<any[]>([]);

  const handleClick = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    axios
      .get(REST_ENDPOINT)
      .then((response) => {
        setOrdersData(response.data);
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const onSocketOpen = useCallback(() => {
    setIsConnected(true);
  }, []);

  const onSocketClose = useCallback(() => {
    setIsConnected(false);
  }, []);

  const onSocketMessage = useCallback((data: any) => {
    const parsedData = JSON.parse(data);
    setMessageList((messageList) => [
      ...messageList,
      {
        id: parsedData.id.S,
        message: parsedData.message.S,
      },
    ]);
  }, []);

  const onConnect = useCallback(() => {
    if (ws.current?.readyState !== WebSocket.OPEN) {
      ws.current = new WebSocket(WEBSOCKET_URL);
      ws.current?.addEventListener("open", onSocketOpen);
      ws.current?.addEventListener("close", onSocketClose);
      ws.current?.addEventListener("message", (event) => {
        onSocketMessage(event.data);
      });
    }
    console.log("Connected to Websocket");
  }, []);

  useEffect(() => {
    return () => {
      ws.current?.close();
    };
  }, []);

  const onDisconnect = useCallback(() => {
    if (isConnected) {
      ws.current?.close();
      console.log("Disconnected from Websocket");
    }
  }, [isConnected]);

  return (
    <div className="App">
      <button onClick={handleClick}>Fetch Orders</button>
      <div>Data from API Gateway (GET REST API)</div>
      <div>{JSON.stringify(ordersData)}</div>
      <br></br>
      <button onClick={onConnect}>Connect to WebSocket</button>
      <button onClick={onDisconnect}>Disconnect from WebSocket</button>
      <div>Data from Websocket API Gateway (onmessage)</div>
      <div>{JSON.stringify(messageList)}</div>
    </div>
  );
};

export default App;
