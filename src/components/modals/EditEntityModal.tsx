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
  Typography,
  FormHelperText,
  FormLabel,
  useTheme,
  Paper,
  Divider
} from "@material-ui/core";
import RemoveIcon from "@material-ui/icons/RemoveCircle";
import { CirclePicker } from "react-color";

//@ts-ignore
import { FixedSizeList, ListChildComponentProps } from "react-window";
//@ts-ignore
import AutoSizer from "react-virtualized-auto-sizer";

// @ts-ignore
import isUrl from "is-url";
import { observer } from "mobx-react";
import React, { useRef, useState } from "react";
import Card from "../../models/game/Card";
import Deck, { deckRef } from "../../models/game/Deck";
import Entity, { EntityType } from "../../models/game/Entity";
import { useStore } from "../../stores/RootStore";
import GameState from "../../models/GameState";
import { Vector3, Plane } from "three";

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

const CardEditor = observer(
  ({ card, showBackInput = true }: { card: Card; showBackInput?: boolean }) => {
    const classes = useStyles();

    const {
      frontImageUrl,
      backImageUrl,
      title,
      subtitle,
      body,
      value,
      color
    } = card;

    return (
      <Box display="flex" flexDirection="column">
        <FormControl className={classes.formControl}>
          <Input
            value={frontImageUrl}
            onChange={e => (card.frontImageUrl = e.target.value)}
            fullWidth
            placeholder="Front image URL"
          />
        </FormControl>
        {showBackInput && (
          <FormControl className={classes.formControl}>
            <Input
              value={backImageUrl}
              disabled={!!card.ownerDeck}
              onChange={e => (card.backImageUrl = e.target.value)}
              fullWidth
              placeholder={"Back image URL"}
            />
            {card.ownerDeck && (
              <FormHelperText>
                The back image must be edited in the deck
              </FormHelperText>
            )}
          </FormControl>
        )}
        <FormControl className={classes.formControl}>
          <Input
            value={title}
            onChange={e => (card.title = e.target.value)}
            fullWidth
            placeholder="Title"
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <Input
            value={subtitle}
            onChange={e => (card.subtitle = e.target.value)}
            fullWidth
            placeholder="Subtitle"
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <Input
            value={body}
            onChange={e => (card.body = e.target.value)}
            fullWidth
            placeholder="Body"
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <Input
            value={value}
            onChange={e => (card.value = e.target.value)}
            fullWidth
            placeholder="Value"
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <FormLabel>Color</FormLabel>
          <div
            style={{
              padding: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <CirclePicker
              colors={colorOptions}
              circleSpacing={5}
              circleSize={20}
              color={{
                r: Math.floor(color.r * 255),
                g: Math.floor(color.g * 255),
                b: Math.floor(color.b * 255)
              }}
              onChange={color =>
                (card.color = {
                  r: color.rgb.r / 255,
                  g: color.rgb.g / 255,
                  b: color.rgb.b / 255
                })
              }
              width={"240px"}
            />
          </div>
        </FormControl>
      </Box>
    );
  }
);

const cardComponentHeight = 500;

const DeckEditor = observer(({ deck }: { deck: Deck }) => {
  const classes = useStyles();
  const theme = useTheme();
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
      new Card({ frontImageUrl, backImageUrl, ownerDeck: deckRef(deck) })
    );
  };

  const renderRow = ({ data, index, style }: ListChildComponentProps) => {
    const card = deck.cards[index];
    if (!card) return null;
    return (
      <Box style={style}>
        <CardEditor card={card} />
        <Button fullWidth onClick={() => deck.removeCard(card)}>
          Remove
        </Button>
        <Divider />
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
      >{`${deck.allCards.length} cards`}</Typography>
      <Button onClick={() => handleAddCard("")}>Add card</Button>
      <AutoSizer disableHeight>
        {(size: any) => (
          <FixedSizeList
            style={{ maxHeight: 400 }}
            className="List"
            height={deck.cards.length > 0 ? cardComponentHeight : 0}
            itemCount={deck.cards.length}
            itemSize={cardComponentHeight}
            width={size.width}
          >
            {renderRow}
          </FixedSizeList>
        )}
      </AutoSizer>

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
      {
        // deck.allCards.map((card, i) => (
        //   <Box key={i}>
        //     <Paper
        //       variant="outlined"
        //       style={{
        //         marginBottom: theme.spacing(3),
        //         paddingLeft: theme.spacing(3),
        //         paddingRight: theme.spacing(3),
        //         paddingTop: theme.spacing(1),
        //         paddingBottom: theme.spacing(1)
        //       }}
        //     >
        //       <CardEditor card={card} />
        //     </Paper>
        //     {/* <Divider /> */}
        //   </Box>
        // ))
      }
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
      else if (type === EntityType.Card) return new Card({});
      else return new Deck({});
    }, [type, entity, open]);

    const handleSaveClick = async () => {
      if (!isEditing) {
        if (positionGroundPlane) targetEntity.position = positionGroundPlane;
        gameState.addEntity(targetEntity);
      }
      handleClose();
    };

    let typeEditor: React.ReactNode = null;
    if (targetEntity.type === EntityType.Deck) {
      typeEditor = <DeckEditor deck={targetEntity as Deck} />;
    } else if (targetEntity.type === EntityType.Card) {
      typeEditor = <CardEditor card={targetEntity as Card} />;
    }

    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{`${isEditing ? "Edit" : "Add"} entity`}</DialogTitle>
        <DialogContent
          style={{
            flexDirection: "column",
            display: "flex",
            alignItems: "stretch",
            minWidth: 300
          }}
        >
          <FormControl className={classes.formControl}>
            <Select
              fullWidth
              value={type}
              onChange={e => setType(e.target.value as EntityType)}
            >
              <MenuItem value={EntityType.Deck}>Deck</MenuItem>
              <MenuItem value={EntityType.Card}>Card</MenuItem>
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
