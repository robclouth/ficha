import {
  Avatar,
  Backdrop,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
  TextField,
  Typography,
  useTheme,
  ListItemIcon
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import UndoIcon from "@material-ui/icons/Undo";
import RedoIcon from "@material-ui/icons/Redo";
import HostIcon from "@material-ui/icons/Router";
import EditIcon from "@material-ui/icons/Edit";
import VideocamIcon from "@material-ui/icons/Videocam";
import DeleteIcon from "@material-ui/icons/Delete";
import { autorun } from "mobx";
import { getSnapshot } from "mobx-keystone";
import { observer } from "mobx-react";
import { useSnackbar } from "notistack";
import { useParams, useHistory } from "react-router";
// @ts-ignore
import EventListener from "react-event-listener";
// @ts-ignore
import randomColor from "random-material-color";
import React, { useCallback, useEffect, useState } from "react";
//@ts-ignore
import { CopyToClipboard } from "react-copy-to-clipboard";
import { PointerEvent } from "react-three-fiber";
import GameCanvas from "../components/game/GameCanvas";
import EditEntityModal from "../components/modals/EditEntityModal";
import JoinGameModal from "../components/modals/JoinGameModal";
import ImportGameModal from "../components/modals/ImportGameModal";
import { useStore } from "../stores/RootStore";
import { ContextMenuItem } from "../types";
import Entity from "../models/game/Entity";
import GameSettingsModal from "../components/modals/GameSettingsModal";
import EntityLibraryModal from "../components/modals/EntityLibraryModal";
import RulesModal from "../components/modals/RulesModal";
import HandArea from "../models/game/HandArea";
import NestedMenuItem from "../components/NestedMenuItem";
import EditSetupModal from "../components/modals/EditSetupModal";
import HelpModal from "../components/modals/HelpModal";
import GameLibraryModal from "../components/modals/GameLibraryModal";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    height: "100%"
  },
  chip: {
    marginBottom: theme.spacing(1)
  },
  loadingModal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  contextMenu: {
    pointerEvents: "none",
    "& .MuiPaper-root": {
      pointerEvents: "auto"
    }
  }
}));

