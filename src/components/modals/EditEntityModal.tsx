import {
  Box,
  Button,
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
  Paper,
  Popover,
  Select,
  Slider,
  Typography,
  useTheme,
  FormControlLabel,
  Switch,
  InputLabel,
  SliderProps
} from "@material-ui/core";
import { useTranslation } from "react-i18next";

import InsertEmoticonIcon from "@material-ui/icons/InsertEmoticon";
import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";
import Pagination from "@material-ui/lab/Pagination";
//@ts-ignore
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";
import { draft } from "mobx-keystone";
import { observer } from "mobx-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CirclePicker } from "react-color";
import { Canvas, extend, useFrame, useThree } from "react-three-fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { $enum } from "ts-enum-util";
import Card, { Shape as CardShape } from "../../models/game/Card";
import Deck from "../../models/game/Deck";
import Dice, { DiceType } from "../../models/game/Dice";
import Entity, { EntityType } from "../../models/game/Entity";
import EntitySet, { entitySetRef } from "../../models/game/EntitySet";
import Piece, { Shape } from "../../models/game/Piece";
import PieceSet from "../../models/game/PieceSet";
import { useStore } from "../../stores/RootStore";
import Modal from "./Modal";
import Board from "../../models/game/Board";
import { runInAction } from "mobx";

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

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5)
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
  ({ entity, active }: { entity?: Entity; active: boolean }) => {
    const theme = useTheme();
    return (
      <Paper
        variant="outlined"
        style={{
          display: "flex",
          alignItems: "center",
          flex: 1
        }}
      >
        <Canvas
          invalidateFrameloop={!active}
          noEvents
          camera={{ position: [0, 3, 3], fov: 30 }}
        >
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <ambientLight args={["white", 0.5]} />
          <PreviewControls />
          {entity && entity.render({ entity, pivot: [0, 0, 0] })}
          <gridHelper args={[11, 11]} />
        </Canvas>
      </Paper>
    );
  }
);

const ColorPicker = observer(({ entity }: { entity: Entity }) => {
  const classes = useStyles();
  return (
    <FormControl className={classes.formControl} style={{ marginBottom: 0 }}>
      <InputLabel shrink>Color</InputLabel>
      <Box
        padding={1}
        marginTop={2}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CirclePicker
          colors={colorOptions}
          circleSpacing={5}
          circleSize={20}
          color={{
            r: Math.floor(entity.color.r * 255),
            g: Math.floor(entity.color.g * 255),
            b: Math.floor(entity.color.b * 255)
          }}
          onChange={color =>
            (entity.color = {
              r: color.rgb.r / 255,
              g: color.rgb.g / 255,
              b: color.rgb.b / 255
            })
          }
          width={"230px"}
        />
      </Box>
    </FormControl>
  );
});

type EmojiInputProps = InputProps & {
  onTextChange: (text: string) => void;
};

