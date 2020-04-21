import { Box, TextField, Typography } from "@material-ui/core";
import { observer } from "mobx-react";
import React from "react";
import { useStore } from "../stores/RootStore";

export default observer(() => {
  const [message, setMessage] = React.useState("");
  const { gameStore } = useStore();
  const { player, gameState } = gameStore;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.which === 13) {
      gameState.addMessage(`${player.name}: ${message}`);
      setMessage("");
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        flex: 1,
        overflowY: "auto",
        height: 400
      }}
    >
      <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box style={{ flex: 1 }}></Box>
        {gameState.chatHistory.map((message, i) => (
          <Typography key={i} variant="body2">
            {message}
          </Typography>
        ))}
      </Box>
      <Box>
        <TextField
          fullWidth
          value={message}
          placeholder="Type something"
          onChange={e => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        ></TextField>
      </Box>
    </Box>
  );
});
