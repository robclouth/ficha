import {
  Button,
  FormControl,
  LinearProgress,
  makeStyles,
  TextField
} from "@material-ui/core";
import { observer } from "mobx-react";
import React, { useState, useRef } from "react";
import { useStore } from "../../stores/RootStore";
import Modal from "./Modal";

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: 300
  }
}));

type JoinGameModalProps = {
  open: boolean;
  handleClose: () => void;
};

export default observer(({ open, handleClose }: JoinGameModalProps) => {
  const classes = useStyles();

  const { gameStore } = useStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const gameIdFieldRef = useRef<HTMLInputElement>();

  const handleJoinClick = async () => {
    const gameId = gameIdFieldRef.current!.value;

    if (gameId.length === 0) {
      setError("Enter a game ID");
      return;
    }

    try {
      setLoading(true);
      await gameStore.joinGame(gameId);
      setLoading(false);
      handleClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title="Join game"
      content={
        <>
          <FormControl className={classes.formControl}>
            <TextField
              inputRef={gameIdFieldRef}
              autoFocus
              margin="dense"
              placeholder="Game ID"
              fullWidth
              error={error.length > 0}
              helperText={error}
            />
          </FormControl>
          {loading && <LinearProgress />}
        </>
      }
      actions={
        <Button variant="outlined" onClick={handleJoinClick} color="primary">
          {loading ? "Joining" : "Join"}
        </Button>
      }
    />
  );
});
