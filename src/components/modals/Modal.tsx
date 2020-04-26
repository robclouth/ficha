import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  useTheme,
  makeStyles
} from "@material-ui/core";
import "emoji-mart/css/emoji-mart.css";
import { draft } from "mobx-keystone";
import { observer } from "mobx-react";
import React, { useEffect, useCallback } from "react";
import Card from "../../models/game/Card";
import Deck from "../../models/game/Deck";
import Entity, { EntityType } from "../../models/game/Entity";
import EntitySet from "../../models/game/EntitySet";
import Piece from "../../models/game/Piece";
import PieceSet from "../../models/game/PieceSet";
import { useStore } from "../../stores/RootStore";

const useStyles = makeStyles({
  content: (noPadding: boolean) => {
    let style = {
      flexDirection: "column",
      display: "flex",
      alignItems: "stretch"
    } as any;
    if (noPadding)
      style = {
        ...style,
        padding: 0,
        "&:first-child": { paddingTop: 0 }
      };
    return style;
  }
});

export type ModalProps = {
  open: boolean;
  title?: string;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  noActions?: boolean;
  noPadding?: boolean;
  handleClose: () => void;
};

export default observer(
  ({
    open,
    title,
    content,
    actions,
    handleClose,
    noActions = false,
    noPadding = false
  }: ModalProps) => {
    const [modalOpen, setModalOpen] = React.useState(open);

    const classes = useStyles(noPadding);

    useEffect(() => {
      open && setModalOpen(open);
    }, [open]);

    const onClose = useCallback(() => setModalOpen(false), []);

    return (
      <Dialog open={modalOpen} onClose={onClose} onExited={handleClose}>
        {title && <DialogTitle>{title}</DialogTitle>}
        <DialogContent className={classes.content}>{content}</DialogContent>
        {!noActions && (
          <DialogActions>
            <Button onClick={onClose} color="primary">
              Cancel
            </Button>
            {actions}
          </DialogActions>
        )}
      </Dialog>
    );
  }
);
