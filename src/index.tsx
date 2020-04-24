import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { rootStore } from "./stores/RootStore";
import { SnackbarContent, Button } from "@material-ui/core";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

const render = (Component: any) => {
  return ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root")
  );
};

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register({
  onUpdate: registration => {
    rootStore.uiState.showMessage({
      text: "New version available",
      options: {
        persist: true,
        action: (
          <Button
            onClick={() => {
              if (registration && registration.waiting) {
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
              }
              window.location.reload();
            }}
          >
            Update
          </Button>
        )
      }
    });
  }
});

// if (module.hot) {
//   module.hot.accept("./App", () => {
//     const NextApp = require("./App").default;
//     render(NextApp);
//   });
// }
