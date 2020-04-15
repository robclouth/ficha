import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  makeStyles,
  TextField,
  DialogContentText
} from "@material-ui/core";
// @ts-ignore
import isUrl from "is-url";
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

type LoadGameDialogProps = {
  open: boolean;
  handleClose: () => void;
};

const gameUrl =
  "https://raw.githubusercontent.com/robclouth/p2p-game/master/games/The%20Young%20Kings/";

export default observer(({ open, handleClose }: LoadGameDialogProps) => {
  const classes = useStyles();

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
        <FormControl className={classes.formControl}>
          <TextField
            inputRef={urlFieldRef}
            autoFocus
            margin="dense"
            id="url"
            placeholder="URL"
            defaultValue={gameUrl}
            type="url"
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
        <Button onClick={handleLoadClick} color="primary">
          Load
        </Button>
      </DialogActions>
    </Dialog>
  );
});
