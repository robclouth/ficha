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
  Typography
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import {
  usePopupState,
  bindTrigger,
  bindMenu
} from "material-ui-popup-state/hooks";
//@ts-ignore
import AutoSizer from "react-virtualized-auto-sizer";
//@ts-ignore
import { FixedSizeList, ListChildComponentProps } from "react-window";
// @ts-ignore
import randomColor from "random-material-color";
import { chunk } from "lodash";
import { observer } from "mobx-react";
import React, { useState, useMemo } from "react";
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
  const { gameStore } = useStore();
  const { name, gameId, imageUrl, recommendedPlayers, dateModified } = game;
  const classes = useStyles();
  const theme = useTheme();
  const svg = useMemo(() => (window as any).jdenticon.toSvg(gameId, tileSize), [
    gameId
  ]);

  const popupState = usePopupState({ variant: "popover", popupId: "gameMenu" });

  const handleRemoveClick = () => {
    if (inProgress) gameStore.stopGame(game);
    else gameStore.removeGameFromLibrary(game);
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

export type ModalProps = {
  open: boolean;
  positionGroundPlane?: [number, number];
  handleClose: () => void;
};

export default observer(
  ({ open, handleClose, positionGroundPlane }: ModalProps) => {
    const { gameStore, uiState } = useStore();
    const { inProgressGames, gameLibrary } = gameStore;
    const { gameState } = gameStore;
    const classes = useStyles();
    const theme = useTheme();

    const [tabIndex, setTabIndex] = useState(0);

    const rows = chunk(gameLibrary, 3);

    const handleGameClick = (game: GameState) => {
      gameStore.newGame(game);
      handleClose();
    };

    const handleInProgressClick = (game: GameState) => {
      gameStore.playGame(game);
      handleClose();
    };

    const renderInProgressGame = ({
      data,
      index,
      style
    }: ListChildComponentProps) => {
      const game = inProgressGames[index];
      return (
        <div style={style}>
          <GameTile
            game={game}
            onClick={handleInProgressClick}
            inProgress={true}
          />
        </div>
      );
    };

    const renderRow = ({ data, index, style }: ListChildComponentProps) => {
      const games = rows[index];
      return (
        <div style={style}>
          <Row games={games} onClick={handleGameClick} inProgress={false} />
        </div>
      );
    };

    return (
      <Modal
        open={open}
        handleClose={handleClose}
        content={
          <Box
            width={550}
            height={600}
            display="flex"
            flexDirection="column"
            alignItems="stretch"
          >
            {inProgressGames.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  In Progress
                </Typography>
                <div>
                  <AutoSizer disableHeight>
                    {(size: any) => (
                      <FixedSizeList
                        style={{
                          listStyleType: "none",
                          overflow: "overlay"
                        }}
                        layout="horizontal"
                        height={tileSize}
                        itemCount={inProgressGames.length}
                        itemSize={tileSize + 10}
                        width={size.width}
                      >
                        {renderInProgressGame}
                      </FixedSizeList>
                    )}
                  </AutoSizer>
                </div>
              </>
            )}
            <Typography variant="h6" gutterBottom>
              Library
            </Typography>

            <div style={{ flex: 1 }}>
              <AutoSizer>
                {(size: any) => (
                  <FixedSizeList
                    style={{
                      listStyleType: "none",
                      overflow: "overlay"
                    }}
                    height={size.height}
                    itemCount={rows.length}
                    itemSize={tileSize + 10}
                    width={size.width}
                  >
                    {renderRow}
                  </FixedSizeList>
                )}
              </AutoSizer>
            </div>
          </Box>
        }
      />
    );
  }
);
