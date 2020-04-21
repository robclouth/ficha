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
  useTheme
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

export type ModalProps = {
  open: boolean;
  title?: string;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  noActions?: boolean;
  handleClose: () => void;
};

export default observer(
  ({
    open,
    title,
    content,
    actions,
    handleClose,
    noActions = false
  }: ModalProps) => {
    const [modalOpen, setModalOpen] = React.useState(open);

    useEffect(() => {
      open && setModalOpen(open);
    }, [open]);

    const onClose = useCallback(() => setModalOpen(false), []);

    return (
      <Dialog open={modalOpen} onClose={onClose} onExited={handleClose}>
        {title && <DialogTitle>{title}</DialogTitle>}
        <DialogContent
          style={{
            flexDirection: "column",
            display: "flex",
            alignItems: "stretch"
          }}
        >
          {content}
        </DialogContent>
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
