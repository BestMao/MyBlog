# react 整体流程

<a name="XHfcC"></a>

## ![1.jpg](https://cdn.nlark.com/yuque/0/2022/jpeg/1350314/1646810443482-324257dd-166f-43e2-b001-7ddfb5c3e016.jpeg##clientId=uca19d5ea-65bb-4&crop=0&crop=0&crop=1&crop=1&from=ui&id=u117b43d6&margin=%5Bobject%20Object%5D&name=1.jpg&originHeight=9000&originWidth=3183&originalType=binary&ratio=1&rotation=0&showTitle=false&size=1109975&status=done&style=none&taskId=ua1cc01e3-9ec6-44b5-abc5-42d8159ba59&title=)

[react 整体流程.pdf](https://www.yuque.com/attachments/yuque/0/2022/pdf/1350314/1646810466755-1de85592-ad76-4dc3-992e-9c8be2d7c51e.pdf?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2022%2Fpdf%2F1350314%2F1646810466755-1de85592-ad76-4dc3-992e-9c8be2d7c51e.pdf%22%2C%22name%22%3A%22react%E6%95%B4%E4%BD%93%E6%B5%81%E7%A8%8B.pdf%22%2C%22size%22%3A103639%2C%22type%22%3A%22application%2Fpdf%22%2C%22ext%22%3A%22pdf%22%2C%22status%22%3A%22done%22%2C%22taskId%22%3A%22ub5d0b070-a7b9-441a-8c6d-98f67c6ed4e%22%2C%22taskType%22%3A%22upload%22%2C%22id%22%3A%22udfc6fb07%22%2C%22card%22%3A%22file%22%7D)
<a name="wx4wH"></a>

## 更新/初始化

legacyRenderSubtreeIntoContainer

```javascript
function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>,
  children: ReactNodeList,
  container: Container,
  forceHydrate: boolean,
  callback: ?Function
) {
  //...
  let root: RootType = (container._reactRootContainer: any);
  let fiberRoot;
  if (!root) {
    // 初始化走非批量更新分支
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else {
    // Update
    //...
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}
```

updateContainer

```javascript
export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function
): Lane {
  const current = container.current;
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current);

  if (enableSchedulingProfiler) {
    markRenderScheduled(lane);
  }

  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  const update = createUpdate(eventTime, lane);

  update.payload = { element };

  enqueueUpdate(current, update);
  // 调度更新fiber
  scheduleUpdateOnFiber(current, lane, eventTime);

  return lane;
}
```

classComponentUpdater

```javascript
const classComponentUpdater = {
  isMounted,
  enqueueSetState(inst, payload, callback) {
    const fiber = getInstance(inst);
    const eventTime = requestEventTime();
    const lane = requestUpdateLane(fiber);

    // 生成此次setState的updape
    const update = createUpdate(eventTime, lane);
    update.payload = payload;
    if (callback !== undefined && callback !== null) {
      if (__DEV__) {
        warnOnInvalidCallback(callback, "setState");
      }
      update.callback = callback;
    }
    // 将这次update放入filber中的更新列表中
    enqueueUpdate(fiber, update, lane);
    // 对filber进行调度

    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);

    if (enableSchedulingProfiler) {
      markStateUpdateScheduled(fiber, lane);
    }
  },
};
```

dispatchSetState

```javascript
function dispatchSetState<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A
) {
  const update: Update<S, A> = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: (null: any),
  };

  // 判断是否在render阶段
  if (isRenderPhaseUpdate(fiber)) {
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    enqueueUpdate(fiber, queue, update, lane);
    const alternate = fiber.alternate;
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher;
        try {
          const currentState: S = (queue.lastRenderedState: any);
          const eagerState = lastRenderedReducer(currentState, action);
          update.hasEagerState = true;
          update.eagerState = eagerState;
          // 对比当前的state和即将更新后的state的值是否相同，若相同则直接退出
          if (is(eagerState, currentState)) {
            return;
          }
        } catch (error) {
        } finally {
          if (__DEV__) {
            ReactCurrentDispatcher.current = prevDispatcher;
          }
        }
      }
    }
    // 进行调和阶段
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);
  }

  markUpdateInDevTools(fiber, lane, action);
}
```

<a name="sjcjh"></a>

## 调度

scheduleUpdateOnFiber

```javascript
export function scheduleUpdateOnFiber(
  fiber: Fiber,
  lane: Lane,
  eventTime: number
): FiberRoot | null {
  checkForNestedUpdates();
  warnAboutRenderPhaseUpdatesInDEV(fiber);

  // 将当前lane合并近队列lane中，并将子lane合进父级lane中
  const root = markUpdateLaneFromFiberToRoot(fiber, lane);

  if (
    // unbatch 情况，比如初始化
    (executionContext & LegacyUnbatchedContext) !== NoContext &&
    (executionContext & (RenderContext | CommitContext)) === NoContext
  ) {
    // 开始同步更新，进入到 workloop 流程
    performSyncWorkOnRoot(root);
  } else {
    // 进入调度，把任务放入调度中
    ensureRootIsScheduled(root, eventTime);
    if (executionContext === NoContext) {
      // 当前的执行任务类型为 NoContext ，说明当前任务是非可控的，那么会调用 flushSyncCallbackQueue 方法。
      flushSyncCallbacksOnlyInLegacyMode();
    }
  }
  return root;
}

function markUpdateLaneFromFiberToRoot(
  sourceFiber: Fiber,
  lane: Lane
): FiberRoot | null {
  // 将当前的line合并进需要更新的lane队列中
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);

  // 向上冒泡处理，将子fiber的lene挂在到父级中
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane);
    alternate = parent.alternate;
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    } else {
      if (__DEV__) {
        if ((parent.flags & (Placement | Hydrating)) !== NoFlags) {
          warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
        }
      }
    }
    node = parent;
    parent = parent.return;
  }
}
```

ensureRootIsScheduled

```javascript
function ensureRootIsScheduled(root, currentTime) {
  // 获取上次调度的回调函数
  const existingCallbackNode = root.callbackNode;
  // 计算一下执行更新的优先级
  var newCallbackPriority = returnNextLanesPriority();
  //  当前 root 上存在的更新优先级
  const existingCallbackPriority = root.callbackPriority;
  // 如果两者相等，那么说明是在一次更新中，那么将退出
  if (existingCallbackPriority === newCallbackPriority) {
    return;
  }

  if (existingCallbackNode != null) {
    // 存在上次调度的过程，并且当前调度的优先级高于上次，取消上次的调度过程和构建fiber树的影响
    cancelCallback(existingCallbackNode);
  }

  if (newCallbackPriority === SyncLanePriority) {
    // 在正常情况下，会直接进入到调度任务中。
    // 将调和函数放入scheduleSyncCallback的callBack中
    newCallbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root)
    );
  } else {
    // 这里先忽略 */
  }
  // 给当前 root 的更新优先级，绑定到最新的优先级
  root.callbackPriority = newCallbackPriority;
}
```

scheduleSyncCallback

```javascript
function scheduleSyncCallback(callback) {
  // 列队为空
  if (syncQueue === null) {
    syncQueue = [callback];
  } else {
    syncQueue.push(callback);
  }
}
```

flushSyncCallbacks

```javascript
export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;
    let i = 0;
    const previousUpdatePriority = getCurrentUpdatePriority();
    try {
      const isSync = true;
      const queue = syncQueue;
      // 依次执行每个调和任务
      setCurrentUpdatePriority(DiscreteEventPriority);
      for (; i < queue.length; i++) {
        let callback = queue[i];
        do {
          callback = callback(isSync);
        } while (callback !== null);
      }
      syncQueue = null;
      includesLegacySyncCallbacks = false;
    } catch (error) {
      // 时间问题需要调度器协助
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1);
      }
      scheduleCallback(ImmediatePriority, flushSyncCallbacks);
      throw error;
    } finally {
      setCurrentUpdatePriority(previousUpdatePriority);
      isFlushingSyncQueue = false;
    }
  }
  return null;
}
```

```javascript
// scheduleCallback as unstable_scheduleCallback
function unstable_scheduleCallback(){
   // 计算过期时间：超时时间  = 开始时间（现在时间） + 任务超时的时间（上述设置那五个等级）
   const expirationTime = startTime + timeout;
   // 创建一个新任务
   const newTask = { ... }
  if (startTime > currentTime) {
      // 通过开始时间排序
      newTask.sortIndex = startTime;
      // 把任务放在timerQueue中
      push(timerQueue, newTask);
      // 执行setTimeout ，
      requestHostTimeout(handleTimeout, startTime - currentTime);
  }else{
    // 通过 expirationTime 排序
    newTask.sortIndex = expirationTime;
    // 把任务放入taskQueue
    push(taskQueue, newTask);
    // 没有处于调度中的任务， 然后向浏览器请求一帧，浏览器空闲执行 flushWork
     if (!isHostCallbackScheduled && !isPerformingWork) {
        isHostCallbackScheduled = true;
         requestHostCallback(flushWork)
     }

  }

}
```

requestHostTimeout

```javascript
// 定时器结束后执行handleTimeout
function requestHostTimeout(callback, ms) {
  taskTimeoutID = localSetTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

function cancelHostTimeout() {
  localClearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}
```

handleTimeout

```javascript
function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false;
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;

      flushWork;
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

function advanceTimers() {
  var timer = peek(timerQueue);
  while (timer !== null) {
    if (timer.callback === null) {
      pop(timerQueue);
      //	如果任务已经过期，那么将 timerQueue 中的过期任务，放入taskQueue
    } else if (timer.startTime <= currentTime) {
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    }
  }
}
```

requestHostCallback

```javascript
function requestHostCallback(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

const schedulePerformWorkUntilDeadline = () => {
  localSetImmediate(performWorkUntilDeadline);
};

const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    startTime = currentTime;
    const hasTimeRemaining = true;
    let hasMoreWork = true;
    try {
      // scheduledHostCallback就是requestHostCallback中的flushWork
      hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      }
    }
  } else {
    isMessageLoopRunning = false;
  }
  needsPaint = false;
};
```

flushWork

```javascript
function flushWork() {
  // 如果有延时任务，那么先暂定延时任务
  if (isHostTimeoutScheduled) {
    isHostTimeoutScheduled = false;
    cancelHostTimeout();
  }
  try {
    // 执行 workLoop 里面会真正调度我们的事件
    workLoop(hasTimeRemaining, initialTime);
  }
}
```

workLoop

```javascript
function workLoop() {
  var currentTime = initialTime;
  advanceTimers(currentTime);
  // 获取任务列表中的第一个
  currentTask = peek();
  while (currentTask !== null) {
    // 真正的更新函数 callback
    var callback = currentTask.callback;
    if (callback !== null) {
      // 执行更新
      callback();
      //	先看一下 timeQueue 中有没有 过期任务。
      advanceTimers(currentTime);
    }
    /* 再一次获取任务，循环执行 */
    currentTask = peek(taskQueue);
  }
}
```

![image.png](https://cdn.nlark.com/yuque/0/2022/png/1350314/1643179655859-b1d066f6-f09e-4ed8-a178-06bfc41bf6f6.png##clientId=u71efecef-f568-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=921&id=u56f5409e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=921&originWidth=1578&originalType=binary&ratio=1&rotation=0&showTitle=false&size=584902&status=done&style=none&taskId=ub34a23af-1e1a-4a52-93e6-f052b018d78&title=&width=1578)
<a name="ag8e6"></a>

## 调和

调和主要分为 render 和 commit 阶段

```javascript
function performSyncWorkOnRoot(root) {
  flushPassiveEffects();

  let lanes = getNextLanes(root, NoLanes);
  // render阶段
  let exitStatus = renderRootSync(root, lanes);
  // commit阶段
  commitRoot(root);

  return null;
}
```

<a name="Zyxpf"></a>

#### render

renderRootSync

```javascript
function renderRootSync(root: FiberRoot, lanes: Lanes) {
  //...
  do {
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  } while (true);
  //...

  return workInProgressRootExitStatus;
}
```

workLoopSync

```javascript
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

performUnitOfWork

```javascript
function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate;
  setCurrentDebugFiberInDEV(unitOfWork);

  let next;
  if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
    startProfilerTimer(unitOfWork);
    // 构建fiber
    next = beginWork(current, unitOfWork, subtreeRenderLanes);
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
  } else {
    next = beginWork(current, unitOfWork, subtreeRenderLanes);
  }

  resetCurrentDebugFiberInDEV();
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // 深层遍历，达到末端是执行completeWork进行归阶段，并且将workInProgress为null，跳出		       // workLoopSync方法
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }

  ReactCurrentOwner.current = null;
}
```

<a name="QlzSb"></a>

###### beginWork(向下递归)

- mount
  - 创建 fiber
  - 调和 reconcileChildren
- update
  - diff 算法更新 fiber
  - 打算处理的标签

```javascript
function beginWork(current, workInProgress, renderLanes) {
  if (current !== null) {
    // 更新流程
    // current 树上上一次渲染后的 props
    const oldProps = current.memoizedProps;
    // workInProgress 树上这一次更新的 props
    const newProps = workInProgress.pendingProps;

    if (oldProps !== newProps || hasLegacyContextChanged()) {
      didReceiveUpdate = true;
    } else {
      // props 和 context 没有发生变化，检查是否更新来自自身或者 context 改变
      const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLanes
      );
      if (!hasScheduledUpdateOrContext) {
        didReceiveUpdate = false;
        return attemptEarlyBailoutIfNoScheduledUpdate(
          current,
          workInProgress,
          renderLanes
        );
      }

      didReceiveUpdate = false;
    }
  } else {
    didReceiveUpdate = false;
  }

  // 走到这里流程会被调和 | 更新，比如函数执行会执行，类组件会执行 render 。
  switch (workInProgress.tag) {
    /* 函数组件的情况 */
    case FunctionComponent: {
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes
      );
    }
    /* 类组件的情况 */
    case ClassComponent: {
      return updateClassComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes
      );
    }
    /* 元素类型 fiber <div>, <span>  */
    case HostComponent: {
      return updateHostComponent(current, workInProgress, renderLanes);
    }
    /* 其他 fiber 情况 */
  }
}
```

updateHostComponent

```javascript
function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
) {
  pushHostContext(workInProgress);

  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }
  // ...

  markRef(current, workInProgress);
  // 根据节点内容进行调度
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
```

reconcileChildren

```javascript
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes,
) {
  if (current === null) {
		// 初始化
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    // fiber更新||rootFiber首次更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    );
  }
}

