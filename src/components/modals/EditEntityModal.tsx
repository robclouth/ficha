import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Input,
  makeStyles,
  MenuItem,
  Select,
  TextField,
  IconButton,
  Typography
} from "@material-ui/core";
import RemoveIcon from "@material-ui/icons/RemoveCircle";

//@ts-ignore
import { FixedSizeList, ListChildComponentProps } from "react-window";
//@ts-ignore
import AutoSizer from "react-virtualized-auto-sizer";

// @ts-ignore
import isUrl from "is-url";
import { observer } from "mobx-react";
import React, { useRef, useState } from "react";
import Card from "../../models/game/Card";
import Deck from "../../models/game/Deck";
import Entity, { EntityType } from "../../models/game/Entity";
import { useStore } from "../../stores/RootStore";
import GameState from "../../models/GameState";
import { Vector3, Plane } from "three";

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: 300
  }
}));

const DeckEditor = observer(({ deck }: { deck: Deck }) => {
  const classes = useStyles();
  const [backImageUrl, setBackImageUrl] = useState("");

  const handleBackImageUrlChange = (url: string) => {
    deck.cards.forEach(card => (card.backImageUrl = url));
    setBackImageUrl(url);
  };

  const handleBulkAdd = (text: string) => {
    const urls = text.split(",").map(url => url.trim());
    urls.forEach(url => handleAddCard(url));
  };

  const handleAddCard = (frontImageUrl: string) => {
    deck.addCard(
      new Card({ frontImageUrl, backImageUrl, ownerDeckId: deck.$modelId })
    );
  };

  const renderRow = (props: ListChildComponentProps) => {
    const card = deck.cards[props.index];
    if (!card) return null;
    return (
      <Box display="flex">
        <TextField
          fullWidth
          value={card.frontImageUrl}
          onChange={e => (card.frontImageUrl = e.target.value)}
          placeholder="Front image URL"
        />

        <IconButton onClick={() => deck.removeCard(card)}>
          <RemoveIcon />
        </IconButton>
      </Box>
    );
  };

  return (
    <Box display="flex" flexDirection="column">
      <FormControl className={classes.formControl}>
        <Input
          value={backImageUrl}
          onChange={e => handleBackImageUrlChange(e.target.value)}
          fullWidth
          placeholder="Back image URL"
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <Input
          value=""
          fullWidth
          placeholder="Bulk add"
          onChange={e => handleBulkAdd(e.target.value)}
        />
      </FormControl>
      <Typography
        variant="body1"
        gutterBottom
      >{`${deck.cards.length} cards`}</Typography>
      <Button onClick={() => handleAddCard("")}>Add card</Button>
      {/* <AutoSizer style={{ width: "100%" }}>
        {(size: any) => (
          <FixedSizeList
            className="List"
            height={size.height}
            itemCount={deck.cards.length}
            itemSize={35}
            width={size.width}
          >
            {renderRow}
          </FixedSizeList>
        )}
      </AutoSizer> */}
      {deck.cards.map((card, i) => (
        <Box key={i} display="flex">
          <TextField
            fullWidth
            value={card.frontImageUrl}
            onChange={e => (card.frontImageUrl = e.target.value)}
            placeholder="Front image URL"
          />

          <IconButton onClick={() => deck.removeCard(card)}>
            <RemoveIcon />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
});

export type ModalProps = {
  open: boolean;
  positionGroundPlane?: [number, number];
  entity?: Entity;
  handleClose: () => void;
};

export default observer(
  ({ open, handleClose, positionGroundPlane, entity }: ModalProps) => {
    const { gameStore, uiState } = useStore();
    const { gameState } = gameStore;

    const [error, setError] = React.useState("");
    const [type, setType] = React.useState(EntityType.Deck);
    const classes = useStyles();

    const isEditing = !!entity;

    const targetEntity = React.useMemo(() => {
      if (isEditing) return entity!;

      if (type === EntityType.Deck) return new Deck({});
      else return new Deck({});
    }, [type, open]);

    const handleSaveClick = async () => {
      if (!isEditing) {
        if (positionGroundPlane) targetEntity.position = positionGroundPlane;
        gameState.addEntity(targetEntity);
      }
      handleClose();
    };

    let typeEditor: React.ReactNode = null;
    if (targetEntity.type === EntityType.Deck) {
      typeEditor = <DeckEditor deck={entity as Deck} />;
    }

    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{`${isEditing ? "Edit" : "Add"} entity`}</DialogTitle>
        <DialogContent
          style={{
            flexDirection: "column",
            display: "flex",
            alignItems: "stretch"
          }}
        >
          <FormControl className={classes.formControl}>
            <Select
              fullWidth
              value={type}
              onChange={e => setType(e.target.value as EntityType)}
            >
              <MenuItem value={EntityType.Deck}>Deck</MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <Input
              value={targetEntity.name}
              onChange={e => (targetEntity.name = e.target.value)}
              fullWidth
              placeholder="Name"
            />
          </FormControl>
          {typeEditor}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveClick} color="primary">
            {isEditing ? "Save" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);
