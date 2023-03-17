import { fetchEventSource } from "@microsoft/fetch-event-source";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
const REST_ENDPOINT =
  "https://11nfsd5x34.execute-api.us-east-2.amazonaws.com/default/messages?TableName=FIX-messages-test";
const AWS_WEBSOCKET_URL =
  "wss://bpugc3rkcj.execute-api.us-east-2.amazonaws.com/dev";
const SPRINGBOOT_STREAMING_REST_ENDPOINT = "http://localhost:8080/messages/new";

const App = () => {
  const [messagesList, setMessagesList] = useState([]);
  const [isAwsWsConnected, setIsAwsWsConnected] = useState(false);
  const awsWs = useRef();
  const [awsMessageList, setAWSMessageList] = useState([]);
  const [sbStreamingMessageList, setSbStreamingMessageList] = useState([]);

  const handleClick = async (e) => {
    e.preventDefault();
    axios
      .get(REST_ENDPOINT)
      .then((response) => {
        setMessagesList(response.data);
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

  const onAWSSocketMessage = useCallback((data) => {
    const parsedData = JSON.parse(data);
    setAWSMessageList((awsMessageList) => [
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
    };
  }, []);

  const onAwsWsDisconnect = useCallback(() => {
    if (isAwsWsConnected) {
      awsWs.current?.close();
      console.log("Disconnected from AWS WebSocket");
    }
  }, [isAwsWsConnected]);

  const handleStreamingClick = async () => {
    await fetchEventSource(SPRINGBOOT_STREAMING_REST_ENDPOINT, {
      method: "GET",
      headers: {
        Accept: "application/stream+json",
      },
      onopen(res) {
        if (res.ok && res.status === 200) {
          console.log("Connection made ", res);
        } else if (
          res.status >= 400 &&
          res.status < 500 &&
          res.status !== 429
        ) {
          console.log("Client side error ", res);
        }
      },
      onmessage(event) {
        const parsedData = event.data;
        console.log(parsedData);
        if (parsedData.length !== 0) {
          console.log("gets in here");
          setSbStreamingMessageList((data) => {
            const array = [...data, parsedData];
            const uniqueSet = new Set(array);
            return Array.from(uniqueSet);
          });
        }
      },
      onclose() {
        console.log("Connection closed by the server");
      },
      onerror(err) {
        console.log("There was an error from server", err);
      },
    });
  };
  return (
    <div className="App">
      <button onClick={handleClick}>Fetch Messages</button>
      <div>Data from API Gateway (GET REST API)</div>
      <div>{JSON.stringify(messagesList)}</div>
      <br></br>
      <button onClick={onAwsWsConnect}>Connect to AWS WebSocket</button>
      <button onClick={onAwsWsDisconnect}>Disconnect from AWS WebSocket</button>
      <div>Data from AWS Websocket API Gateway (onmessage)</div>
      <div>{JSON.stringify(awsMessageList)}</div>
      <br></br>
      <button onClick={handleStreamingClick}>
        Fetch realtime streaming orders from SpringBoot
      </button>
      <div>Data from Streaming REST API on SpringBoot</div>
      <div>{sbStreamingMessageList}</div>
    </div>
  );
};

export default App;
