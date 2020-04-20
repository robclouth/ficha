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
  Input,
  makeStyles,
  MenuItem,
  Select,
  Typography,
  useTheme,
  Slider
} from "@material-ui/core";
import { observer } from "mobx-react";
import React, { useState, useRef, useMemo, useEffect } from "react";
import { CirclePicker } from "react-color";
import { Canvas, extend, useThree, useFrame } from "react-three-fiber";
//@ts-ignore
import AutoSizer from "react-virtualized-auto-sizer";
//@ts-ignore
import { FixedSizeList, ListChildComponentProps } from "react-window";
import { $enum } from "ts-enum-util";
import Card from "../../models/game/Card";
import CardComponent from "../game/entities/Card";
import Deck from "../../models/game/Deck";
import Entity, { EntityType, Shape } from "../../models/game/Entity";
import EntitySet, { entitySetRef } from "../../models/game/EntitySet";
import Piece from "../../models/game/Piece";
import PieceSet from "../../models/game/PieceSet";
import { useStore } from "../../stores/RootStore";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { draft } from "mobx-keystone";
import { DirectionalLight } from "three";

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
      <Box
        display="flex"
        alignItems="center"
        marginLeft={2}
        width={280}
        // height={300}
      >
        <Canvas
          // style={{ width: 300, height: 300 }}
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

const PieceEditor = observer(({ piece }: { piece: Piece }) => {
  const classes = useStyles();

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
              <MenuItem value={entry[1]}>{entry[0]}</MenuItem>
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
          min={1}
          max={10}
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <FormLabel>Scale Y</FormLabel>
        <Slider
          value={piece.scale.y}
          onChange={(e, value) => piece.setScaleY(value as number)}
          valueLabelDisplay="auto"
          min={1}
          max={10}
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <FormLabel>Scale Z</FormLabel>
        <Slider
          value={piece.scale.z}
          onChange={(e, value) => piece.setScaleZ(value as number)}
          valueLabelDisplay="auto"
          min={1}
          max={10}
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

const cardComponentHeight = 500;

type SetEditorProps = {
  entitySet: EntitySet;
  childType: EntityType;
};

const SetEditor = observer(({ entitySet, childType }: SetEditorProps) => {
  const classes = useStyles();
  const theme = useTheme();
  const [backImageUrl, setBackImageUrl] = useState("");

  const handleBackImageUrlChange = (url: string) => {
    entitySet.entities.forEach(entity => (entity.backImageUrl = url));
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

  const renderRow = ({ data, index, style }: ListChildComponentProps) => {
    const entity = entitySet.entities[index];
    if (!entity) return null;

    return (
      <Box style={style}>
        <CardEditor card={entity as Card} />
        <Button fullWidth onClick={() => entitySet.removeEntity(entity)}>
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
      >{`${entitySet.allEntities.length} cards`}</Typography>
      <Button onClick={() => handleAddEntity("")}>Add card</Button>
      <AutoSizer disableHeight>
        {(size: any) => (
          <FixedSizeList
            // style={{ maxHeight: 400 }}
            className="List"
            height={entitySet.allEntities.length > 0 ? cardComponentHeight : 0}
            itemCount={entitySet.allEntities.length}
            itemSize={cardComponentHeight}
            width={size.width}
          >
            {renderRow}
          </FixedSizeList>
        )}
      </AutoSizer>
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

    const theme = useTheme();
    const [error, setError] = React.useState("");
    const [type, setType] = React.useState(EntityType.Deck);
    const classes = useStyles();

    const isEditing = !!entity;

    const targetEntity = React.useMemo(() => {
      if (isEditing) return entity!;

      if (type === EntityType.Deck) return new Deck({});
      else if (type === EntityType.Card) return new Card({});
      else if (type === EntityType.PieceSet) return new PieceSet({});
      else if (type === EntityType.Piece) return new Piece({});
      else return new Deck({});
    }, [type, entity, open]);

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
      }
      handleClose();
    };

    let typeEditor: React.ReactNode = null;
    if (entityDraft.data.type === EntityType.Deck) {
      typeEditor = (
        <SetEditor
          entitySet={entityDraft.data as EntitySet}
          childType={EntityType.Card}
        />
      );
    } else if (entityDraft.data.type === EntityType.Card) {
      typeEditor = <CardEditor card={entityDraft.data as Card} />;
    } else if (entityDraft.data.type === EntityType.PieceSet) {
      typeEditor = (
        <SetEditor
          entitySet={entityDraft.data as EntitySet}
          childType={EntityType.Piece}
        />
      );
    } else if (entityDraft.data.type === EntityType.Piece) {
      typeEditor = <PieceEditor piece={entityDraft.data as Piece} />;
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
              <FormControl className={classes.formControl}>
                <Input
                  value={entityDraft.data.name}
                  onChange={e => (entityDraft.data.name = e.target.value)}
                  fullWidth
                  placeholder="Name"
                />
              </FormControl>
              {typeEditor}
            </Box>
            <Preview entity={entityDraft.data} active={open} />
          </Box>
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