const reconcileChildFibers = ChildReconciler(true);

function ChildReconciler(shouldTrackSideEffects) {
	retrun reconcileChildFibers;
}
```

reconcileChildFibers

```javascript
function reconcileChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  lanes: Lanes
): Fiber | null {
  //...
  const isObject = typeof newChild === "object" && newChild !== null;
  if (isObject) {
    // 对元素进行区分
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        //唯一元素
        return placeSingleChild(
          reconcileSingleElement(
            returnFiber,
            currentFirstChild,
            newChild,
            lanes
          )
        );
      case REACT_PORTAL_TYPE:
      //...
      case REACT_LAZY_TYPE:
      //...
    }
  }
  // 内部为文字或者数字
  if (typeof newChild === "string" || typeof newChild === "number") {
    //...
  }
  // 内部存在多个元素,多节点diff算法
  if (isArray(newChild)) {
    return reconcileChildrenArray(
      returnFiber,
      currentFirstChild,
      newChild,
      lanes
    );
  }
  if (getIteratorFn(newChild)) {
    return reconcileChildrenIterator(
      returnFiber,
      currentFirstChild,
      newChild,
      lanes
    );
  }
  //...
  return deleteRemainingChildren(returnFiber, currentFirstChild);
}
```

reconcileSingleElement

```javascript
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: ReactElement,
  lanes: Lanes
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
  //...

  if (element.type === REACT_FRAGMENT_TYPE) {
    const created = createFiberFromFragment(
      element.props.children,
      returnFiber.mode,
      lanes,
      element.key
    );
    created.return = returnFiber;
    return created;
  } else {
    // 创建fiber
    const created = createFiberFromElement(element, returnFiber.mode, lanes);
    created.ref = createRef(returnFiber, currentFirstChild, element);
    created.return = returnFiber;
    return created;
  }
}
```

createFiberFromElement

```javascript
export function createFiberFromElement(
  element: ReactElement,
  mode: TypeOfMode,
  lanes: Lanes
): Fiber {
  let owner = null;
  if (__DEV__) {
    owner = element._owner;
  }
  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    owner,
    mode,
    lanes
  );
  if (__DEV__) {
    fiber._debugSource = element._source;
    fiber._debugOwner = element._owner;
  }
  return fiber;
}
```

<a name="nACvw"></a>

###### completeWork（向上递归）

- mount
  - 创建 dom 实例
  - 子节点插入 dom 中
  - 生成 effectLsit
- update
  - 处理 beginWrok 的标签
  - diff props
  - 生成 effectLsit

```javascript
function completeUnitOfWork(unitOfWork: Fiber): void {
  let completedWork = unitOfWork;
  do {
    if ((completedWork.flags & Incomplete) === NoFlags) {
      setCurrentDebugFiberInDEV(completedWork);
      let next;
      if (
        !enableProfilerTimer ||
        (completedWork.mode & ProfileMode) === NoMode
      ) {
        next = completeWork(current, completedWork, subtreeRenderLanes);
      } else {
        startProfilerTimer(completedWork);
        next = completeWork(current, completedWork, subtreeRenderLanes);
        stopProfilerTimerIfRunningAndRecordDelta(completedWork, false);
      }
      resetCurrentDebugFiberInDEV();

      if (next !== null) {
        workInProgress = next;
        return;
      }
    } else {

    workInProgress = completedWork;
  } while (completedWork !== null);


}
```

completeWork

```javascript
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  //根据不同tag区分处理
  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      return null;
    case ClassComponent: {
      const Component = workInProgress.type;
      if (isLegacyContextProvider(Component)) {
        popLegacyContext(workInProgress);
      }
      return null;
    }
    //根root
    case HostRoot: {
      //...
      return null;
    }
    // ...普通组件
    case HostComponent: {
      popHostContext(workInProgress);
      const rootContainerInstance = getRootHostContainer();
      const type = workInProgress.type;
      // updata
      if (current !== null && workInProgress.stateNode != null) {
        updateHostComponent(
          current,
          workInProgress,
          type,
          newProps,
          rootContainerInstance
        );

        if (current.ref !== workInProgress.ref) {
          markRef(workInProgress);
        }
      } else {
        // mounted
        //...
        if (wasHydrated) {
        } else {
          // 实例化dom元素
          const instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress
          );
          // 将元素插入dom树中
          appendAllChildren(instance, workInProgress, false, false);

          workInProgress.stateNode = instance;
          // 为dom元素初始化属性
          if (
            finalizeInitialChildren(
              instance,
              type,
              newProps,
              rootContainerInstance,
              currentHostContext
            )
          ) {
            markUpdate(workInProgress);
          }
        }
        //...
      }
      return null;
    }
  }
}
```

createInstance

```javascript
export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object
): Instance {
  //...
  // 创建出dom
  const domElement: Instance = createElement(
    type,
    props,
    rootContainerInstance,
    parentNamespace
  );
  //...
  return domElement;
}
```

updateHostComponent

```javascript
updateHostComponent = function (
  current: Fiber,
  workInProgress: Fiber,
  type: Type,
  newProps: Props,
  rootContainerInstance: Container
) {
  const currentInstance = current.stateNode;
  const oldProps = current.memoizedProps;
  // If there are no effects associated with this node, then none of our children had any updates.
  // This guarantees that we can reuse all of them.
  const childrenUnchanged = workInProgress.firstEffect === null;
  if (childrenUnchanged && oldProps === newProps) {
    // No changes, just reuse the existing instance.
    // Note that this might release a previous clone.
    workInProgress.stateNode = currentInstance;
    return;
  }
  const recyclableInstance: Instance = workInProgress.stateNode;
  const currentHostContext = getHostContext();
  let updatePayload = null;
  if (oldProps !== newProps) {
    updatePayload = prepareUpdate(
      recyclableInstance,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
      currentHostContext
    );
  }
  if (childrenUnchanged && updatePayload === null) {
    // No changes, just reuse the existing instance.
    // Note that this might release a previous clone.
    workInProgress.stateNode = currentInstance;
    return;
  }
  const newInstance = cloneInstance(
    currentInstance,
    updatePayload,
    type,
    oldProps,
    newProps,
    workInProgress,
    childrenUnchanged,
    recyclableInstance
  );
  if (
    finalizeInitialChildren(
      newInstance,
      type,
      newProps,
      rootContainerInstance,
      currentHostContext
    )
  ) {
    markUpdate(workInProgress);
  }
  workInProgress.stateNode = newInstance;
};
```

prepareUpdate

```javascript
export function prepareUpdate(
  domElement: Instance,
  type: string,
  oldProps: Props,
  newProps: Props,
  rootContainerInstance: Container,
  hostContext: HostContext
): null | Array<mixed> {
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    if (
      typeof newProps.children !== typeof oldProps.children &&
      (typeof newProps.children === "string" ||
        typeof newProps.children === "number")
    ) {
      const string = "" + newProps.children;
      const ownAncestorInfo = updatedAncestorInfo(
        hostContextDev.ancestorInfo,
        type
      );
      validateDOMNesting(null, string, ownAncestorInfo);
    }
  }
  // diff算法更新Props
  return diffProperties(
    domElement,
    type,
    oldProps,
    newProps,
    rootContainerInstance
  );
}
```

<a name="D4DTo"></a>

#### commit

```javascript
function commitRoot(root) {
  const renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(
    ImmediateSchedulerPriority,
    commitRootImpl.bind(null, root, renderPriorityLevel)
  );
  return null;
}
```

```javascript
function commitRootImpl(root, renderPriorityLevel) {
  do {
    // 执行上次留下的有副作用的effect
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);
  //...

  // before mutation阶段
  nextEffect = firstEffect;
  do {
    if (__DEV__) {
      //...
    } else {
      try {
        commitBeforeMutationEffects();
      } catch (error) {
        invariant(nextEffect !== null, "Should be working on an effect.");
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    }
  } while (nextEffect !== null);

  //	mutation阶段
  nextEffect = firstEffect;
  do {
    if (__DEV__) {
      //...
    } else {
      try {
        commitMutationEffects(root, renderPriorityLevel);
      } catch (error) {
        invariant(nextEffect !== null, "Should be working on an effect.");
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    }
  } while (nextEffect !== null);

  //	layout阶段
  nextEffect = firstEffect;
  do {
    if (__DEV__) {
      //...
    } else {
      try {
        commitLayoutEffects(root, lanes);
      } catch (error) {
        invariant(nextEffect !== null, "Should be working on an effect.");
        captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    }
  } while (nextEffect !== null);
}
```

<a name="Snxow"></a>

###### before mutation 阶段

```javascript
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;
    if ((effectTag & Snapshot) !== NoEffect) {
      const current = nextEffect.alternate;
      // dom还未更新，获取 DOM 快照的最佳时期，调用getSnapshotBeforeUpdates
      commitBeforeMutationEffectOnFiber(current, nextEffect);
    }
    if ((effectTag & Passive) !== NoEffect) {
      // 判断funtion Component中是否使用useEffec函数，并将useEffect放在scheduleCallback中，待完成mutation后异步回调。
      scheduleCallback(NormalPriority, () => {
        flushPassiveEffects();
        return null;
      });
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```

<a name="FLCEV"></a>

###### mutation 阶段

- 置空 ref ，在 ref 章节讲到对于 ref 的处理。
- 对新增元素，更新元素，删除元素。进行真实的 DOM 操作。

```javascript
function commitMutationEffects(root: FiberRoot, renderPriorityLevel) {
  // 遍历effectList
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;

    // 根据 ContentReset effectTag重置文字节点
    if (effectTag & ContentReset) {
      commitResetTextContent(nextEffect);
    }

    // 更新ref
    if (effectTag & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
    }

    // 根据 effectTag 分别处理
    const primaryEffectTag =
      effectTag & (Placement | Update | Deletion | Hydrating);
    switch (primaryEffectTag) {
      // 插入DOM
      case Placement: {
        commitPlacement(nextEffect);
        nextEffect.effectTag &= ~Placement;
        break;
      }
      // 插入DOM 并 更新DOM
      case PlacementAndUpdate: {
        // 插入
        commitPlacement(nextEffect);

        nextEffect.effectTag &= ~Placement;

        // 更新
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // SSR
      case Hydrating: {
        nextEffect.effectTag &= ~Hydrating;
        break;
      }
      // SSR
      case HydratingAndUpdate: {
        nextEffect.effectTag &= ~Hydrating;

        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // 更新DOM
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // 删除DOM
      case Deletion: {
        commitDeletion(root, nextEffect, renderPriorityLevel);
        break;
      }
    }

    nextEffect = nextEffect.nextEffect;
  }
}
```

<a name="rfAIb"></a>
######## 插入

```javascript
function commitPlacement(finishedWork: Fiber): void {
  if (!supportsMutation) {
    return;
  }
  // 获取父级DOM节点。其中finishedWork为传入的Fiber节点。
  const parentFiber = getHostParentFiber(finishedWork);

  let parent;
  let isContainer;
  const parentStateNode = parentFiber.stateNode;
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case FundamentalComponent:
      if (enableFundamentalAPI) {
        parent = parentStateNode.instance;
        isContainer = false;
      }
    default:
  }
  //...

  // 由于dom树结构与fiber树结构不一定一一对应，所以需要获取相邻的dom节点
  const before = getHostSibling(finishedWork);

  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}
```

insertOrAppendPlacementNode

```javascript
function insertOrAppendPlacementNode(
  node: Fiber,
  before: ?Instance,
  parent: Instance
): void {
  const { tag } = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost || (enableFundamentalAPI && tag === FundamentalComponent)) {
    const stateNode = isHost ? node.stateNode : node.stateNode.instance;
    // 根据是否存在相邻元素，使用不同的插入方法
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else if (tag === HostPortal) {
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}
```

insertBefore

```javascript
export function insertBefore(
  parentInstance: Instance,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance | SuspenseInstance
): void {
  parentInstance.insertBefore(child, beforeChild);
}

export function appendChild(
  parentInstance: Instance,
  child: Instance | TextInstance
): void {
  parentInstance.appendChild(child);
}
```

<a name="d11gs"></a>
######## 更新
commitWork

```javascript
function commitWork(current: Fiber | null, finishedWork: Fiber): void {
  if (!supportsMutation) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case MemoComponent:
      case SimpleMemoComponent:
      case Block: {.
        if (
          enableProfilerTimer &&
          enableProfilerCommitHooks &&
          finishedWork.mode & ProfileMode
        ) {
          try {
            startLayoutEffectTimer();
            commitHookEffectListUnmount(
              HookLayout | HookHasEffect,
              finishedWork,
            );
          } finally {
            recordLayoutEffectDuration(finishedWork);
          }
        } else {
          commitHookEffectListUnmount(HookLayout | HookHasEffect, finishedWork);
        }
        return;
      }
      case Profiler: {
        return;
      }
       //...
    }
  }
}
```

commitHookEffectListUnmount

```javascript
function commitHookEffectListUnmount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    // 循环执行销毁函数
    do {
      if ((effect.tag & tag) === tag) {
        // Unmount
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

<a name="yCpIk"></a>
######## 删除
commitDeletion

```javascript
function commitDeletion(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel
): void {
  if (supportsMutation) {
    // Recursively delete all host nodes from the parent.
    // Detach refs and call componentWillUnmount() on the whole subtree.
    unmountHostComponents(finishedRoot, current, renderPriorityLevel);
  } else {
    // Detach refs and call componentWillUnmount() on the whole subtree.
    commitNestedUnmounts(finishedRoot, current, renderPriorityLevel);
  }
  const alternate = current.alternate;
  detachFiberMutation(current);
  if (alternate !== null) {
    detachFiberMutation(alternate);
  }
}
```

<a name="NYUnx"></a>

###### layout 阶段

```javascript
function commitLayoutEffects(root: FiberRoot, committedLanes: Lanes) {
  if (__DEV__) {
    if (enableDebugTracing) {
      logLayoutEffectsStarted(committedLanes);
    }
  }

  if (enableSchedulingProfiler) {
    markLayoutEffectsStarted(committedLanes);
  }

  while (nextEffect !== null) {
    setCurrentDebugFiberInDEV(nextEffect);

    const flags = nextEffect.flags;

    if (flags & (Update | Callback)) {
      const current = nextEffect.alternate;
      commitLayoutEffectOnFiber(root, current, nextEffect, committedLanes);
    }

    // 处理Ref
    if (enableScopeAPI) {
      if (flags & Ref && nextEffect.tag !== ScopeComponent) {
        commitAttachRef(nextEffect);
      }
    } else {
      if (flags & Ref) {
        commitAttachRef(nextEffect);
      }
    }

    resetCurrentDebugFiberInDEV();
    nextEffect = nextEffect.nextEffect;
  }

  if (enableSchedulingProfiler) {
    markLayoutEffectsStopped();
  }
}
```

commitLayoutEffectOnFiber

```javascript
function commitLayoutEffectOnFiber (
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        finishedWork.mode & ProfileMode
      ) {
        try {
          startLayoutEffectTimer();
          commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
        } finally {
          recordLayoutEffectDuration(finishedWork);
        }
      } else {
        commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
      }

      schedulePassiveEffects(finishedWork);
      return;
    }
    // 执行周期函数
     case ClassComponent: {
      const instance = finishedWork.stateNode;
       //...
  }
 }
```

commitHookEffectListMount

```javascript
function commitHookEffectListMount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // Mount 对effect执行初始创建函数
        const create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```
