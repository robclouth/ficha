import { Box, makeStyles } from "@material-ui/core";
import { observer } from "mobx-react";
import React from "react";
import Markdown from "../Markdown";
import Modal from "./Modal";
import { helpText } from "../../constants/help";

type ModalProps = {
  open: boolean;
  handleClose: () => void;
};

export default observer(({ open, handleClose }: ModalProps) => {
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={undefined}
      content={
        <Box
          width={550}
          minHeight={400}
          display="flex"
          flexDirection="column"
          alignItems="stretch"
        >
          <Markdown markdown={helpText} />
        </Box>
      }
    />
  );
});
