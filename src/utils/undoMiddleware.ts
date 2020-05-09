import {
  Patch,
  patchRecorder,
  PatchRecorder,
  actionTrackingMiddleware,
  SimpleActionContext,
  getRootPath,
  Path,
  model,
  Model,
  tProp,
  modelAction,
  applyPatches,
  ActionMiddlewareDisposer,
  types
} from "mobx-keystone";

import { computed, action } from "mobx";

/**
 * An undo/redo event.
 */
export interface UndoEvent {
  /**
   * Path to the object that invoked the action from its root.
   */
  readonly targetPath: Path;
  /**
   * Name of the action that was invoked.
   */
  readonly actionName: string;
  /**
   * Patches with changes done inside the action.
   * Use `redo()` in the `UndoManager` to apply them.
   */
  readonly patches: ReadonlyArray<Patch>;
  /**
   * Patches to undo the changes done inside the action.
   * Use `undo()` in the `UndoManager` to apply them.
   */
  readonly inversePatches: ReadonlyArray<Patch>;
}

/**
 * Store model instance for undo/redo actions.
 * Do not manipulate directly, other that creating it.
 */
@model("UndoStore")
export class UndoStore extends Model({
  // TODO: add proper type checking to undo store
  undoEvents: tProp(
    types.array(types.array(types.unchecked<UndoEvent>())),
    () => []
  ),
  redoEvents: tProp(
    types.array(types.array(types.unchecked<UndoEvent>())),
    () => []
  )
}) {
  isUndoGroup = false;
  eventGroup: UndoEvent[] = [];

  /**
   * @ignore
   */
  @modelAction
  _clearUndo() {
    withoutUndo(() => {
      this.undoEvents.length = 0;
    });
  }

  /**
   * @ignore
   */
  @modelAction
  _clearRedo() {
    withoutUndo(() => {
      this.redoEvents.length = 0;
    });
  }

  /**
   * @ignore
   */
  @modelAction
  _undo() {
    withoutUndo(() => {
      const event = this.undoEvents.pop()!;
      this.redoEvents.push(event);
    });
  }

  /**
   * @ignore
   */
  @modelAction
  _redo() {
    withoutUndo(() => {
      const event = this.redoEvents.pop()!;
      this.undoEvents.push(event);
    });
  }

  /**
   * @ignore
   */
  @modelAction
  _addUndo(event: UndoEvent) {
    withoutUndo(() => {
      if (this.isUndoGroup) this.eventGroup.push(event);
      else {
        this.undoEvents.push([event]);
        // once an undo event is added redo queue is no longer valid
        this.redoEvents.length = 0;
      }
    });
  }

  @modelAction
  groupStarted() {
    this.isUndoGroup = true;
  }

  @modelAction
  groupEnded() {
    if (this.isUndoGroup) {
      this.isUndoGroup = false;
      this.undoEvents.push(this.eventGroup);
      this.eventGroup = [];
      // once an undo event is added redo queue is no longer valid
      this.redoEvents.length = 0;
    }
  }
}

/**
 * Manager class returned by `undoMiddleware` that allows you to perform undo/redo actions.
 */
export class UndoManager {
  /**
   * The store currently being used to store undo/redo action events.
   */
  readonly store: UndoStore;

  /**
   * The undo stack, where the first operation to undo will be the last of the array.
   * Do not manipulate this array directly.
   */
  @computed
  get undoQueue(): ReadonlyArray<UndoEvent[]> {
    return this.store.undoEvents;
  }

  /**
   * The redo stack, where the first operation to redo will be the last of the array.
   * Do not manipulate this array directly.
   */
  @computed
  get redoQueue(): ReadonlyArray<UndoEvent[]> {
    return this.store.redoEvents;
  }

  /**
   * The number of undo actions available.
   */
  @computed
  get undoLevels() {
    return this.undoQueue.length;
  }

  /**
   * If undo can be performed (if there is at least one undo action available).
   */
  @computed
  get canUndo() {
    return this.undoLevels > 0;
  }

  /**
   * Clears the undo queue.
   */
  @action
  clearUndo() {
    this.store._clearUndo();
  }

  /**
   * The number of redo actions available.
   */
  @computed
  get redoLevels() {
    return this.redoQueue.length;
  }

  /**
   * If redo can be performed (if there is at least one redo action available)
   */
  @computed
  get canRedo() {
    return this.redoLevels > 0;
  }

  /**
   * Clears the redo queue.
   */
  @action
  clearRedo() {
    this.store._clearRedo();
  }

