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
  IconButton
} from "@material-ui/core";
import RemoveIcon from "@material-ui/icons/RemoveCircle";

// @ts-ignore
import isUrl from "is-url";
import { observer } from "mobx-react";
import React from "react";
import Card from "../../models/game/Card";
import Deck from "../../models/game/Deck";
import { EntityType } from "../../models/game/Entity";
import { useStore } from "../../stores/RootStore";
import GameState from "../../models/GameState";

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    minWidth: 300
  }
}));

export type AddEntityDialogProps = {
  open: boolean;
  handleClose: () => void;
};

export default observer(({ open, handleClose }: AddEntityDialogProps) => {
  const { gameStore } = useStore();
  const { gameState } = gameStore;

  const [error, setError] = React.useState("");
  const [type, setType] = React.useState(EntityType.Deck);
  const classes = useStyles();

  const entity = React.useMemo(() => {
    if (type === EntityType.Deck) return new Deck({});
    else return new Deck({});
  }, [type]);

  const handleAddClick = async () => {
    gameState.addEntity(entity);
    handleClose();
  };

  let typeEditor: React.ReactNode = null;
  if (entity.type === EntityType.Deck) {
    const deck = entity as Deck;
    typeEditor = (
      <Box display="flex" flexDirection="column">
        <FormControl className={classes.formControl}>
          <Input fullWidth placeholder="Back image URL" />
        </FormControl>
        <Button onClick={() => deck.addCard(new Card({}))}>Add card</Button>
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
