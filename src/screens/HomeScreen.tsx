import {
  Button,
  Container,
  Grid,
  makeStyles,
  TextField,
  Typography
} from "@material-ui/core";
import { observer } from "mobx-react";
import React from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import { useStore } from "../stores/RootStore";

const useStyles = makeStyles(theme => ({
  gridItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch"
  }
}));

export default observer(() => {
  const { gameStore } = useStore();
  const [gameCode, setGameCode] = React.useState("");
  const classes = useStyles();
  const history = useHistory();

  const handleCreateGameClick = async () => {
    const gameId = await gameStore.createGame();
    history.push("game");
  };

  return (
    <Container maxWidth="xs">
      <Grid container spacing={2}>
        <Grid item xs={12} className={classes.gridItem}>
          <Button onClick={handleCreateGameClick} variant="outlined" fullWidth>
            Create Game
          </Button>
        </Grid>
        <Grid item xs={12} className={classes.gridItem}>
          <Typography variant="caption" gutterBottom align="center">
            OR
          </Typography>
        </Grid>
        <Grid item xs={12} className={classes.gridItem}>
          <TextField
            variant="outlined"
            fullWidth
            label="Game code"
            value={gameCode}
            onChange={event => setGameCode(event.target.value)}
          ></TextField>
        </Grid>
        <Grid item xs={12} className={classes.gridItem}>
          <Button
            variant="outlined"
            fullWidth
            component={RouterLink}
            to="/game"
            disabled={gameCode.length === 0}
          >
            Join Game
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
});