  /**
   * Undoes the last action.
   * Will throw if there is no action to undo.
   */
  @action
  undo() {
    if (!this.canUndo) {
      throw new Error("nothing to undo");
    }
    const eventGroup = this.undoQueue[this.undoQueue.length - 1];

    withoutUndo(() => {
      const reversed = [...eventGroup];
      reversed.reverse();
      reversed.forEach(event => {
        applyPatches(this.subtreeRoot, event.inversePatches, true);
      });
    });

    this.store._undo();
  }

  /**
   * Redoes the previous action.
   * Will throw if there is no action to redo.
   */
  @action
  redo() {
    if (!this.canRedo) {
      throw new Error("nothing to redo");
    }
    const eventGroup = this.redoQueue[this.redoQueue.length - 1];

    withoutUndo(() => {
      eventGroup.forEach(event => {
        applyPatches(this.subtreeRoot, event.patches);
      });
    });

    this.store._redo();
  }

  startGroup() {
    this.store.groupStarted();
  }

  endGroup() {
    this.store.groupEnded();
  }

  undoGroup<T>(fn: () => T): T {
    this.startGroup();
    try {
      return fn();
    } finally {
      this.endGroup();
    }
  }

  /**
   * Disposes the undo middleware.
   */
  dispose() {
    this.disposer();
  }

  /**
   * Creates an instance of `UndoManager`.
   * Do not use directly, use `undoMiddleware` instead.
   *
   * @param disposer
   * @param subtreeRoot
   * @param [store]
   */
  constructor(
    private readonly disposer: ActionMiddlewareDisposer,
    private readonly subtreeRoot: object,
    store?: UndoStore
  ) {
    this.store = store || new UndoStore({});
  }
}

export function undoMiddleware(
  subtreeRoot: object,
  blackList?: string[],
  whiteList?: string[],
  store?: UndoStore
): UndoManager {
  interface PatchRecorderData {
    recorder: PatchRecorder;
    recorderStack: number;
  }

  const patchRecorderSymbol = Symbol("patchRecorder");
  function initPatchRecorder(ctx: SimpleActionContext) {
    ctx.rootContext.data[patchRecorderSymbol] = {
      recorder: patchRecorder(subtreeRoot, {
        recording: false,
        filter: patches => {
          return undoDisabledFilter() && patches[0].path[0] === "entities";
        }
      }),
      recorderStack: 0
    } as PatchRecorderData;
  }
  function getPatchRecorderData(ctx: SimpleActionContext): PatchRecorderData {
    return ctx.rootContext.data[patchRecorderSymbol];
  }

  let manager: UndoManager;

  const middlewareDisposer = actionTrackingMiddleware(subtreeRoot, {
    onStart(ctx) {
      if (ctx === ctx.rootContext) {
        initPatchRecorder(ctx);
      }
    },
    onResume(ctx) {
      const patchRecorderData = getPatchRecorderData(ctx);
      if (patchRecorderData) {
        patchRecorderData.recorderStack++;
        patchRecorderData.recorder.recording =
          patchRecorderData.recorderStack > 0;
      }
    },
    onSuspend(ctx) {
      const patchRecorderData = getPatchRecorderData(ctx);
      if (patchRecorderData) {
        patchRecorderData.recorderStack--;
        patchRecorderData.recorder.recording =
          patchRecorderData.recorderStack > 0;
      }
    },
    onFinish(ctx) {
      if (ctx === ctx.rootContext) {
        const patchRecorder = getPatchRecorderData(ctx)?.recorder;

        if (patchRecorder && patchRecorder.events.length > 0) {
          const patches: Patch[] = [];
          const inversePatches: Patch[] = [];

          for (const event of patchRecorder.events) {
            patches.push(...event.patches);
            inversePatches.push(...event.inversePatches);
          }

          manager.store._addUndo({
            targetPath: getRootPath(ctx.target).path,
            actionName: ctx.actionName,
            patches,
            inversePatches
          });

          patchRecorder.dispose();
        }
      }
    }
  });

  manager = new UndoManager(middlewareDisposer, subtreeRoot, store);
  return manager;
}

let undoDisabled = false;

const undoDisabledFilter = () => {
  return !undoDisabled;
};

export function withoutUndo<T>(fn: () => T): T {
  const savedUndoDisabled = undoDisabled;
  undoDisabled = true;
  try {
    return fn();
  } finally {
    undoDisabled = savedUndoDisabled;
  }
}
