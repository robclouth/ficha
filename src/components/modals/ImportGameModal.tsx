import {
  Button,
  LinearProgress,
  DialogContentText,
  FormControl,
  makeStyles,
  TextField
} from "@material-ui/core";
// @ts-ignore
import isUrl from "is-url";
import { observer } from "mobx-react";
import React, { useRef, useState } from "react";
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

export default observer(({ open, handleClose }: DialogProps) => {
  const classes = useStyles();

  const { gameStore } = useStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlFieldRef = useRef<HTMLInputElement>();

  const handleLoadClick = async () => {
    const url = urlFieldRef.current!.value;

    if (!isUrl(url)) {
      setError("Invalid URL");
      return;
    }

    try {
      setLoading(true);
      await gameStore.loadGameFromUrl(url);
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
      title="Import game"
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
              type="url"
              fullWidth
              error={error.length > 0}
              helperText={error}
            />
          </FormControl>
          {loading && <LinearProgress />}
        </>
      }
      actions={
        <Button variant="outlined" onClick={handleLoadClick} color="primary">
          {loading ? "Loading" : "Load"}
        </Button>
      }
    />
  );
});
