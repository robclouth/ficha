import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  InputProps,
  makeStyles,
  MenuItem,
  Popover,
  Select,
  Slider,
  Typography,
  useTheme
} from "@material-ui/core";
import InsertEmoticonIcon from "@material-ui/icons/InsertEmoticon";
//@ts-ignore
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";
import { draft, Draft } from "mobx-keystone";
import { observer } from "mobx-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CirclePicker } from "react-color";
import { Canvas, extend, useFrame, useThree } from "react-three-fiber";
//@ts-ignore
import AutoSizer from "react-virtualized-auto-sizer";
//@ts-ignore
import { FixedSizeList, ListChildComponentProps } from "react-window";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { $enum } from "ts-enum-util";
import Card from "../../models/game/Card";
import Deck from "../../models/game/Deck";
import Entity, { EntityType, Shape } from "../../models/game/Entity";
import EntitySet, { entitySetRef } from "../../models/game/EntitySet";
import Piece from "../../models/game/Piece";
import PieceSet from "../../models/game/PieceSet";
import { useStore } from "../../stores/RootStore";
import Modal from "./Modal";

extend({ OrbitControls });

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

const controlsWidth = 250;

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  emojiInput: {
    "& .emoji-mart": {
      borderWidth: 0,
      fontFamily: theme.typography.fontFamily
    },
    "& .emoji-mart-dark": {
      backgroundColor: theme.palette.background.default
    },
    "& .emoji-mart-category-label span": {
      backgroundColor: theme.palette.background.default,
      fontWeight: theme.typography.fontWeightRegular
    }
  }
}));

function PreviewControls() {
  const controls = useRef<any>();

  const { camera, gl } = useThree();
  useFrame(() => {
    controls.current?.update();
  });

  return (
    <orbitControls
      ref={controls}
      args={[camera, gl.domElement]}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.5}
      enablePan={false}
      enableKeys={false}
    />
  );
}

const Preview = observer(
  ({ entity, active }: { entity: Entity; active: boolean }) => {
    return (
      <Box display="flex" alignItems="center" marginLeft={2} width={280}>
        <Canvas
          invalidateFrameloop={!active}
          noEvents
          camera={{ position: [0, 3, 3], fov: 30 }}
        >
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <ambientLight args={["white", 0.2]} />
          <PreviewControls />
          {entity.render({ entity, pivot: [0, 0, 0] })}
          <gridHelper args={[11, 11]} />
        </Canvas>
      </Box>
    );
  }
);

type EmojiInputProps = InputProps & {
  onTextChange: (text: string) => void;
};

const EmojiInput = observer((props: EmojiInputProps) => {
  const { onTextChange, ...inputProps } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);

  return (
    <>
      <Input
        {...inputProps}
        margin="dense"
        onChange={e => onTextChange(e.target.value)}
        endAdornment={
          <InputAdornment position="end">
            <IconButton onClick={handleClick}>
              <InsertEmoticonIcon />
            </IconButton>
          </InputAdornment>
        }
      />
      <Popover
        className={classes.emojiInput}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
      >
        <Picker
          title="Pick an emoji"
          native={true}
          autoFocus
          color={theme.palette.primary.main}
          theme="dark"
          onSelect={(emoji: any) =>
            props.onTextChange(props.value + emoji.native)
          }
        />
      </Popover>
    </>
  );
});

