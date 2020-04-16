import {
  Avatar,
  Box,
  Chip,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
  useTheme,
  Modal,
  Backdrop,
  Fade
} from "@material-ui/core";
import MuiAlert, { AlertProps } from "@material-ui/lab/Alert";

import MoreVertIcon from "@material-ui/icons/MoreVert";
import HostIcon from "@material-ui/icons/Router";
import { getSnapshot } from "mobx-keystone";
import { observer } from "mobx-react";
import { useSnackbar } from "notistack";

// @ts-ignore
import randomColor from "random-material-color";
//@ts-ignore
import { CopyToClipboard } from "react-copy-to-clipboard";

import React from "react";
import GameCanvas from "../components/game/GameCanvas";
import AddEntityModal from "../components/modals/AddEntityModal";
import LoadGameModal from "../components/modals/LoadGameModal";
import { useStore } from "../stores/RootStore";
import { ContextMenuItem } from "../types";
import JoinGameModal from "../components/modals/JoinGameModal";
import { autorun, reaction } from "mobx";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    height: "100%"
  },
  chat: {
    flex: 1
  },
  messages: {
    minHeight: 100
  },
  chip: {
    marginBottom: theme.spacing(1)
  },
  loadingModal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
}));

const PlayersTable = observer(() => {
  const { gameStore } = useStore();
  const { gameState } = gameStore;
  const theme = useTheme();

  const classes = useStyles();
  const snackbar = useSnackbar();

  return (
    <Box
      zIndex={1}
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
    >
      {gameStore.isHost && (
        <CopyToClipboard
          text={gameStore.gameServer?.peerId}
          onCopy={() => snackbar.enqueueSnackbar("Game ID copied to clipboard")}
        >
          <Chip
            className={classes.chip}
            clickable
            icon={<HostIcon />}
            label={"You are hosting"}
          />
        </CopyToClipboard>
      )}
      {gameState.connectedPlayers.map((player, i) => {
        const color = randomColor.getColor({ text: player.userId });
        return (
          <Chip
            key={i}
            className={classes.chip}
            clickable
            avatar={
              <Avatar
                style={{
                  color: theme.palette.getContrastText(color),
                  backgroundColor: color
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </Avatar>
            }
            label={`${player.name} ${
              gameStore.player === player ? " (You)" : ""
            }`}
          />
        );
      })}
    </Box>
  );
});

const Chat = observer(() => {
  const [message, setMessage] = React.useState("");
  const { gameStore } = useStore();
  const { player, gameState } = gameStore;

  const classes = useStyles();

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.which === 13) {
      gameState.addMessage(`${player.name}: ${message}`);
      setMessage("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        flex: 1,
        overflowY: "auto",
        height: 400
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}></div>
        {gameState.chatHistory.map((message, i) => (
          <Typography key={i} variant="body2">
            {message}
          </Typography>
        ))}
      </div>
      <div>
        <TextField
          fullWidth
          value={message}
          placeholder="Type something"
          onChange={event => setMessage(event.target.value)}
          onKeyPress={handleKeyPress}
        ></TextField>
      </div>
    </div>
  );
});

export default observer(() => {
  const { gameStore } = useStore();
  const { gameState } = gameStore;

  const theme = useTheme();
  const [
    topMenuAnchorEl,
    setTopMenuAnchorEl
  ] = React.useState<null | HTMLElement>(null);

  const [contextMenu, setContextMenu] = React.useState<{
    position: {
      x: number;
      y: number;
    };
    items: ContextMenuItem[];
  } | null>(null);

  const [loadGameModalOpen, setLoadGameModalOpen] = React.useState(false);
  const [addEntityModalOpen, setAddEntityModalOpen] = React.useState(false);
  const [joinGameModalOpen, setJoinGameModalOpen] = React.useState(false);

  const handleTopMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setTopMenuAnchorEl(event.currentTarget);
  };

  const handleTopMenuClose = () => {
    setTopMenuAnchorEl(null);
  };

  const handleTopMenuSelect = (action: () => void) => {
    handleTopMenuClose();
    action();
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuSelect = (action: () => void) => {
    handleContextMenuClose();
    action();
  };

  const handleSaveGame = () => {
    const gameStateJson = getSnapshot(gameState);
    const blob = new Blob([JSON.stringify(gameStateJson)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `game.json`;
    a.click();
  };

  const handleContextMenu = (
    event: React.MouseEvent<HTMLDivElement>,
    items: ContextMenuItem[] | null
  ) => {
    setContextMenu({
      position: {
        x: event.clientX - 2,
        y: event.clientY - 4
      },
      items: items
        ? items
        : [
            {
              label: "Add entity",
              action: () =>
                handleContextMenuSelect(() => setAddEntityModalOpen(true))
            }
          ]
    });
  };

  const snackbar = useSnackbar();

  React.useEffect(() => {
    gameStore.createGame();
    autorun(() => {
      gameStore.connectionError &&
        snackbar.enqueueSnackbar(gameStore.connectionError, {
          variant: "error",
          preventDuplicate: true
        });
      gameStore.connectionError = null;
    });
  }, []);

  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <GameCanvas onContextMenu={handleContextMenu} />
      <Box
        zIndex={1}
        width={250}
        position="absolute"
        top={theme.spacing(1)}
        left={theme.spacing(1)}
        display="flex"
        flexDirection="column"
      >
        <PlayersTable />
        <Chat />
      </Box>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleTopMenuClick}
        style={{
          position: "absolute",
          top: theme.spacing(1),
          right: theme.spacing(1)
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={topMenuAnchorEl}
        keepMounted
        open={topMenuAnchorEl !== null}
        onClose={handleTopMenuClose}
      >
        <MenuItem
          onClick={() => handleTopMenuSelect(() => setJoinGameModalOpen(true))}
        >
          Join game
        </MenuItem>
        <MenuItem
          onClick={() => handleTopMenuSelect(() => setLoadGameModalOpen(true))}
        >
          Load game
        </MenuItem>
        <MenuItem onClick={() => handleTopMenuSelect(() => handleSaveGame())}>
          Save game
        </MenuItem>
      </Menu>
      <Menu
        onContextMenu={event => {
          event.preventDefault();
          // handleContextMenu(event);
        }}
        keepMounted
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.position.y, left: contextMenu.position.x }
            : undefined
        }
      >
        {contextMenu?.items.map(item => (
          <MenuItem onClick={() => handleContextMenuSelect(item.action)}>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
      <LoadGameModal
        open={loadGameModalOpen}
        handleClose={() => setLoadGameModalOpen(false)}
      />
      <AddEntityModal
        open={addEntityModalOpen}
        handleClose={() => setAddEntityModalOpen(false)}
      />
      <JoinGameModal
        open={joinGameModalOpen}
        handleClose={() => setJoinGameModalOpen(false)}
      />
      <Backdrop className={classes.loadingModal} open={gameStore.isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
});
