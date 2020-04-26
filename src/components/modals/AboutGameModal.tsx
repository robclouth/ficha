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
  Input,
  InputLabel
} from "@material-ui/core";
// @ts-ignore
import isUrl from "is-url";
import { observer } from "mobx-react";
import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../../stores/RootStore";
import Modal from "./Modal";
import { draft } from "mobx-keystone";
import { Modals } from "../../stores/UIState";

const useStyles = makeStyles(theme => ({
  formControl: {
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
  const { gameStore, uiState } = useStore();
  const gameState = gameStore.gameState;

  const gameDraft = useMemo(() => draft(gameState), []);

  const handleSave = () => {
    gameDraft.commit();
    handleClose();
  };

  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title="About"
      content={
        <>
          {gameDraft.data.imageUrl && (
            <img
              style={{ height: 200, objectFit: "contain", marginBottom: 10 }}
              src={gameDraft.data.imageUrl}
            ></img>
          )}
          <FormControl className={classes.formControl}>
            <TextField
              value={gameDraft.data.name}
              onChange={e => (gameDraft.data.name = e.target.value)}
              fullWidth
              label="Title"
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <TextField
              value={gameDraft.data.author}
              onChange={e => (gameDraft.data.author = e.target.value)}
              fullWidth
              label="Author"
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <TextField
              value={gameDraft.data.description}
              onChange={e => (gameDraft.data.description = e.target.value)}
              fullWidth
              multiline
              label="Description"
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <TextField
              value={gameDraft.data.imageUrl}
              onChange={e => (gameDraft.data.imageUrl = e.target.value)}
              fullWidth
              label="Image URL"
            />
          </FormControl>
          <Button fullWidth onClick={() => uiState.setOpenModal(Modals.Rules)}>
            Rules
          </Button>
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
