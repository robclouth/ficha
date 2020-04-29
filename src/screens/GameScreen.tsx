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
  useTheme
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import RedoIcon from "@material-ui/icons/Redo";
import HostIcon from "@material-ui/icons/Router";
import UndoIcon from "@material-ui/icons/Undo";
import VideocamIcon from "@material-ui/icons/Videocam";
import { autorun } from "mobx";
import { observer } from "mobx-react";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useState } from "react";
//@ts-ignore
import { CopyToClipboard } from "react-copy-to-clipboard";
// @ts-ignore
import EventListener from "react-event-listener";
import { useHistory, useParams } from "react-router";
import GameCanvas from "../components/game/GameCanvas";
import AboutGameModal from "../components/modals/AboutGameModal";
import EditEntityModal from "../components/modals/EditEntityModal";
import EditSetupModal from "../components/modals/EditSetupModal";
import EntityLibraryModal from "../components/modals/EntityLibraryModal";
import GameLibraryModal from "../components/modals/GameLibraryModal";
import HelpModal from "../components/modals/HelpModal";
import JoinGameModal from "../components/modals/JoinGameModal";
import RulesModal from "../components/modals/RulesModal";
import NestedMenuItem from "../components/NestedMenuItem";
import Entity from "../models/game/Entity";
import HandArea from "../models/game/HandArea";
import { useStore } from "../stores/RootStore";
import { Modals } from "../stores/UIState";
import { ContextMenuItem } from "../types";

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
  const { t } = useTranslation();

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
            const key = enqueueSnackbar(t("gameIdCopiedToClipboard"), {
              onClick: () => closeSnackbar(key)
            });
          }}
        >
          <Chip
            className={classes.chip}
            clickable
            icon={<HostIcon />}
            label={t("youAreHosting")}
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
            label={`${player.name} (${
              gameStore.thisPlayer === player ? t("you") : ""
            })`}
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
  const { t } = useTranslation();

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
        label={t("addView")}
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
          label={t("hand")}
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

export default observer(() => {
  const { gameStore, uiState, gameLibrary } = useStore();
  const {
    contextMenu,
    isContextMenuOpen,
    canUndo,
    canRedo,
    openModal
  } = uiState;

  const { gameState } = gameStore;

  const { game } = useParams();
  const history = useHistory();
  const { t } = useTranslation();

  const theme = useTheme();
  const [topMenuAnchorEl, setTopMenuAnchorEl] = useState<null | HTMLElement>(
    null
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
      uiState.setOpenModal(Modals.EditEntity);
    }
  };

  const handleExportGame = () => {
    gameStore.exportGame();
  };

  if (contextMenu && !contextMenu.items) {
    contextMenu.items = [
      {
        label: t("contextMenu.newObject"),
        type: "action",
        action: () => {
          uiState.setOpenModal(Modals.EditEntity);

          handleContextMenuClose();
        }
      },
      {
        label: t("contextMenu.addObjectFromLibrary"),
        type: "action",
        action: () => {
          uiState.setOpenModal(Modals.EntityLibrary);
          handleContextMenuClose();
        }
      },
      {
        label: t("contextMenu.addHandArea"),
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
    uiState.setOpenModal(undefined);
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
          onClick={() => uiState.setOpenModal(Modals.AboutGame)}
          clickable
          label={gameState.name}
          deleteIcon={<EditIcon fontSize="small" />}
          onDelete={() => uiState.setOpenModal(Modals.AboutGame)}
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
          onClick={() => handleTopMenuSelect(() => gameLibrary.newGame())}
        >
          {t("mainMenu.newGame")}
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleTopMenuSelect(() => {
              uiState.setOpenModal(Modals.GameLibrary);
              gameStore.updateCurrentGameLibraryEntry();
            })
          }
        >
          {t("mainMenu.openGame")}
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleTopMenuSelect(() => uiState.setOpenModal(Modals.JoinGame))
          }
        >
          {t("mainMenu.joinGame")}
        </MenuItem>
        {/* <MenuItem
          onClick={() =>
            handleTopMenuSelect(() => uiState.setOpenModal(Modals.ImportGame))
          }
        >
          Import
        </MenuItem>
        <MenuItem onClick={() => handleTopMenuSelect(() => handleExportGame())}>
          Export
        </MenuItem> */}
        <MenuItem
          onClick={() =>
            handleTopMenuSelect(() => uiState.setOpenModal(Modals.Rules))
          }
        >
          {t("mainMenu.gameRules")}
        </MenuItem>
        <NestedMenuItem
          label={t("mainMenu.setups")}
          rightSide={true}
          parentMenuOpen={topMenuAnchorEl !== null ? true : false}
        >
          <MenuItem
            onClick={() =>
              handleTopMenuSelect(() => uiState.setOpenModal(Modals.EditSetup))
            }
          >
            {t("mainMenu.addSetup")}
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
          onClick={() =>
            handleTopMenuSelect(() => uiState.setOpenModal(Modals.Help))
          }
        >
          {t("mainMenu.help")}
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
      {openModal === Modals.AboutGame && (
        <AboutGameModal
          open={openModal === Modals.AboutGame}
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
