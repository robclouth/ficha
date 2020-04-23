import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  makeStyles,
  TextField,
  InputLabel,
  FormLabel,
  Slider
} from "@material-ui/core";
import { observer } from "mobx-react";
import React, { useMemo } from "react";
import { useStore } from "../../stores/RootStore";
import Modal, { ModalProps } from "./Modal";
import GameSetup from "../../models/GameSetup";
import { range } from "lodash";
import { draft } from "mobx-keystone";

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: 300
  }
}));

type EditSetupModalProps = ModalProps & {
  setup?: GameSetup;
};

export default observer(({ open, handleClose, setup }: EditSetupModalProps) => {
  const classes = useStyles();

  const { gameStore } = useStore();

  const isEditing = !!setup;

  const setupDraft = useMemo(
    () => draft(setup || new GameSetup({ name: "New setup" })),
    []
  );

  const handleSaveClick = async () => {
    setupDraft.commit();
    if (!isEditing) gameStore.gameState.addSetup(setupDraft.originalData);

    handleClose();
  };

  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={`${isEditing ? "Edit" : "Add"} setup`}
      content={
        <>
          <FormControl className={classes.formControl}>
            <TextField
              autoFocus
              margin="dense"
              placeholder="Setup name"
              fullWidth
              value={setupDraft.data.name}
              onChange={e => (setupDraft.data.name = e.target.value)}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <FormLabel>Number of players</FormLabel>
            <Slider
              value={setupDraft.data.numPlayers}
              onChange={(e, value) =>
                (setupDraft.data.numPlayers = value as number)
              }
              valueLabelDisplay="auto"
              min={1}
              max={16}
            />
          </FormControl>
        </>
      }
      actions={
        <Button onClick={handleSaveClick} color="primary">
          Save
        </Button>
      }
    />
  );
});