const EmojiInput = observer((props: EmojiInputProps) => {
  const { t } = useTranslation();

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
          title={t("pickAnEmoji")}
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
    const { t } = useTranslation();

    const classes = useStyles();
    const card = entity as Card;
    const {
      frontImageUrl,
      backImageUrl,
      cornerTexts,
      centerText,
      ownerSet,
      shape
    } = card;

    return (
      <Box display="flex" flexDirection="column">
        {!ownerSet?.maybeCurrent && (
          <FormControl
            className={classes.formControl}
            style={{ marginBottom: 12 }}
          >
            <InputLabel shrink>{t("shape")}</InputLabel>
            <Select
              margin="dense"
              fullWidth
              value={shape}
              onChange={e => (card.shape = e.target.value as CardShape)}
            >
              {$enum(CardShape)
                .getEntries()
                .map(entry => (
                  <MenuItem key={entry[1]} value={entry[1]}>
                    {entry[0]}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}
        <FormControl>
          <InputLabel shrink>{t("thickness")}</InputLabel>
          <Slider
            style={{ marginTop: 15 }}
            value={card.scale.y}
            onChange={(e, value) => card.setScaleY(value as number)}
            valueLabelDisplay="auto"
            min={1}
            max={10}
            step={0.1}
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <InputLabel>{t("frontImageUrl")}</InputLabel>
          <Input
            margin="dense"
            value={frontImageUrl}
            onChange={e => (card.frontImageUrl = e.target.value)}
            fullWidth
          />
        </FormControl>
        {!ownerSet?.maybeCurrent && (
          <FormControl className={classes.formControl}>
            <InputLabel>{t("frontImageUrl")}</InputLabel>
            <Input
              margin="dense"
              value={backImageUrl}
              onChange={e => (card.backImageUrl = e.target.value)}
              fullWidth
            />
          </FormControl>
        )}
        <FormControl className={classes.formControl}>
          <InputLabel>{t("cornerTexts")}</InputLabel>
          <EmojiInput
            value={cornerTexts}
            onTextChange={text => (card.cornerTexts = text)}
            fullWidth
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <InputLabel>{t("centerText")}</InputLabel>
          <EmojiInput
            value={centerText}
            onTextChange={text => (card.centerText = text)}
            fullWidth
          />
        </FormControl>
        <ColorPicker entity={card} />
      </Box>
    );
  }
);

const PieceEditor = observer(({ entity }: { entity: Entity }) => {
  const { t } = useTranslation();

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
      <FormControl>
        <InputLabel shrink>{t("sides")}</InputLabel>
        <Slider
          style={{ marginTop: 15 }}
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
      <FormControl>
        <InputLabel shrink>{t("sides")}</InputLabel>
        <Slider
          style={{ marginTop: 15 }}
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
        <FormControl>
          <InputLabel shrink>{t("radialSegments")}</InputLabel>
          <Slider
            style={{ marginTop: 15 }}
            value={piece.shapeParam1}
            onChange={(e, value) => (piece.shapeParam1 = value as number)}
            valueLabelDisplay="auto"
            min={3}
            max={20}
          />
        </FormControl>
        <FormControl>
          <InputLabel shrink>{t("tubularSegments")}</InputLabel>
          <Slider
            style={{ marginTop: 15 }}
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
      <FormControl className={classes.formControl} style={{ marginBottom: 20 }}>
        <InputLabel shrink>{t("shape")}</InputLabel>
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
      <FormControl>
        <InputLabel shrink>{t("scaleX")}</InputLabel>
        <Slider
          style={{ marginTop: 15 }}
          value={piece.scale.x}
          onChange={(e, value) => piece.setScaleX(value as number)}
          valueLabelDisplay="auto"
          min={0.1}
          max={10}
          step={0.1}
        />
      </FormControl>
      <FormControl>
        <InputLabel shrink>{t("scaleY")}</InputLabel>
        <Slider
          style={{ marginTop: 15 }}
          value={piece.scale.y}
          onChange={(e, value) => piece.setScaleY(value as number)}
          valueLabelDisplay="auto"
          min={0.1}
          max={10}
          step={0.1}
        />
      </FormControl>
      <FormControl>
        <InputLabel shrink>{t("scaleZ")}</InputLabel>
        <Slider
          style={{ marginTop: 15 }}
          value={piece.scale.z}
          onChange={(e, value) => piece.setScaleZ(value as number)}
          valueLabelDisplay="auto"
          min={0.1}
          max={10}
          step={0.1}
        />
      </FormControl>
      <ColorPicker entity={piece} />
    </Box>
  );
});

const DiceEditor = observer(({ entity }: { entity: Entity }) => {
  const { t } = useTranslation();

  const classes = useStyles();
  const theme = useTheme();
  const dice = entity as Dice;
  const { color, diceType, labels } = dice;

  return (
    <Box display="flex" flexDirection="column">
      <FormControl className={classes.formControl}>
        <InputLabel shrink>{t("type")}</InputLabel>
        <Select
          margin="dense"
          fullWidth
          value={diceType}
          onChange={e => (dice.diceType = e.target.value as DiceType)}
        >
          {$enum(DiceType)
            .getEntries()
            .map(entry => (
              <MenuItem key={entry[1]} value={entry[1]}>
                {entry[0]}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      <FormControl className={classes.formControl}>
        <InputLabel>{t("sides")}</InputLabel>
        <EmojiInput
          multiline
          value={labels.join(",")}
          onTextChange={text => (dice.labels = text.trimStart().split(","))}
          fullWidth
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <InputLabel shrink>{t("scale")}</InputLabel>
        <Slider
          style={{ marginTop: 15 }}
          value={dice.scale.x}
          onChange={(e, value) => dice.setScale(value as number)}
          valueLabelDisplay="auto"
          min={1}
          max={10}
          step={0.1}
        />
      </FormControl>
      <ColorPicker entity={dice} />
    </Box>
  );
});

const BoardEditor = observer(({ entity }: { entity: Entity }) => {
  const { t } = useTranslation();

  const classes = useStyles();
  const theme = useTheme();
  const board = entity as Board;
  const { frontImageUrl, scale } = board;

  return (
    <Box display="flex" flexDirection="column">
      <FormControl className={classes.formControl}>
        <InputLabel>{t("imageUrl")}</InputLabel>
        <Input
          margin="dense"
          value={frontImageUrl}
          onChange={e => (board.frontImageUrl = e.target.value)}
          fullWidth
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <InputLabel shrink>{t("scale")}</InputLabel>
        <Slider
          style={{ marginTop: 15 }}
          value={scale.x}
          onChange={(e, value) => {
            board.setScaleX(value as number);
            board.setScaleZ(value as number);
          }}
          valueLabelDisplay="auto"
          min={0.1}
          max={10}
          step={0.1}
        />
      </FormControl>
    </Box>
  );
});

type InputSliderProps = SliderProps & {
  step?: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
};

function InputSlider(props: InputSliderProps) {
  const classes = useStyles();
  const [value, setValue] = React.useState<
    number | string | Array<number | string>
  >(30);

  const handleSliderChange = (event: any, newValue: number | number[]) => {
    setValue(newValue);
    props.onValueChange(newValue as number);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value === "" ? "" : Number(event.target.value));
    props.onValueChange(Number(event.target.value));
  };

  const handleBlur = () => {
    if (value < props.min) {
      setValue(props.min);
    } else if (value > props.max) {
      setValue(props.max);
    }
  };

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid item xs>
        <Slider
          {...props}
          value={typeof value === "number" ? value : 0}
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
            step: props.step,
            min: props.min,
            max: props.max,
            type: "number",
            "aria-labelledby": "input-slider"
          }}
        />
      </Grid>
    </Grid>
  );
}

type EntityListProps = {
  entitySet: EntitySet;
  editor: React.FunctionComponent<any>;
  childEntityName: string;
  getNewEntity: () => Entity;
  onPreviewEntityChange: (entity?: Entity) => void;
};

const EntityList = observer(
  ({
    entitySet,
    editor,
    getNewEntity,
    childEntityName,
    onPreviewEntityChange
  }: EntityListProps) => {
    const { t } = useTranslation();

    const [index, setIndex] = useState(0);
    const entity =
      entitySet.prototypes.length > 0 ? entitySet.prototypes[index] : undefined;
    const count = entity && entitySet.prototypeCounts[entity.$modelId];

    const handleAddEntity = () => {
      const prototype = getNewEntity();
      entitySet.addPrototype(prototype);
      if (entitySet.prototypes.length === 1) onPreviewEntityChange(prototype);

      handleSelectedEntityChange(entitySet.prototypes.length - 1);
    };

    const handleRemove = () => {
      if (index <= entitySet.prototypes.length)
        handleSelectedEntityChange(index - 1);
      if (entity) entitySet.removePrototype(entity);
      if (entitySet.prototypes.length === 0) onPreviewEntityChange(undefined);
    };

    const handleSelectedEntityChange = (index: number) => {
      onPreviewEntityChange(entitySet.prototypes[index]);
      setIndex(index);
    };

    return (
      <Box display="flex" flexDirection="column" alignItems="stretch" flex={1}>
        <Grid container alignItems="center" justify="space-evenly">
          <Grid item xs style={{ display: "flex", justifyContent: "center" }}>
            {entitySet.prototypes.length > 0 && (
              <IconButton onClick={handleRemove}>
                <RemoveIcon />
              </IconButton>
            )}
          </Grid>
          <Grid item xs style={{ display: "flex", justifyContent: "center" }}>
            <Typography variant="body1" gutterBottom>{`${
              entitySet.prototypesWithDuplicates.length
            } ${t(childEntityName, {
              count: entitySet.prototypesWithDuplicates.length
            }).toLowerCase()}`}</Typography>
          </Grid>
          <Grid item xs style={{ display: "flex", justifyContent: "center" }}>
            <IconButton onClick={() => handleAddEntity()}>
              <AddIcon />
            </IconButton>
          </Grid>
        </Grid>
        {entitySet.prototypes.length > 0 && (
          <Box display="flex" justifyContent="center" marginBottom={1}>
            <Pagination
              size="small"
              count={entitySet.prototypes.length}
              siblingCount={1}
              boundaryCount={1}
              page={index + 1}
              onChange={(e, value) => handleSelectedEntityChange(value - 1)}
            />
          </Box>
        )}
        <Box flexDirection="column" alignItems="stretch" flex={1}>
          {entitySet.prototypes.length > 0 && (
            <>
              <FormControl style={{ width: "100%" }}>
                <InputLabel shrink>{t("count")}</InputLabel>
                <InputSlider
                  style={{ marginTop: 15 }}
                  value={count}
                  valueLabelDisplay="off"
                  onValueChange={value =>
                    entity && entitySet.setPrototypeCount(entity, value)
                  }
                  min={0}
                  max={100}
                />
              </FormControl>
              {React.createElement(editor, { entity })}
            </>
          )}
        </Box>
      </Box>
    );
  }
);

type SetEditorProps = {
  entitySet: EntitySet;
  onPreviewEntityChange: (entity?: Entity) => void;
};

const DeckEditor = observer(
  ({ entitySet, onPreviewEntityChange }: SetEditorProps) => {
    const { t } = useTranslation();

    const classes = useStyles();
    const [backImageUrl, setBackImageUrl] = useState("");
    const deck = entitySet as Deck;
    const { shape } = deck;

    const handleBackImageUrlChange = (url: string) => {
      entitySet.containedEntities.forEach(
        entity => (entity.backImageUrl = url)
      );
      setBackImageUrl(url);
    };

    const handleBulkAdd = (text: string) => {
      const urls = text.split(",").map(url => url.trim());
      runInAction(() => {
        urls.forEach(url => handleAddEntity(url));
      });
    };

    const handleAddEntity = (frontImageUrl: string) => {
      entitySet.addPrototype(
        new Card({
          frontImageUrl,
          backImageUrl,
          ownerSet: entitySetRef(entitySet)
        })
      );
    };

    return (
      <Box display="flex" flexDirection="column" flex={1}>
        <FormControl className={classes.formControl}>
          <InputLabel shrink>{t("shape")}</InputLabel>
          <Select
            margin="dense"
            fullWidth
            value={shape}
            onChange={e => (deck.shape = e.target.value as CardShape)}
          >
            {$enum(CardShape)
              .getEntries()
              .map(entry => (
                <MenuItem key={entry[1]} value={entry[1]}>
                  {entry[0]}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <FormControl className={classes.formControl}>
          <InputLabel>{t("backImageUrl")}</InputLabel>
          <Input
            margin="dense"
            value={backImageUrl}
            onChange={e => handleBackImageUrlChange(e.target.value)}
            fullWidth
          />
        </FormControl>
        <FormControl className={classes.formControl}>
          <Input
            margin="dense"
            value=""
            fullWidth
            placeholder={t("bulkAdd")}
            onChange={e => handleBulkAdd(e.target.value)}
          />
        </FormControl>
        <EntityList
          entitySet={entitySet}
          editor={CardEditor}
          childEntityName="card"
          onPreviewEntityChange={onPreviewEntityChange}
          getNewEntity={() =>
            new Card({
              backImageUrl,
              frontImageUrl: "",
              ownerSet: entitySetRef(entitySet)
            })
          }
        />
      </Box>
    );
  }
);

const PieceSetEditor = observer(
  ({ entitySet, onPreviewEntityChange }: SetEditorProps) => {
    return (
      <Box display="flex" flexDirection="column" flex={1}>
        <EntityList
          entitySet={entitySet}
          onPreviewEntityChange={onPreviewEntityChange}
          editor={PieceEditor}
          childEntityName="piece"
          getNewEntity={() =>
            new Piece({
              ownerSet: entitySetRef(entitySet)
            })
          }
        />
      </Box>
    );
  }
);

type EntityEditorProps = {
  entity: Entity;
  editor: React.ReactNode;
};

const EntityEditor = observer(({ entity, editor }: EntityEditorProps) => {
  const classes = useStyles();
  return <>{editor}</>;
});

export type ModalProps = {
  open: boolean;
  positionGroundPlane?: [number, number];
  entity?: Entity;
  handleClose: () => void;
};

export default observer(
  ({ open, handleClose, positionGroundPlane, entity }: ModalProps) => {
    const { t } = useTranslation();

    const classes = useStyles();

    const { gameStore } = useStore();
    const { gameState } = gameStore;

    const [type, setType] = React.useState(EntityType.Deck);
    const [previewEntity, setPreviewEntity] = React.useState<Entity>();

    const isEditing = !!entity;

    const entityDraft = React.useMemo(() => {
      let targetEntity: Entity;

      if (isEditing) targetEntity = entity!;
      else {
        if (type === EntityType.Deck)
          targetEntity = new Deck({ name: t("newDeck") });
        else if (type === EntityType.Card)
          targetEntity = new Card({
            name: t("newDeck"),
            color: { r: 1, g: 1, b: 1 }
          });
        else if (type === EntityType.PieceSet)
          targetEntity = new PieceSet({ name: t("newDeck") });
        else if (type === EntityType.Piece)
          targetEntity = new Piece({ name: t("newDeck") });
        else if (type === EntityType.Dice)
          targetEntity = new Dice({
            name: t("newDeck"),
            diceType: DiceType.D6,
            scale: { x: 2, y: 2, z: 2 }
          });
        else targetEntity = new Board({ name: t("newBoard") });
      }

      const newDraft = draft(targetEntity);
      newDraft.data.position = { x: 0, y: 0, z: 0 };
      newDraft.data.angle = 0;
      return newDraft;
    }, [type, isEditing]);

    const handleSaveClick = async () => {
      entityDraft.resetByPath(["position"]);
      entityDraft.resetByPath(["angle"]);
      entityDraft.commit();

      if (!isEditing) {
        if (positionGroundPlane)
          entityDraft.originalData.position = {
            x: positionGroundPlane[0],
            y: 0,
            z: positionGroundPlane[1]
          };
        gameState.addEntity(entityDraft.originalData);
      }

      if (entityDraft.originalData instanceof EntitySet) {
        const entitySet = entityDraft.originalData as EntitySet;
        entitySet.refill();
        entitySet.updateInstances();
      }

      handleClose();
    };

    const handlePreviewEntityChange = (entity?: Entity) => {
      setPreviewEntity(entity);
    };

    let typeEditor: React.ReactNode = useMemo(() => {
      if (entityDraft.data.type === EntityType.Deck) {
        handlePreviewEntityChange(
          (entityDraft.data as EntitySet).prototypes[0]
        );
        return (
          <DeckEditor
            entitySet={entityDraft.data as EntitySet}
            onPreviewEntityChange={handlePreviewEntityChange}
          />
        );
      } else if (entityDraft.data.type === EntityType.Card) {
        handlePreviewEntityChange(entityDraft.data);
        return <CardEditor entity={entityDraft.data} />;
      } else if (entityDraft.data.type === EntityType.PieceSet) {
        handlePreviewEntityChange(
          (entityDraft.data as EntitySet).prototypes[0]
        );
        return (
          <PieceSetEditor
            entitySet={entityDraft.data as EntitySet}
            onPreviewEntityChange={handlePreviewEntityChange}
          />
        );
      } else if (entityDraft.data.type === EntityType.Piece) {
        handlePreviewEntityChange(entityDraft.data);
        return <PieceEditor entity={entityDraft.data} />;
      } else if (entityDraft.data.type === EntityType.Dice) {
        handlePreviewEntityChange(entityDraft.data);
        return <DiceEditor entity={entityDraft.data} />;
      } else if (entityDraft.data.type === EntityType.Board) {
        handlePreviewEntityChange(entityDraft.data);
        return <BoardEditor entity={entityDraft.data} />;
      }
    }, [entityDraft.data.type]);

    return (
      <Modal
        open={open}
        handleClose={handleClose}
        title={`${isEditing ? t("edit") : t("add")} ${t(
          "object"
        ).toLocaleLowerCase()}`}
        content={
          <Box display="flex" height={670}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="stretch"
              width={250}
              marginRight={2}
            >
              {!isEditing && (
                <FormControl className={classes.formControl}>
                  <InputLabel shrink>{t("type")}</InputLabel>
                  <Select
                    margin="dense"
                    fullWidth
                    value={type}
                    onChange={e => setType(e.target.value as EntityType)}
                  >
                    <MenuItem value={EntityType.Deck}>{t("deck")}</MenuItem>
                    <MenuItem value={EntityType.Card}>{t("card")}</MenuItem>
                    <MenuItem value={EntityType.PieceSet}>
                      {t("pieceSet")}
                    </MenuItem>
                    <MenuItem value={EntityType.Piece}>{t("piece")}</MenuItem>
                    <MenuItem value={EntityType.Dice}>{t("die")}</MenuItem>
                    <MenuItem value={EntityType.Board}>{t("board")}</MenuItem>
                  </Select>
                </FormControl>
              )}
              <FormControl className={classes.formControl}>
                <InputLabel shrink>{t("name")}</InputLabel>
                <Input
                  margin="dense"
                  value={entityDraft.data.name}
                  onChange={e => (entityDraft.data.name = e.target.value)}
                  fullWidth
                />
              </FormControl>
              <FormControl className={classes.formControl}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={entityDraft.data.stackable}
                      onChange={e =>
                        (entityDraft.data.stackable = e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={t("stackable")}
                />
              </FormControl>
              <Preview entity={previewEntity} active={open} />
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="stretch"
              width={270}
            >
              <EntityEditor entity={entityDraft.data} editor={typeEditor} />
            </Box>
          </Box>
        }
        actions={
          <>
            <Button onClick={handleSaveClick} color="primary">
              {isEditing ? t("save") : t("add")}
            </Button>
          </>
        }
      />
    );
  }
);
