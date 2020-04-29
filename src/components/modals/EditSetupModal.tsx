import {
  Button,
  FormControl,
  FormLabel,
  makeStyles,
  Slider,
  TextField
} from "@material-ui/core";
import { draft } from "mobx-keystone";
import { observer } from "mobx-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GameSetup from "../../models/GameSetup";
import { useStore } from "../../stores/RootStore";
import Modal, { ModalProps } from "./Modal";

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
  const { t } = useTranslation();

  const classes = useStyles();

  const { gameStore } = useStore();

  const isEditing = !!setup;

  const setupDraft = useMemo(
    () => draft(setup || new GameSetup({ name: t("newSetup") })),
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
      title={`${isEditing ? t("edit") : t("add")} ${t(
        "setup"
      ).toLocaleLowerCase()}`}
      content={
        <>
          <FormControl className={classes.formControl}>
            <TextField
              autoFocus
              margin="dense"
              placeholder={t("setupName")}
              fullWidth
              value={setupDraft.data.name}
              onChange={e => (setupDraft.data.name = e.target.value)}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <FormLabel>{t("numberOfPlayers")}</FormLabel>
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
          {t("save")}
        </Button>
      }
    />
  );
});
