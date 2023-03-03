import axios from "axios";
import { useState } from "react";
import "./App.css";
const App = () => {
  const [ordersData, setOrdersData] = useState([]);

  const handleClick = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    axios
      .get(
        "https://11nfsd5x34.execute-api.us-east-2.amazonaws.com/default/messages?TableName=FIX-messages-test"
      )
      .then((response) => {
        setOrdersData(response.data);
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div className="App">
      <button onClick={handleClick}>Fetch Orders</button>
      <div>{JSON.stringify(ordersData)}</div>
    </div>
  );
};

export default App;
