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
  Input,
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
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
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
import Entity, { EntityType } from "../models/game/Entity";
import Deck from "../models/game/Deck";
import Card from "../models/game/Card";
import AddEntityModal from "../components/modals/AddEntityModal";
import LoadGameModal from "../components/modals/LoadGameModal";
import { ContextMenuItem } from "../types";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    height: "100%"
  },
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: 300
  },
  bottomBar: {
    height: 300
  },
  chat: {
    flex: 1
  },
  selectEmpty: {
    marginTop: theme.spacing(2)
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

  let { id: gameId } = useParams();

  React.useEffect(() => {
    gameStore.createOrJoinGame(gameId);
  }, [gameId]);

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
          onClick={() => handleTopMenuSelect(() => setLoadGameModalOpen(true))}
        >
          Load game
        </MenuItem>
        <MenuItem onClick={() => {}}>Save game</MenuItem>
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
    </Box>
  );
});
