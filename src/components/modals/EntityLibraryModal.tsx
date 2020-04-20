import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  List,
  ListItemIcon,
  Checkbox,
  Typography,
  Box
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import { observer } from "mobx-react";
import React, { useState } from "react";
//@ts-ignore
import AutoSizer from "react-virtualized-auto-sizer";
//@ts-ignore
import { FixedSizeList, ListChildComponentProps } from "react-window";
import Deck from "../../models/game/Deck";
import Entity, { EntityType } from "../../models/game/Entity";
import { useStore } from "../../stores/RootStore";
import { clone } from "mobx-keystone";

const colorOptions = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#000000",
  "#ffffff"
];

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
    // minWidth: 300
  }
}));

export type ModalProps = {
  open: boolean;
  positionGroundPlane?: [number, number];
  handleClose: () => void;
};

export default observer(
  ({ open, handleClose, positionGroundPlane }: ModalProps) => {
    const { gameStore, uiState, entityLibrary } = useStore();
    const { entities } = entityLibrary;
    const { gameState } = gameStore;
    const classes = useStyles();

    const [selectedEntity, setSelectedEntity] = useState<Entity | undefined>(
      undefined
    );

    const handleAddClick = async () => {
      if (positionGroundPlane) selectedEntity!.position = positionGroundPlane;
      gameState.addEntity(clone(selectedEntity!));
      handleClose();
    };

    const renderRow = ({ data, index, style }: ListChildComponentProps) => {
      const libraryEntity = entities[index];

      let description = libraryEntity.$modelType;
      if (libraryEntity.type === EntityType.Deck) {
        const deck = libraryEntity as Deck;
        description += ` - ${deck.cards.length} cards`;
      }
      return (
        <ListItem button onClick={() => setSelectedEntity(libraryEntity)}>
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={selectedEntity === libraryEntity}
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" paddingRight={1} alignItems="center">
                <Typography
                  component="span"
                  variant="body1"
                  style={{ marginRight: 10 }}
                >
                  {libraryEntity.name || "Untitled"}
                </Typography>
                <Typography
                  component="span"
                  variant="body1"
                  align="right"
                  style={{ flex: 1 }}
                >
                  {description}
                </Typography>
              </Box>
            }
            // secondary={description}
          />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => entityLibrary.removeEntity(libraryEntity)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      );
    };

    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add from library</DialogTitle>
        <DialogContent
          style={{
            flexDirection: "column",
            display: "flex",
            alignItems: "stretch",
            minWidth: 500
          }}
        >
          {
            <AutoSizer disableHeight>
              {(size: any) => (
                <FixedSizeList
                  style={{ maxHeight: 400, listStyleType: "none" }}
                  className="List"
                  height={entities.length * 58}
                  itemCount={entities.length}
                  itemSize={58}
                  width={size.width}
                >
                  {renderRow}
                </FixedSizeList>
              )}
            </AutoSizer>
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleAddClick}
            color="primary"
            disabled={!selectedEntity}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);
