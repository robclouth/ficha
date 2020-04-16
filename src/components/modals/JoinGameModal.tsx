import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  makeStyles,
  TextField
} from "@material-ui/core";
import { observer } from "mobx-react";
import React from "react";
import { useStore } from "../../stores/RootStore";

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
  const [error, setError] = React.useState("");

  const gameIdFieldRef = React.useRef<HTMLInputElement>();

  const handleJoinClick = async () => {
    const gameId = gameIdFieldRef.current!.value;

    if (gameId.length === 0) {
      setError("Enter a game ID");
      return;
    }

    try {
      await gameStore.joinGame(gameId);
      handleClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Join game</DialogTitle>
      <DialogContent>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleJoinClick} color="primary">
          Join
        </Button>
      </DialogActions>
    </Dialog>
  );
});