const PlayersList = observer(() => {
  const { gameStore } = useStore();
  const { gameState } = gameStore;
  const theme = useTheme();

  const classes = useStyles();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  return (
    <Box
      position="absolute"
      top={theme.spacing(1)}
      right={theme.spacing(1)}
      zIndex={1}
      display="flex"
      flexDirection="column"
      alignItems="flex-end"
    >
      {gameStore.isHost && (
        <CopyToClipboard
          text={gameStore.gameServer?.peerId}
          onCopy={() => {
            const key = enqueueSnackbar("Game ID copied to clipboard", {
              onClick: () => closeSnackbar(key)
            });
          }}
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
        const color = "#" + player.color.getHexString();
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
              gameStore.thisPlayer === player ? " (You)" : ""
            }`}
            deleteIcon={<EditIcon fontSize="small" />}
            onDelete={gameStore.thisPlayer === player ? () => {} : undefined}
          />
        );
      })}
    </Box>
  );
});

const ViewList = observer(() => {
  const { gameStore, uiState } = useStore();
  const { gameState } = gameStore;
  const theme = useTheme();

  const classes = useStyles();

  const handArea = gameStore.thisPlayer.handArea;

  return (
    <Box
      position="absolute"
      bottom={theme.spacing(1)}
      right={theme.spacing(1)}
      zIndex={1}
      display="flex"
      flexDirection="column"
      alignItems="flex-end"
    >
      <Chip
        onClick={() => gameState.addView()}
        className={classes.chip}
        clickable
        avatar={
          <Avatar>
            <VideocamIcon fontSize="small" />
          </Avatar>
        }
        label={"Add view"}
      />
      {handArea && (
        <Chip
          onClick={() => uiState.activateView("hand")}
          className={classes.chip}
          clickable
          avatar={
            <Avatar
              style={{
                backgroundColor:
                  uiState.activeView === "hand"
                    ? theme.palette.secondary.light
                    : theme.palette.action.selected
              }}
            >
              {"1"}
            </Avatar>
          }
          label={"Hand"}
        />
      )}
      {gameState.views.map((view, i) => {
        return (
          <Chip
            key={i}
            onClick={() => uiState.activateView(view)}
            className={classes.chip}
            clickable
            avatar={
              <Avatar
                style={{
                  backgroundColor:
                    uiState.activeView === view
                      ? theme.palette.secondary.light
                      : theme.palette.action.selected
                }}
              >
                {i + (handArea ? 2 : 1)}
              </Avatar>
            }
            label={view.name}
            onDelete={() => gameState.removeView(view)}
          />
        );
      })}
    </Box>
  );
});

enum Modals {
  EditEntity,
  EntityLibrary,
  GameSettings,
  ImportGame,
  JoinGame,
  Rules,
  EditSetup,
  GameLibrary,
  Help
}

export default observer(() => {
  const { gameStore, uiState } = useStore();
  const { contextMenu, isContextMenuOpen, canUndo, canRedo } = uiState;

  const { gameState } = gameStore;

  const { game } = useParams();
  const history = useHistory();

  const theme = useTheme();
  const [topMenuAnchorEl, setTopMenuAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const [openModal, setOpenModal] = useState<Modals | undefined>(
    Modals.GameLibrary
  );

  const handleTopMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    setTopMenuAnchorEl(e.currentTarget);
  };

  const handleTopMenuClose = () => {
    setTopMenuAnchorEl(null);
  };

  const handleTopMenuSelect = (action: () => void) => {
    handleTopMenuClose();
    action();
  };

  const handleContextMenuClose = () => {
    uiState.closeContextMenu();
  };

  const handleContextMenuSelect = (item: ContextMenuItem) => {
    handleContextMenuClose();

    if (item.type === "action") {
      uiState.doContextMenuAction(item);
    } else if (item.type === "edit") {
      setOpenModal(Modals.EditEntity);
    }
  };

  const handleExportGame = () => {
    gameStore.exportGame();
  };

  if (contextMenu && !contextMenu.items) {
    contextMenu.items = [
      {
        label: "New object",
        type: "action",
        action: () => {
          setOpenModal(Modals.EditEntity);

          handleContextMenuClose();
        }
      },
      {
        label: "Add object from library",
        type: "action",
        action: () => {
          setOpenModal(Modals.EntityLibrary);
          handleContextMenuClose();
        }
      },
      {
        label: "Add hand area",
        type: "action",
        action: () => {
          gameState.addEntity(
            new HandArea({
              position: {
                x: contextMenu.positionGroundPlane[0],
                y: 0,
                z: contextMenu.positionGroundPlane[1]
              }
            })
          );

          handleContextMenuClose();
        }
      }
    ];
  }

  const snackbar = useSnackbar();

  useEffect(() => {
    if (!game) gameStore.createGame();
    else gameStore.joinGame(game);
    autorun(() => {
      uiState.snackbarMessage &&
        snackbar.enqueueSnackbar(
          uiState.snackbarMessage.text,
          uiState.snackbarMessage.options
        );
    });
  }, []);

  const handleModalClose = useCallback(() => {
    setOpenModal(undefined);
  }, []);

  const classes = useStyles();

  return (
    <Box className={classes.root} onClick={handleContextMenuClose}>
      <GameCanvas />
      <PlayersList />
      <ViewList />
      <Box
        position="absolute"
        top={theme.spacing(1)}
        left={0}
        right={0}
        display="flex"
        justifyContent="center"
        style={{ pointerEvents: "none" }}
      >
        <Chip
          style={{ pointerEvents: "auto" }}
          onClick={() => setOpenModal(Modals.GameSettings)}
          clickable
          label={"Setups"}
        />
        <Chip
          style={{ pointerEvents: "auto" }}
          onClick={() => setOpenModal(Modals.GameSettings)}
          clickable
          label={gameState.name}
          deleteIcon={<EditIcon fontSize="small" />}
          onDelete={() => setOpenModal(Modals.GameSettings)}
        />
        <Chip
          style={{ pointerEvents: "auto" }}
          onClick={() => setOpenModal(Modals.GameSettings)}
          clickable
          label={"Rules"}
        />
      </Box>
      <Box
        position="absolute"
        bottom={theme.spacing(1)}
        left={theme.spacing(1)}
        display="flex"
        zIndex={2}
      >
        <IconButton
          aria-label="undo"
          onClick={() => uiState.undo()}
          disabled={!canUndo}
          style={{ marginRight: theme.spacing(1) }}
        >
          <UndoIcon />
        </IconButton>
        <IconButton
          aria-label="redo"
          onClick={() => uiState.redo()}
          disabled={!canRedo}
        >
          <RedoIcon />
        </IconButton>
      </Box>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleTopMenuClick}
        style={{
          position: "absolute",
          top: theme.spacing(1),
          left: theme.spacing(1)
        }}
      >
        <MoreVertIcon />
      </IconButton>
      {/* <Box
        position="absolute"
        bottom={theme.spacing(1)}
        right={theme.spacing(1)}
        display="flex"
        flexDirection="column"
        zIndex={2}
      >
        <IconButton
          aria-label="cam1"
          onClick={() => uiState.toggleView(0)}
          style={{ marginRight: theme.spacing(1) }}
        >
          <VideocamIcon />
        </IconButton>
        <IconButton aria-label="cam2" onClick={() => uiState.toggleView(1)}>
          <VideocamIcon />
        </IconButton>
      </Box> */}
      <Menu
        id="long-menu"
        anchorEl={topMenuAnchorEl}
        keepMounted
        open={topMenuAnchorEl !== null}
        onClose={handleTopMenuClose}
      >
        <MenuItem
        // onClick={() => handleTopMenuSelect(() => gameStore.newGame())}
        >
          New game
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleTopMenuSelect(() => setOpenModal(Modals.GameLibrary))
          }
        >
          Open game
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleTopMenuSelect(() => setOpenModal(Modals.JoinGame))
          }
        >
          Join game
        </MenuItem>
        {/* <MenuItem
          onClick={() =>
            handleTopMenuSelect(() => setOpenModal(Modals.ImportGame))
          }
        >
          Import
        </MenuItem>
        <MenuItem onClick={() => handleTopMenuSelect(() => handleExportGame())}>
          Export
        </MenuItem> */}
        <MenuItem
          onClick={() => handleTopMenuSelect(() => setOpenModal(Modals.Rules))}
        >
          Game rules
        </MenuItem>
        <NestedMenuItem
          label="Setups"
          rightSide={true}
          parentMenuOpen={topMenuAnchorEl !== null ? true : false}
        >
          <MenuItem
            onClick={() =>
              handleTopMenuSelect(() => setOpenModal(Modals.EditSetup))
            }
          >
            Add setup
          </MenuItem>
          {gameState.setups.map((setup, i) => (
            <MenuItem
              key={i}
              style={{ display: "flex", justifyContent: "space-between" }}
              onClick={() =>
                handleTopMenuSelect(() => gameState.activateSetup(setup))
              }
            >
              {`${setup.name} (${setup.numPlayers} players)`}
              <IconButton onClick={() => gameState.removeSetup(setup)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </MenuItem>
          ))}
        </NestedMenuItem>
        <MenuItem
          onClick={() => handleTopMenuSelect(() => setOpenModal(Modals.Help))}
        >
          Help
        </MenuItem>
      </Menu>
      <Menu
        keepMounted
        className={classes.contextMenu}
        open={isContextMenuOpen}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? {
                top: contextMenu?.positionScreen[1],
                left: contextMenu?.positionScreen[0]
              }
            : undefined
        }
      >
        {contextMenu?.items
          ?.filter(item => item)
          .map((item, i) => (
            <MenuItem
              key={i}
              onClick={() => handleContextMenuSelect(item as ContextMenuItem)}
            >
              {(item as ContextMenuItem).label}
            </MenuItem>
          ))}
        <EventListener target="window" onResize={handleContextMenuClose} />
      </Menu>
      {openModal === Modals.ImportGame && (
        <ImportGameModal
          open={openModal === Modals.ImportGame}
          handleClose={() => setOpenModal(undefined)}
        />
      )}
      {openModal === Modals.EditEntity && (
        <EditEntityModal
          open={openModal === Modals.EditEntity}
          positionGroundPlane={contextMenu?.positionGroundPlane}
          entity={contextMenu?.target as Entity}
          handleClose={handleModalClose}
        />
      )}
      {openModal === Modals.EntityLibrary && (
        <EntityLibraryModal
          open={openModal === Modals.EntityLibrary}
          positionGroundPlane={contextMenu?.positionGroundPlane}
          handleClose={handleModalClose}
        />
      )}
      {openModal === Modals.JoinGame && (
        <JoinGameModal
          open={openModal === Modals.JoinGame}
          handleClose={handleModalClose}
        />
      )}
      {openModal === Modals.GameSettings && (
        <GameSettingsModal
          open={openModal === Modals.GameSettings}
          handleClose={handleModalClose}
        />
      )}
      {openModal === Modals.Rules && (
        <RulesModal
          open={openModal === Modals.Rules}
          handleClose={handleModalClose}
        />
      )}
      {openModal === Modals.EditSetup && (
        <EditSetupModal
          open={openModal === Modals.EditSetup}
          handleClose={handleModalClose}
        />
      )}
      {openModal === Modals.Help && (
        <HelpModal
          open={openModal === Modals.Help}
          handleClose={handleModalClose}
        />
      )}
      {openModal === Modals.GameLibrary && (
        <GameLibraryModal
          open={openModal === Modals.GameLibrary}
          handleClose={handleModalClose}
        />
      )}
      <Backdrop className={classes.loadingModal} open={gameStore.isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
});
