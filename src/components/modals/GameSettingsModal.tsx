import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  makeStyles,
  TextField,
  DialogContentText,
  Input
} from "@material-ui/core";
// @ts-ignore
import isUrl from "is-url";
import { observer } from "mobx-react";
import React, { useState, useEffect } from "react";
import { useStore } from "../../stores/RootStore";

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: 300
  }
}));

type ModalProps = {
  open: boolean;
  handleClose: () => void;
};

export default observer(({ open, handleClose }: ModalProps) => {
  const classes = useStyles();
  const { gameStore } = useStore();
  const gameState = gameStore.gameState;

  const [name, setName] = useState("");
  const [assetsUrl, setAssetsUrl] = useState("");

  useEffect(() => {
    if (open) setName(gameState.name);
  }, [gameState.name, open]);

  useEffect(() => {
    if (open) setAssetsUrl(gameState.assetsUrl);
  }, [gameState.assetsUrl, open]);

  const handleSave = () => {
    gameState.name = name;
    gameState.assetsUrl = assetsUrl;
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Game settings</DialogTitle>
      <DialogContent
        style={{
          flexDirection: "column",
          display: "flex",
          alignItems: "stretch"
        }}
      >
        <FormControl className={classes.formControl}>
          <Input
            value={name}
            onChange={event => setName(event.target.value)}
            fullWidth
            placeholder="Game title"
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <Input
            value={assetsUrl}
            onChange={event => setAssetsUrl(event.target.value)}
            fullWidth
            placeholder="Assets URL"
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
});
