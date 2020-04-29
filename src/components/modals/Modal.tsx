import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles
} from "@material-ui/core";
import "emoji-mart/css/emoji-mart.css";
import { observer } from "mobx-react";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
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
              {t("cancel")}
            </Button>
            {actions}
          </DialogActions>
        )}
      </Dialog>
    );
  }
);
