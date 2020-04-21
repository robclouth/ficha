import { makeStyles, TextField, Box, Fab, InputBase } from "@material-ui/core";
import { observer } from "mobx-react";
import React, { useState } from "react";
import { useStore } from "../../stores/RootStore";
import Modal from "./Modal";
import Markdown from "markdown-to-jsx";
import EditIcon from "@material-ui/icons/Edit";
import VisibilityIcon from "@material-ui/icons/Visibility";

const useStyles = makeStyles(theme => ({
  fab: {
    position: "absolute",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

type ModalProps = {
  open: boolean;
  handleClose: () => void;
};

export default observer(({ open, handleClose }: ModalProps) => {
  const classes = useStyles();

  const [edit, setEdit] = useState(false);

  const { gameStore } = useStore();
  const gameState = gameStore.gameState;

  const markdown = gameState.rules.join(" ");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    gameState.rules = e.target.value.split(" ");
  };

  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={undefined}
      noActions
      content={
        <Box
          width={550}
          minHeight={400}
          display="flex"
          flexDirection="column"
          alignItems="stretch"
        >
          {edit ? (
            <InputBase
              value={markdown}
              onChange={handleChange}
              autoFocus
              placeholder="Game ID"
              fullWidth
              multiline
            />
          ) : (
            <Markdown children={markdown} />
          )}

          <Fab
            onClick={() => setEdit(!edit)}
            size="medium"
            aria-label="edit"
            className={classes.fab}
          >
            {edit ? <VisibilityIcon /> : <EditIcon />}
          </Fab>
        </Box>
      }
    />
  );
});
