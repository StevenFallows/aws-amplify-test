import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
const REST_ENDPOINT =
  "https://11nfsd5x34.execute-api.us-east-2.amazonaws.com/default/messages?TableName=FIX-messages-test";
const AWS_WEBSOCKET_URL =
  "wss://bpugc3rkcj.execute-api.us-east-2.amazonaws.com/dev";


interface Message {
  id: string;
  message: string
}

const App = () => {
  const [ordersData, setOrdersData] = useState(new Set<any>([]));
  const [isConnected, setIsConnected] = useState(false);
  const awsWs = useRef<WebSocket | null>(null);
  const [awsMessageList, setAWSMessageList] = useState([]);

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

  const onAWSSocketOpen = useCallback(() => {
    setIsConnected(true);
  }, []);

  const onAWSSocketClose = useCallback(() => {
    setIsConnected(false);
  }, []);

  const onAWSSocketMessage = useCallback((data: any) => {
    const parsedData = JSON.parse(data);
    setAWSMessageList((awsMessageList) => [
      ...awsMessageList,
      {
        id: parsedData.id.S,
        message: parsedData.message.S,
      },
    ]);
  }, []);

  const onConnect = useCallback(() => {
    if (awsWs.current?.readyState !== WebSocket.OPEN) {
      awsWs.current = new WebSocket(AWS_WEBSOCKET_URL);
      awsWs.current?.addEventListener("open", onAWSSocketOpen);
      awsWs.current?.addEventListener("close", onAWSSocketClose);
      awsWs.current?.addEventListener("message", (event) => {
        onAWSSocketMessage(event.data);
      });
    }
    console.log("Connected to Websocket");
  }, []);

  useEffect(() => {
    return () => {
      awsWs.current?.close();
    };
  }, []);

  const onDisconnect = useCallback(() => {
    if (isConnected) {
      awsWs.current?.close();
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
      <div>Data from AWS Websocket API Gateway (onmessage)</div>
      <div>{JSON.stringify(awsMessageList)}</div>
      <br></br>
      <div>Data from Websocket Server on SpringBoot application</div>
    </div>
  );
};

export default App;
