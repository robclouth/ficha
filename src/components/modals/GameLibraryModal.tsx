import {
  Box,
  Tabs,
  Tab,
  GridListTile,
  GridListTileBar,
  ListSubheader,
  makeStyles,
  useTheme,
  IconButton,
  ButtonBase,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Button,
  Divider,
  Popover,
  FormControl,
  TextField,
  LinearProgress
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import {
  usePopupState,
  bindTrigger,
  bindMenu
} from "material-ui-popup-state/hooks";
// @ts-ignore
import isUrl from "is-url";
//@ts-ignore
import AutoSizer from "react-virtualized-auto-sizer";
//@ts-ignore
import { FixedSizeList, ListChildComponentProps } from "react-window";
// @ts-ignore
import randomColor from "random-material-color";
import { chunk } from "lodash";
import { observer } from "mobx-react";
import React, { useState, useMemo, useRef } from "react";
import GameState from "../../models/GameState";
import { useStore } from "../../stores/RootStore";
import Modal from "./Modal";
import delay from "delay";

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
    // minWidth: 300
  },
  gridList: {
    // width: 500,
    // height: 450,
    // flex: 1
  },
  icon: {
    color: "rgba(255, 255, 255, 0.54)"
  }
}));

const tileSize = 175;

export type GameTileProps = {
  game: GameState;
  onClick: (game: GameState) => void;
  inProgress: boolean;
};

const GameTile = observer(({ game, onClick, inProgress }: GameTileProps) => {
  const { gameStore, gameLibrary } = useStore();
  const { name, gameId, imageUrl, recommendedPlayers, dateModified } = game;
  const classes = useStyles();
  const theme = useTheme();
  const svg = useMemo(() => (window as any).jdenticon.toSvg(gameId, tileSize), [
    gameId
  ]);

  const popupState = usePopupState({ variant: "popover", popupId: "gameMenu" });

  const handleRemoveClick = () => {
    if (inProgress) gameLibrary.stopGame(game);
    else gameLibrary.removeGameFromLibrary(game);
    popupState.close();
  };

  const subtitle = inProgress ? (
    <span>{new Date(dateModified).toDateString()}</span>
  ) : (
    recommendedPlayers && (
      <span>{`${recommendedPlayers[0]} - ${recommendedPlayers[1]} players`}</span>
    )
  );

  return (
    <GridListTile
      style={{
        width: tileSize,
        height: tileSize,
        backgroundColor: theme.palette.grey[700]
      }}
    >
      <ButtonBase onClick={() => onClick(game)}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: svg }}></div>
        )}
        {gameStore.currentGame?.maybeCurrent === game && (
          <Chip
            label="Playing"
            variant="outlined"
            style={{
              position: "absolute",
              top: theme.spacing(1),
              left: theme.spacing(1)
            }}
          />
        )}
      </ButtonBase>
      <GridListTileBar
        title={name}
        subtitle={subtitle}
        actionIcon={
          <IconButton {...bindTrigger(popupState)} className={classes.icon}>
            <MoreVertIcon />
          </IconButton>
        }
      />
      <Menu {...bindMenu(popupState)}>
        {inProgress && (
          <MenuItem onClick={() => gameLibrary.addGameToLibrary(game)}>
            Add to library
          </MenuItem>
        )}
        <MenuItem onClick={handleRemoveClick}>Remove</MenuItem>
      </Menu>
    </GridListTile>
  );
});

export type RowProps = {
  games: GameState[];
  onClick: (game: GameState) => void;
  inProgress: boolean;
};

const Row = observer(({ games, onClick, inProgress }: RowProps) => {
  return (
    <Box marginBottom={1} flex={1} display="flex">
      {games.map((game, i) => (
        <div
          key={i}
          style={{
            marginRight: i === games.length - 1 ? 0 : 10
          }}
        >
          <GameTile game={game} onClick={onClick} inProgress={inProgress} />
        </div>
      ))}
    </Box>
  );
});

const AddFromUrl = observer(() => {
  const { gameLibrary } = useStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlFieldRef = useRef<HTMLInputElement>();
  const popupState = usePopupState({
    variant: "popover",
    popupId: "addFromUrl"
  });

  const handleLoad = async () => {
    const url = urlFieldRef.current!.value;

    if (!isUrl(url)) {
      setError("Invalid URL");
      return;
    }

    try {
      setLoading(true);
      await gameLibrary.loadGameFromUrl(url);
      setLoading(false);
      popupState.close();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Button {...bindTrigger(popupState)}>Add from URL</Button>
      <Popover
        {...bindMenu(popupState)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
      >
        <Box width={400} padding={1} display="flex" alignItems="flex-start">
          <TextField
            style={{ flex: 1 }}
            inputRef={urlFieldRef}
            autoFocus
            margin="dense"
            id="url"
            placeholder="URL"
            type="url"
            error={error.length > 0}
            helperText={error}
          />
          <Button
            variant="outlined"
            onClick={handleLoad}
            color="primary"
            style={{ marginLeft: 10 }}
          >
            {loading ? "Loading" : "Load"}
          </Button>
        </Box>
        {loading && <LinearProgress />}
      </Popover>
    </>
  );
});

export type ModalProps = {
  open: boolean;
  positionGroundPlane?: [number, number];
  handleClose: () => void;
};

export default observer(
  ({ open, handleClose, positionGroundPlane }: ModalProps) => {
    const { gameStore, gameLibrary } = useStore();
    const { inProgressGamesOrderedByDate, library } = gameLibrary;
    const { gameState } = gameStore;
    const classes = useStyles();
    const theme = useTheme();

    const [tabIndex, setTabIndex] = useState(0);

    const rows = chunk(
      tabIndex === 0 ? inProgressGamesOrderedByDate : library,
      3
    );

    const handleGameClick = (game: GameState) => {
      gameLibrary.newGame(game);
      handleClose();
    };

    const handleInProgressClick = (game: GameState) => {
      gameLibrary.resumeGame(game);
      handleClose();
    };

    const renderRow = ({ data, index, style }: ListChildComponentProps) => {
      const games = rows[index];
      return (
        <div style={style} key={index}>
          <Row
            games={games}
            onClick={tabIndex === 0 ? handleInProgressClick : handleGameClick}
            inProgress={tabIndex === 0}
          />
        </div>
      );
    };

    return (
      <Modal
        open={open}
        handleClose={handleClose}
        noPadding
        content={
          <Box
            width={580}
            height={600}
            display="flex"
            flexDirection="column"
            alignItems="stretch"
          >
            <Tabs
              value={tabIndex}
              onChange={(e, index) => setTabIndex(index)}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              style={{ marginBottom: theme.spacing(1) }}
            >
              <Tab label="In Progress" />
              <Tab label="Library" />
            </Tabs>
            {tabIndex === 1 && (
              <Box margin={1} display="flex" justifyContent="center">
                <AddFromUrl />
              </Box>
            )}
            {
              <Box flex={1} padding={2}>
                <AutoSizer disableWidth>
                  {(size: any) => (
                    <FixedSizeList
                      style={{
                        listStyleType: "none",
                        overflow: "overlay"
                      }}
                      height={size.height}
                      itemCount={rows.length}
                      itemSize={tileSize + 10}
                      width={560}
                    >
                      {renderRow}
                    </FixedSizeList>
                  )}
                </AutoSizer>
              </Box>
            }
          </Box>
        }
      />
    );
  }
);
