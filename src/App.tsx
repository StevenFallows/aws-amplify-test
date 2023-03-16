import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
const REST_ENDPOINT =
  "https://11nfsd5x34.execute-api.us-east-2.amazonaws.com/default/messages?TableName=FIX-messages-test";
const AWS_WEBSOCKET_URL =
  "wss://bpugc3rkcj.execute-api.us-east-2.amazonaws.com/dev";
const SPRINGBOOT_WEBSOCKET_URL = "ws://localhost:8080/ws/messages";

interface Message {
  id: string;
  message: string
}

const App = () => {
  const [ordersData, setOrdersData] = useState(new Set<any>([]));
  const [isAwsWsConnected, setIsAwsWsConnected] = useState(false);
  const awsWs = useRef<WebSocket | null>(null);
  const [awsMessageList, setAWSMessageList] = useState<any[]>([]);
  const [isSbWsConnected, setIsSbWsConnected] = useState(false);
  const sbWs = useRef<WebSocket | null>(null);
  const [sbMessageList, setSbMessageList] = useState<any>([]);

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
    setIsAwsWsConnected(true);
  }, []);

  const onAWSSocketClose = useCallback(() => {
    setIsAwsWsConnected(false);
  }, []);

  const onAWSSocketMessage = useCallback((data: any) => {
    const parsedData = JSON.parse(data);
    setAWSMessageList((awsMessageList: any) => [
      ...awsMessageList,
      {
        id: parsedData.id.S,
        message: parsedData.message.S,
      },
    ]);
  }, []);

  const onAwsWsConnect = useCallback(() => {
    if (awsWs.current?.readyState !== WebSocket.OPEN) {
      awsWs.current = new WebSocket(AWS_WEBSOCKET_URL);
      awsWs.current?.addEventListener("open", onAWSSocketOpen);
      awsWs.current?.addEventListener("close", onAWSSocketClose);
      awsWs.current?.addEventListener("message", (event) => {
        onAWSSocketMessage(event.data);
      });
    }
    console.log("Connected to AWS WebSocket");
  }, []);

  useEffect(() => {
    return () => {
      awsWs.current?.close();
      sbWs.current?.close();
    };
  }, []);

  const onAwsWsDisconnect = useCallback(() => {
    if (isAwsWsConnected) {
      awsWs.current?.close();
      console.log("Disconnected from AWS WebSocket");
    }
  }, [isAwsWsConnected]);

  const onSbSocketOpen = useCallback(() => {
    setIsSbWsConnected(true);
  }, []);

  const onSbSocketClose = useCallback(() => {
    setIsSbWsConnected(false);
  }, []);

  const onSbSocketMessage = useCallback((data: any) => {
    const parsedData = JSON.parse(data);
    setSbMessageList((sbMessageList: any) => [
      ...sbMessageList,
      {
        data
      },
    ]);
  }, []);

  const onSbWsConnect = useCallback(() => {
    if (sbWs.current?.readyState !== WebSocket.OPEN) {
      awsWs.current = new WebSocket(SPRINGBOOT_WEBSOCKET_URL);
      awsWs.current?.addEventListener("open", onSbSocketOpen);
      awsWs.current?.addEventListener("close", onSbSocketClose);
      awsWs.current?.addEventListener("message", (event) => {
        onSbSocketMessage(event.data);
      });
    }
    console.log("Connected to SpringBoot WebSocket");
  }, []);

  const onSbWsDisconnect = useCallback(() => {
    if (isSbWsConnected) {
      sbWs.current?.close();
      console.log("Disconnected from SpringBoot WebSocket");
    }
  }, [isSbWsConnected]);

  return (
    <div className="App">
      <button onClick={handleClick}>Fetch Orders</button>
      <div>Data from API Gateway (GET REST API)</div>
      <div>{JSON.stringify(ordersData)}</div>
      <br></br>
      <button onClick={onAwsWsConnect}>Connect to AWS WebSocket</button>
      <button onClick={onAwsWsDisconnect}>Disconnect from AWS WebSocket</button>
      <div>Data from AWS Websocket API Gateway (onmessage)</div>
      <div>{JSON.stringify(awsMessageList)}</div>
      <br></br>
      <button onClick={onSbWsConnect}>Connect to SpringBoot WebSocket</button>
      <button onClick={onSbWsDisconnect}>Disconnect from SpringBoot WebSocket</button>
      <div>Data from Websocket Server on SpringBoot application</div>
      <div>{JSON.stringify(sbMessageList)}</div>
    </div>
  );
};

export default App;
