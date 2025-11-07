import React, { useState, useEffect } from "react";
import BillingAppLayout from "./BillingAppLayout";
import LoginPage from "./LoginPage";

export default function App() {
  const [user, setUser] = useState(null);


 useEffect(() => {
  if (window.chrome?.webview) {
    const handler = (event) => {
      let msg = event.data;
      console.log("📩 Raw message:", msg);

      // Parse JSON if it’s a string
      if (typeof msg === "string") {
        try {
          msg = JSON.parse(msg);
        } catch {
          console.warn("Non-JSON string message:", msg);
          return;
        }
      }

      // ✅ Handle based on type
      switch (msg.Type) {
        case "AddItem":
          if (msg.Status === "Success") 
            {/*alert("✅ Item added!");*/}
          break;

        case "GetItems":
          console.log("📊 Items:", msg.Data);
          // setItems(msg.Data);
          break;

        default:
          console.log("ℹ️ Unknown message:", msg);
          break;
      }
    };

    window.chrome.webview.addEventListener("message", handler);
    return () => window.chrome.webview.removeEventListener("message", handler);
  }
}, []);


  // ✅ Function to send data to C# (React → C#)
  const sendToCSharp = (action, payload) => {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({ Action: action, Payload: payload });
      console.log("📤 Sent to C#: ", { Action: action, Payload: payload });
    } else {
      console.warn("⚠️ WebView2 bridge not available");
    }
  };

  // Example usage (you can pass this down to your layout)
  const handleAddItem = (itemData) => {
    sendToCSharp("AddItem", itemData);
  };


  // ✅ Called when user logs in successfully
  const handleLogin = (userData) => {
    console.log("User logged in:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // ✅ Called when user clicks Logout
  const handleLogout = () => {
    console.log("Logging out...");
    setUser(null);
  };

  // ✅ Conditional rendering
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ✅ Pass `onLogout` as prop
  return (
    <BillingAppLayout
      key={user?.email || "guest"}
      user={user}
      onLogout={handleLogout}
      sendToCSharp={sendToCSharp} // <-- 👈 add this
      
    />
  );
}
