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
import Modal from "./Modal";

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: 300
  }
}));

type DialogProps = {
  open: boolean;
  handleClose: () => void;
};

const gameUrl =
  "https://raw.githubusercontent.com/robclouth/p2p-game/master/games/The%20Young%20Kings/";

export default observer(({ open, handleClose }: DialogProps) => {
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
    <Modal
      open={open}
      handleClose={handleClose}
      title="Add from library"
      content={
        <>
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
        </>
      }
      actions={
        <Button onClick={handleLoadClick} color="primary">
          Load
        </Button>
      }
    />
  );
});
