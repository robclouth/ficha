import {
  Container,
  Grid,
  makeStyles,
  Link,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Typography,
  TextField,
  Divider
} from "@material-ui/core";
import { observer } from "mobx-react";
import React from "react";
import { useHistory, useParams } from "react-router-dom";
import { useStore } from "../stores/RootStore";
import Player from "../models/Player";
import { ActionType } from "../models/GameState";
import GameCanvas from "../components/game/GameCanvas";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    height: "100%"
  },
  gui: {
    position: "absolute",
    top: 0
  },
  gridItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch"
  },
  messages: {
    minHeight: 100
  },
  table: {}
}));

const PlayersTable = observer<React.FC<{ players: Player[] }>>(props => {
  const classes = useStyles();

  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.players.map((player, i) => (
            <TableRow key={i}>
              <TableCell>{player.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

const Chat = observer(() => {
  const [message, setMessage] = React.useState("");
  const { gameStore } = useStore();
  const { player, gameState } = gameStore;

  const classes = useStyles();

  function onKeyPress(event: React.KeyboardEvent) {
    if (event.which === 13) {
      gameStore.sendActionToServer({
        type: ActionType.SendMessage,
        data: `${player.name}: ${message}`
      });

      setMessage("");
    }
  }

  return (
    <Container component={Paper}>
      <Grid container spacing={2}>
        <Grid item xs={12} className={`${classes.gridItem}${classes.messages}`}>
          {gameState.chatHistory.map(message => (
            <Typography>{message}</Typography>
          ))}
          <Divider />
        </Grid>

        <Grid item xs={12} className={classes.gridItem}>
          <TextField
            value={message}
            label="Type something"
            onChange={event => setMessage(event.target.value)}
            onKeyPress={onKeyPress}
          ></TextField>
        </Grid>
      </Grid>
    </Container>
  );
});

export default observer(() => {
  const { gameStore } = useStore();
  const gameState = gameStore.gameState;

  let { id: gameId } = useParams();

  React.useEffect(() => {
    gameStore.createOrJoinGame(gameId);
  }, [gameId]);

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <GameCanvas />
      <Container className={classes.gui}>
        <Grid container spacing={2}>
          <Grid item xs={12} className={classes.gridItem}>
            <Link
              href={`#/game/${gameStore.gameId}`}
              target="_blank"
            >{`Game id: ${gameStore.gameId}`}</Link>
          </Grid>
          <Grid item xs={12} className={classes.gridItem}>
            <PlayersTable players={gameState.players} />
          </Grid>
          <Grid item xs={12} className={classes.gridItem}>
            <Chat />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
});
