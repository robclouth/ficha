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

export type AddEntityModalProps = {
  open: boolean;
  handleClose: () => void;
};

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
    deck.addCard(new Card({ frontImageUrl, backImageUrl }));
  };

  return (
    <Box display="flex" flexDirection="column">
      <FormControl className={classes.formControl}>
        <Input
          value={backImageUrl}
          onChange={event => handleBackImageUrlChange(event.target.value)}
          fullWidth
          placeholder="Back image URL"
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <Input
          value=""
          fullWidth
          placeholder="Bulk add"
          onChange={event => handleBulkAdd(event.target.value)}
        />
      </FormControl>
      <Typography
        variant="body1"
        gutterBottom
      >{`${deck.cards.length} cards`}</Typography>
      <Button onClick={() => handleAddCard("")}>Add card</Button>
      {deck.cards.map((card, i) => (
        <Box display="flex">
          <TextField
            fullWidth
            value={card.frontImageUrl}
            onChange={event => (card.frontImageUrl = event.target.value)}
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

export default observer(({ open, handleClose }: AddEntityModalProps) => {
  const { gameStore, uiState } = useStore();
  const { gameState } = gameStore;

  const [error, setError] = React.useState("");
  const [type, setType] = React.useState(EntityType.Deck);
  const classes = useStyles();

  const entity = React.useMemo(() => {
    if (type === EntityType.Deck) return new Deck({});
    else return new Deck({});
  }, [type, open]);

  const handleAddClick = async () => {
    const ray = uiState.contextMenuEvent?.ray;
    if (ray) {
      let point = new Vector3();
      ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), point);
      entity.position = [point.x, point.z];
    }

    gameState.addEntity(entity);
    handleClose();
  };

  let typeEditor: React.ReactNode = null;
  if (entity.type === EntityType.Deck) {
    typeEditor = <DeckEditor deck={entity as Deck} />;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="add-entity-dialog-title"
    >
      <DialogTitle id="add-entity-dialog-title">Add entity</DialogTitle>
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
            onChange={event => setType(event.target.value as EntityType)}
          >
            <MenuItem value={EntityType.Deck}>Deck</MenuItem>
          </Select>
        </FormControl>
        <FormControl className={classes.formControl}>
          <Input
            value={entity.name}
            onChange={event => (entity.name = event.target.value)}
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
        <Button onClick={handleAddClick} color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
});
