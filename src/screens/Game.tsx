import {
  Container,
  Divider,
  Grid,
  Link,
  makeStyles,
  Paper,
  Chip,
  TextField,
  Typography,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Avatar,
  useTheme,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";

// @ts-ignore
import isUrl from "is-url";

// @ts-ignore
import randomColor from "random-material-color";

import { observer } from "mobx-react";
import React from "react";
import { useParams, useHistory } from "react-router-dom";
import GameCanvas from "../components/game/GameCanvas";
import Player from "../models/Player";
import { useStore } from "../stores/RootStore";

const drawerWidth = 250;

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    height: "100%"
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  },
  drawer: {
    width: drawerWidth
    // flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: "rgba(0,0,0,0.1)"
  },
  drawerContainer: {
    backgroundColor: "transparent"
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3)
  },
  gui: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  gridItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch"
  },
  sidebar: {
    maxWidth: 400,
    minWidth: 300
  },
  bottomBar: {
    height: 300
  },
  chat: {
    flex: 1
  },
  hand: {
    // width: "100%",
    // height: "100%"
  },
  messages: {
    minHeight: 100
  },
  table: {}
}));

const PlayersTable = observer(() => {
  const { gameStore } = useStore();
  const { gameState } = gameStore;
  const theme = useTheme();

  const classes = useStyles();

  return (
    <div style={{ zIndex: 1 }}>
      {gameState.players.map((player, i) => {
        const color = randomColor.getColor({ text: player.id });
        return (
          <Chip
            key={i}
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
            label={player.name}
          />
        );
      })}
    </div>
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
        zIndex: 1
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

type LoadGameDialogProps = {
  open: boolean;
  handleClose: () => void;
};

const LoadGameDialog = observer(
  ({ open, handleClose }: LoadGameDialogProps) => {
    const { gameStore } = useStore();
    const [error, setError] = React.useState("");

    const urlFieldRef = React.useRef<HTMLInputElement>();

    const handleLoadClick = async () => {
      const url = urlFieldRef.current!.value;

      if (!isUrl(url)) {
        setError("Invalid URL");
        return;
      }

      try {
        await gameStore.loadGameFromUrl(url);
      } catch (err) {
        setError(err.message);
      }
    };

    return (
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="load-game-dialog-title"
      >
        <DialogTitle id="load-game-dialog-title">Load game</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Load a game from a definition json file.
          </DialogContentText>
          <TextField
            inputRef={urlFieldRef}
            autoFocus
            margin="dense"
            id="url"
            placeholder="URL"
            type="url"
            fullWidth
            error={error.length > 0}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLoadClick} color="primary">
            Load
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

const options = ["Load game", "Save game"];

export default observer(() => {
  const { gameStore } = useStore();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [loadGameDialogOpen, setLoadGameDialogOpen] = React.useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (optionIndex: number) => {
    if (optionIndex === 0) {
      setLoadGameDialogOpen(true);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  let { id: gameId } = useParams();

  React.useEffect(() => {
    gameStore.createOrJoinGame(gameId);
  }, [gameId]);

  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <GameCanvas />
      <div
        style={{
          top: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            flexGrow: 1
          }}
        >
          <div
            style={{
              // zIndex: 1,
              width: 250,
              padding: theme.spacing(1),
              display: "flex",
              flexDirection: "column"
            }}
          >
            <PlayersTable />
            <Chat />
          </div>
          <div
            style={{
              flexGrow: 1
            }}
          >
            <IconButton
              aria-label="more"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
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
              anchorEl={anchorEl}
              keepMounted
              open={open}
              onClose={handleMenuClose}
            >
              {options.map((option, i) => (
                <MenuItem key={option} onClick={() => handleMenuItemClick(i)}>
                  {option}
                </MenuItem>
              ))}
            </Menu>
          </div>
          <div
            style={{
              width: 250
            }}
          ></div>
        </div>
      </div>
      <LoadGameDialog
        open={loadGameDialogOpen}
        handleClose={() => setLoadGameDialogOpen(false)}
      />
    </Box>
  );
});