const CardEditor = observer(
  ({
    entity,
    showBackInput = true
  }: {
    entity: Entity;
    showBackInput?: boolean;
  }) => {
    const classes = useStyles();
    const card = entity as Card;
    const {
      frontImageUrl,
      backImageUrl,
      title,
      subtitle,
      body,
      centerValue,
      cornerValue,
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
              disabled={!!card.ownerSet}
              onChange={e => (card.backImageUrl = e.target.value)}
              fullWidth
              placeholder={"Back image URL"}
            />
            {card.ownerSet && (
              <FormHelperText>
                The back image must be edited in the deck
              </FormHelperText>
            )}
          </FormControl>
        )}
        <FormControl className={classes.formControl}>
          <EmojiInput
            value={title}
            onTextChange={text => (card.title = text)}
            fullWidth
            placeholder="Title"
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <EmojiInput
            value={subtitle}
            onTextChange={text => (card.subtitle = text)}
            fullWidth
            placeholder="Subtitle"
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <EmojiInput
            value={body}
            onTextChange={text => (card.body = text)}
            fullWidth
            placeholder="Body"
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <EmojiInput
            value={cornerValue}
            onTextChange={text => (card.cornerValue = text)}
            fullWidth
            placeholder="Corner text"
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <EmojiInput
            value={centerValue}
            onTextChange={text => (card.centerValue = text)}
            fullWidth
            placeholder="Center text"
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

const PieceEditor = observer(({ entity }: { entity: Entity }) => {
  const classes = useStyles();

  const piece = entity as Piece;
  const { color, shape } = piece;

  useEffect(() => {
    if (shape === Shape.Cylinder) {
      piece.shapeParam1 = 10;
    } else if (shape === Shape.Cone) {
      piece.shapeParam1 = 10;
    } else if (shape === Shape.Ring) {
      piece.shapeParam1 = piece.shapeParam2 = 10;
    }
  }, [shape]);

  let shapeControls: React.ReactNode | undefined;

  if (shape === Shape.Cube) shapeControls = undefined;
  else if (shape === Shape.Cylinder) {
    shapeControls = (
      <FormControl className={classes.formControl}>
        <FormLabel>Sides</FormLabel>
        <Slider
          value={piece.shapeParam1}
          onChange={(e, value) => (piece.shapeParam1 = value as number)}
          valueLabelDisplay="auto"
          min={3}
          max={20}
        />
      </FormControl>
    );
  } else if (shape === Shape.Cone) {
    shapeControls = (
      <FormControl className={classes.formControl}>
        <FormLabel>Sides</FormLabel>
        <Slider
          value={piece.shapeParam1}
          onChange={(e, value) => (piece.shapeParam1 = value as number)}
          valueLabelDisplay="auto"
          min={3}
          max={20}
        />
      </FormControl>
    );
  } else if (shape === Shape.Ring) {
    shapeControls = (
      <>
        <FormControl className={classes.formControl}>
          <FormLabel>Radial segments</FormLabel>
          <Slider
            value={piece.shapeParam1}
            onChange={(e, value) => (piece.shapeParam1 = value as number)}
            valueLabelDisplay="auto"
            min={3}
            max={20}
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <FormLabel>Tubular segments</FormLabel>
          <Slider
            value={piece.shapeParam2}
            onChange={(e, value) => (piece.shapeParam2 = value as number)}
            valueLabelDisplay="auto"
            min={3}
            max={20}
          />
        </FormControl>
      </>
    );
  }

  return (
    <Box display="flex" flexDirection="column">
      <FormControl className={classes.formControl}>
        <Select
          fullWidth
          value={shape}
          onChange={e => (piece.shape = e.target.value as Shape)}
        >
          {$enum(Shape)
            .getEntries()
            .map(entry => (
              <MenuItem key={entry[1]} value={entry[1]}>
                {entry[0]}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      {shapeControls}
      <FormControl className={classes.formControl}>
        <FormLabel>Scale X</FormLabel>
        <Slider
          value={piece.scale.x}
          onChange={(e, value) => piece.setScaleX(value as number)}
          valueLabelDisplay="auto"
          min={0.1}
          max={10}
          step={0.1}
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <FormLabel>Scale Y</FormLabel>
        <Slider
          value={piece.scale.y}
          onChange={(e, value) => piece.setScaleY(value as number)}
          valueLabelDisplay="auto"
          min={0.1}
          max={10}
          step={0.1}
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <FormLabel>Scale Z</FormLabel>
        <Slider
          value={piece.scale.z}
          onChange={(e, value) => piece.setScaleZ(value as number)}
          valueLabelDisplay="auto"
          min={0.1}
          max={10}
          step={0.1}
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
              (piece.color = {
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
});

type InputSliderProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};
const InputSlider = observer(
  ({ value, onChange, min, max }: InputSliderProps) => {
    const classes = useStyles();

    const handleSliderChange = (event: any, newValue: number | number[]) => {
      onChange(newValue as number);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value === "" ? min : Number(event.target.value));
    };

    const handleBlur = () => {
      if (value < min) {
        onChange(min);
      } else if (value > max) {
        onChange(max);
      }
    };

    return (
      <Grid
        container
        spacing={2}
        alignItems="center"
        style={{ paddingLeft: 10 }}
      >
        <Grid item xs>
          <Slider
            value={value}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
          />
        </Grid>
        <Grid item>
          <Input
            style={{ width: 42 }}
            value={value}
            margin="dense"
            onChange={handleInputChange}
            onBlur={handleBlur}
            inputProps={{
              step: 1,
              min,
              max,
              type: "number",
              "aria-labelledby": "input-slider"
            }}
          />
        </Grid>
      </Grid>
    );
  }
);

type EntityListProps = {
  entitySet: EntitySet;
  editor: React.FunctionComponent<any>;
  itemHeight: number;
};

const EntityList = observer(
  ({ entitySet, editor, itemHeight }: EntityListProps) => {
    const classes = useStyles();

    const renderRow = useCallback(
      ({ data, index, style }: ListChildComponentProps) => {
        const { entity, count } = data[index];

        return (
          <Box
            key={index}
            style={style}
            flexDirection="column"
            alignItems="stretch"
          >
            <FormControl
              className={classes.formControl}
              style={{ width: "100%" }}
            >
              <FormLabel>Count</FormLabel>
              <InputSlider
                value={count}
                onChange={value => entitySet.setPrototypeCount(entity, value)}
                min={1}
                max={1000}
              />
            </FormControl>
            {React.createElement(editor, { entity })}
            <Button fullWidth onClick={() => entitySet.removePrototype(entity)}>
              Remove
            </Button>
            <Divider />
          </Box>
        );
      },
      [entitySet]
    );

    const items = entitySet.prototypes.map(entity => ({
      entity,
      count: entitySet.prototypeCounts[entity.$modelId]
    }));

    return (
      <AutoSizer disableHeight>
        {(size: any) => (
          <FixedSizeList
            className="List"
            height={entitySet.prototypes.length > 0 ? itemHeight : 0}
            itemCount={entitySet.prototypes.length}
            itemSize={itemHeight}
            itemData={items}
            width={size.width}
          >
            {renderRow}
          </FixedSizeList>
        )}
      </AutoSizer>
    );
  }
);

type SetEditorProps = {
  entitySet: EntitySet;
};

const DeckEditor = observer(({ entitySet }: SetEditorProps) => {
  const classes = useStyles();
  const [backImageUrl, setBackImageUrl] = useState("");

  const handleBackImageUrlChange = (url: string) => {
    entitySet.containedEntities.forEach(entity => (entity.backImageUrl = url));
    setBackImageUrl(url);
  };

  const handleBulkAdd = (text: string) => {
    const urls = text.split(",").map(url => url.trim());
    urls.forEach(url => handleAddEntity(url));
  };

  const handleAddEntity = (frontImageUrl: string) => {
    entitySet.addEntity(
      new Card({
        frontImageUrl,
        backImageUrl,
        ownerSet: entitySetRef(entitySet)
      })
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
      >{`${entitySet.allEntities.length} cards`}</Typography>
      <Button onClick={() => handleAddEntity("")}>Add card</Button>
      <EntityList entitySet={entitySet} editor={CardEditor} itemHeight={500} />
    </Box>
  );
});

const PieceSetEditor = observer(({ entitySet }: SetEditorProps) => {
  const handleAddEntity = (frontImageUrl: string) => {
    entitySet.addPrototype(
      new Piece({
        ownerSet: entitySetRef(entitySet)
      })
    );
  };

  return (
    <Box display="flex" flexDirection="column">
      <Typography
        variant="body1"
        gutterBottom
      >{`${entitySet.prototypesWithDuplicates.length} pieces`}</Typography>
      <Button onClick={() => handleAddEntity("")}>Add piece</Button>
      <EntityList entitySet={entitySet} editor={PieceEditor} itemHeight={500} />
    </Box>
  );
});

type EntityEditorProps = {
  entity: Entity;
  editor: React.ReactNode;
};
const EntityEditor = observer(({ entity, editor }: EntityEditorProps) => {
  const classes = useStyles();
  return (
    <>
      <FormControl className={classes.formControl}>
        <Input
          value={entity.name}
          onChange={e => (entity.name = e.target.value)}
          fullWidth
          placeholder="Name"
        />
      </FormControl>
      {editor}
    </>
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
    const { gameStore } = useStore();
    const { gameState } = gameStore;

    const [type, setType] = React.useState(EntityType.Deck);
    const classes = useStyles();

    const isEditing = !!entity;

    const targetEntity = React.useMemo(() => {
      if (isEditing) return entity!;

      if (type === EntityType.Deck) return new Deck({ name: "New Deck" });
      else if (type === EntityType.Card) return new Card({ name: "New Card" });
      else if (type === EntityType.PieceSet)
        return new PieceSet({ name: "New Piece Set" });
      else if (type === EntityType.Piece)
        return new Piece({ name: "New Piece" });
      else return new Deck({});
    }, [type, isEditing]);

    const entityDraft = draft(targetEntity);
    entityDraft.data.position = [0, 0];
    entityDraft.data.angle = 0;

    const handleSaveClick = async () => {
      entityDraft.resetByPath(["position"]);
      entityDraft.resetByPath(["angle"]);
      entityDraft.commit();
      if (!isEditing) {
        if (positionGroundPlane) targetEntity.position = positionGroundPlane;
        gameState.addEntity(targetEntity);
      } else {
        if (targetEntity instanceof EntitySet)
          (targetEntity as EntitySet).updateInstances();
      }
      handleClose();
    };

    let typeEditor: React.ReactNode = null;
    if (entityDraft.data.type === EntityType.Deck) {
      typeEditor = <DeckEditor entitySet={entityDraft.data as EntitySet} />;
    } else if (entityDraft.data.type === EntityType.Card) {
      typeEditor = <CardEditor entity={entityDraft.data} />;
    } else if (entityDraft.data.type === EntityType.PieceSet) {
      typeEditor = <PieceSetEditor entitySet={entityDraft.data as EntitySet} />;
    } else if (entityDraft.data.type === EntityType.Piece) {
      typeEditor = <PieceEditor entity={entityDraft.data} />;
    }

    return (
      <Modal
        open={open}
        handleClose={handleClose}
        title={`${isEditing ? "Edit" : "Add"} entity`}
        content={
          <Box display="flex" height={600}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="stretch"
              width={400}
            >
              {!isEditing && (
                <FormControl className={classes.formControl}>
                  <Select
                    fullWidth
                    value={type}
                    onChange={e => setType(e.target.value as EntityType)}
                  >
                    <MenuItem value={EntityType.Deck}>Deck</MenuItem>
                    <MenuItem value={EntityType.Card}>Card</MenuItem>
                    <MenuItem value={EntityType.PieceSet}>Piece set</MenuItem>
                    <MenuItem value={EntityType.Piece}>Piece</MenuItem>
                  </Select>
                </FormControl>
              )}
              <EntityEditor entity={entityDraft.data} editor={typeEditor} />
            </Box>
            <Preview entity={entityDraft.data} active={open} />
          </Box>
        }
        actions={
          <>
            <Button onClick={handleSaveClick} color="primary">
              {isEditing ? "Save" : "Add"}
            </Button>
          </>
        }
      />
    );
  }
);
