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
import Modal from "./Modal";

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
    <Modal
      open={open}
      handleClose={handleClose}
      title="Game settings"
      content={
        <>
          <FormControl className={classes.formControl}>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              placeholder="Game title"
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <Input
              value={assetsUrl}
              onChange={e => setAssetsUrl(e.target.value)}
              fullWidth
              placeholder="Assets URL"
            />
          </FormControl>
        </>
      }
      actions={
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      }
    />
  );
});
