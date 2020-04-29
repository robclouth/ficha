import { Button, FormControl, makeStyles, TextField } from "@material-ui/core";
import { draft } from "mobx-keystone";
import { observer } from "mobx-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../stores/RootStore";
import { Modals } from "../../stores/UIState";
import Modal from "./Modal";

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
  const { t } = useTranslation();

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
      title={t("about")}
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
              label={t("title")}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <TextField
              value={gameDraft.data.author}
              onChange={e => (gameDraft.data.author = e.target.value)}
              fullWidth
              label={t("author")}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <TextField
              value={gameDraft.data.description}
              onChange={e => (gameDraft.data.description = e.target.value)}
              fullWidth
              multiline
              label={t("description")}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <TextField
              value={gameDraft.data.imageUrl}
              onChange={e => (gameDraft.data.imageUrl = e.target.value)}
              fullWidth
              label={t("imageUrl")}
            />
          </FormControl>
          <Button fullWidth onClick={() => uiState.setOpenModal(Modals.Rules)}>
            {t("rules")}
          </Button>
        </>
      }
      actions={
        <Button onClick={handleSave} color="primary">
          {t("save")}
        </Button>
      }
    />
  );
});
