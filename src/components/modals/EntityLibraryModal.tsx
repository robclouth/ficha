import {
  Box,
  Button,
  Checkbox,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  Typography
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import { clone } from "mobx-keystone";
import { observer } from "mobx-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
//@ts-ignore
import AutoSizer from "react-virtualized-auto-sizer";
//@ts-ignore
import { FixedSizeList, ListChildComponentProps } from "react-window";
import Deck from "../../models/game/Deck";
import Entity, { EntityType } from "../../models/game/Entity";
import { useStore } from "../../stores/RootStore";
import Modal from "./Modal";

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
    const { t } = useTranslation();

    const { gameStore, uiState, entityLibrary } = useStore();
    const { entities } = entityLibrary;
    const { gameState } = gameStore;
    const classes = useStyles();

    const [selectedEntity, setSelectedEntity] = useState<Entity | undefined>(
      undefined
    );

    const handleAddClick = async () => {
      if (positionGroundPlane)
        selectedEntity!.setPosition(
          positionGroundPlane[0],
          positionGroundPlane[1]
        );
      gameState.addEntity(clone(selectedEntity!));
      handleClose();
    };

    const renderRow = ({ data, index, style }: ListChildComponentProps) => {
      const libraryEntity = entities[index];

      let description = libraryEntity.$modelType;
      if (libraryEntity.type === EntityType.Deck) {
        const deck = libraryEntity as Deck;
        description += ` - ${deck.totalEntities} ${t("card", {
          count: deck.totalEntities
        })}`;
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
                  {libraryEntity.name || t("untitled")}
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
      <Modal
        open={open}
        handleClose={handleClose}
        title={t("addFromLibrary")}
        content={
          <Box width={500}>
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
          </Box>
        }
        actions={
          <Button
            onClick={handleAddClick}
            color="primary"
            disabled={!selectedEntity}
          >
            {t("add")}
          </Button>
        }
      />
    );
  }
);
