<a name="nikRa"></a>

# 认识 jsx

<a name="Ku89f"></a>

## jsx->dom 关键过程

- jsx

```javascript
<div>
  <TextComponent />
  <div>hello,world</div>
  let us learn React!
</div>
```

- bable 编译成 React.createElement 函数

```javascript
React.createElement(
  "div",
  null,
  React.createElement(TextComponent, null),
  React.createElement("div", null, "hello,world"),
  "let us learn React!"
);
```

- 经过 React.createElement 处理后转换化成 React Dom(虚拟 dom)

![image.png](https://cdn.nlark.com/yuque/0/2022/png/1350314/1641855430173-3fc3357a-5d0b-45ab-9f24-7cf4dfee5fff.png)<br />ps:

1. 此处可以对 render 返回的 React dom 进行操作，从而控制显示在页面上的 dom
2. 常用的方法有
   - React.Children.toArray 扁平化，规范化 children 数组。
   - React.isValidElement 验证是否为元素。
   - loneElement 创建新的容器元素。

- 在 React 的 commit 阶段会把 React dom 变为真实的 dom 节点
  <a name="QFbU4"></a>

## 文件里 React 引入问题

以前：babel 编译后，写的 jsx 会变成上述 React.createElement 形式，所以需要引入 React。<br />现在：babel 将 React 的方法放入自己的包中，所以无需引入。
<a name="eawyt"></a>

# 起源 Component

<a name="QyOK2"></a>

## class 组件

**构建源码**

```javascript
function Component(props, context, updater) {
  this.props = props; //绑定props
  this.context = context; //绑定context
  this.refs = emptyObject; //绑定ref
  this.updater = updater || ReactNoopUpdateQueue; //上面所属的updater 对象
}
/* 绑定setState 方法 */
Component.prototype.setState = function (partialState, callback) {
  this.updater.enqueueSetState(this, partialState, callback, "setState");
};
/* 绑定forceupdate 方法 */
Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
};
```

**继承强化**<br />类组件可以使用 extends 进行父组件，并进行加强和定制化<br />**静态属性绑定**<br />当给 New 后的实例对象原型链绑定的方法和 class 内部的方法名相同时候，会优先去 class 内部的方法进行调用。
<a name="uyvWW"></a>

## funtion 组件

```javascript
function Index() {
  console.log(Index.number); // 打印 1
  const [message, setMessage] = useState("hello,world"); /* hooks  */
  return (
    <div onClick={() => setMessage("let us learn React!")}> {message} </div>
  ); /* 返回值 作为渲染ui */
}
Index.number = 1; /* 绑定静态属性 */
```

不要尝试给函数组件 prototype 绑定属性或方法，即使绑定了也没有任何作用，因为通过上面源码中 React 对函数组件的调用，是采用直接执行函数的方式，而不是通过 new 的方式。
<a name="llHdJ"></a>

## 区别

- 对于类组件来说，底层只需要实例化一次，实例中保存了组件的 state 等状态。对于每一次更新只需要调用 render 方法以及对应的生命周期就可以了。
- 但是在函数组件中，每一次更新都是一次新的函数执行，一次函数组件的更新，里面的变量会重新声明。为了能让函数组件可以保存一些状态，执行一些副作用钩子，React Hooks 应运而生，它可以帮助记录 React 中组件的状态，处理一些额外的副作用。
  <a name="tS8qg"></a>

## 5 种主流的通信方式

1. props 和 callback 方式
2. ref 方式。
3. React-redux 或 React-mobx 状态管理方式。
4. context 上下文方式。
5. event bus 事件总线。
   <a name="LxAhk"></a>

# 玄学 State

<a name="iUuHE"></a>

## 类组件的 State

**setState 更新流程**

- 首先，setState 会产生当前更新的优先级（老版本用 expirationTime ，新版本用 lane ）。
- 接下来 React 会从 fiber Root 根部 fiber 向下调和子节点，调和阶段将对比发生更新的地方，更新对比 expirationTime ，找到发生更新的组件，合并 state，然后触发 render 函数，得到新的 UI 视图层，完成 render 阶段。
- 接下来到 commit 阶段，commit 阶段，替换真实 DOM ，完成此次更新流程。
- 此时仍然在 commit 阶段，会执行 setState 中 callback 函数,如上的()=>{ console.log(this.state.number) }，到此为止完成了一次 setState 全过程。
- ![image.png](https://cdn.nlark.com/yuque/0/2022/png/1350314/1641857179286-2cee6b8b-4b6b-476b-b60a-3025e3ca9a06.png#clientId=u38c057ec-24ca-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=472&id=uff5a7ded&margin=%5Bobject%20Object%5D&name=image.png&originHeight=944&originWidth=742&originalType=binary&ratio=1&rotation=0&showTitle=false&size=154584&status=done&style=none&taskId=u231459aa-d3e3-4c08-8680-632fd5de78d&title=&width=371)

**setState 同步和异步更新问题**<br />[https://www.yuque.com/u1108243/uen87g/htyt6m](https://www.yuque.com/u1108243/uen87g/htyt6m)<br />**更新优先级**

- flushSync 可以将回调函数中的更新任务，放在一个较高的优先级中
- flushSync 在同步条件下，会合并之前的 setState | useState，可以理解成，如果发现了 flushSync ，就会先执行更新，如果之前有未更新的 setState ｜ useState ，就会一起合并了，
- 更新优先级：flushSync 中的 setState **>** 正常执行上下文中 setState **>** setTimeout ，Promise 中的 setState
  <a name="Kd1z6"></a>

## 函数组件中的 state

**变化监听**

- useState 不存像 setState 的回调函数一样获取变化后的 state
- 函数组件也没有 componentDidUpdate 周期函数监听 state 方法变化
- 使用 useEffect 对 state 进行监听，此时能获 state 变化后的值

**视图更新**

- setState 是否触发会对比前后的 state 是否相同，相同则不会触发更新
- 当时 state 为对象时，需要重新传入新的对象，不然 setState 会因为前后对象引用地址相同而作为相同值
  <a name="L8GY6"></a>

## 更新的异同处

同：

- 首先从原理角度出发，setState 和 useState 更新视图，底层都调用了 scheduleUpdateOnFiber 方法，而且事件驱动情况下都有批量更新规则。

异：

- 在不是 pureComponent 组件模式下， setState 不会浅比较两次 state 的值，只要调用 setState，在没有其他优化手段的前提下，就会执行更新。但是 useState 中的 dispatchAction 会默认比较两次 state 是否相同，然后决定是否更新组件。
- setState 有专门监听 state 变化的回调函数 callback，可以获取最新 state；但是在函数组件中，只能通过 useEffect 来执行 state 变化引起的副作用。
- setState 在底层处理逻辑上主要是和老 state 进行合并处理，而 useState 更倾向于重新赋值。
  <a name="On5Dw"></a>

# 深入 props

<a name="rw3kN"></a>

## props 能传递内容

- 子组件渲染的数据
- 父组件的回调函数
- dom 节点
- 单纯组件
- 组件渲染函数
  <a name="L0PlT"></a>

## props 充当的角色

- **在 React 组件层级 props 充当的角色**

一方面父组件 props 可以把数据层传递给子组件去渲染消费。另一方面子组件可以通过 props 中的 callback ，来向父组件传递信息。还有一种可以将视图容器作为 props 进行渲染。

- **从 React 更新机制中 props 充当的角色**

在 React 中，props 在组件更新中充当了重要的角色，在 fiber 调和阶段中，diff 可以说是 React 更新的驱动器，熟悉 vue 的同学都知道 vue 中基于响应式，数据的变化，就会颗粒化到组件层级，通知其更新，但是在 React 中，无法直接检测出数据更新波及到的范围，props 可以作为组件是否更新的重要准则，变化即更新，于是有了 PureComponent ，memo 等性能优化方案。

- **从 React 插槽层面 props 充当的角色**

React 可以把组件的闭合标签里的插槽，转化成 Children 属性，一会将详细介绍这个模式。
<a name="DrXYk"></a>

## props 注入方式

- 显示注入，直接在 dom 上添加属性
- 隐式注入，通过 React.cloneElement 对 props.chidren 克隆再混入新的 props 。

<a name="XQ40T"></a>

## From 组件例子

- 合理将 input change 事件和 from setValue 数据结合起来。
- 使用 cloneElement 注入相关的 props 给子组件。
  <a name="ZGHkP"></a>

# 多功能 Ref

<a name="TEcLe"></a>

## 获取 Ref 方法

- ref="string"，在类组件中，会将 ref 放入 this.refs 中。
- ref={ ( node ) => { ... } }，ref 会作为参数返回，给与函数使用。
- ref={ nodeRef }，类组件使用 createRef 创建变量，函数组件使用 useRef 创建变量，存在 nodeRef.current 中。
  <a name="X390r"></a>

## forwardRef 转发 Ref

<a name="NnCkT"></a>

### 跨组件传递

由于 ref 是不能作为 props 参数进行传递，需要使用 forwardRef 包一层进行传递。

```javascript
// 孙组件
function Son(props) {
  const { grandRef } = props;
  return (
    <div>
      <div> i am alien </div>
      <span ref={grandRef}>这个是想要获取元素</span>
    </div>
  );
}
// 父组件
class Father extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        <Son grandRef={this.props.grandRef} />
      </div>
    );
  }
}
const NewFather = React.forwardRef((props, ref) => (
  <Father grandRef={ref} {...props} />
));
// 爷组件
class GrandFather extends React.Component {
  constructor(props) {
    super(props);
  }
  node = null;
  componentDidMount() {
    console.log(this.node); // span #text 这个是想要获取元素
  }
  render() {
    return (
      <div>
        <NewFather ref={(node) => (this.node = node)} />
      </div>
    );
  }
}
```

ps：经过 forwardRef 转发后，在 GrandFather 传递的 ref 就会转化成 Fatehr 中的 grandRef 传给孙组件，给孙组件赋值，在爷组件获取。
<a name="iKtZL"></a>

### 合并转发 ref

在子组件获取转化的 ref 对象，可以对他的 ref.current 进行修改，决定返回上层组件的内容。
<a name="GV79o"></a>

### 高阶组件转发

如果通过高阶组件包裹一个原始类组件，就会产生一个问题，如果高阶组件 HOC 没有处理 ref ，那么由于高阶组件本身会返回一个新组件，所以当使用 HOC 包装后组件的时候，标记的 ref 会指向 HOC 返回的组件，而并不是 HOC 包裹的原始类组件，为了解决这个问题，forwardRef 可以对 HOC 做一层处理。
<a name="Zwa4k"></a>

## ref 通信

<a name="f3Ri5"></a>

### 类组件 ref

类组件可以通过 ref 获取到的组件，使用 ref 调用组件实例内部的方法。
<a name="HTV8v"></a>

### 函数组件 forwardRef + useImperativeHandle

由于函数组件没有实例，需要通过 forwardRef 转发和子组件使用 useImperativeHandle 传出 ref 内容。<br />![](https://cdn.nlark.com/yuque/0/2022/webp/1350314/1641976539234-5ed2224b-47d1-48f6-89b0-625702304131.webp#clientId=u16d6659d-697c-4&crop=0&crop=0&crop=1&crop=1&from=paste&id=uf9e606e7&margin=%5Bobject%20Object%5D&originHeight=782&originWidth=604&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=ua4b4b7d8-2fd6-4c78-be86-a85173df7f3&title=)

```javascript
// 子组件
function Son (props,ref) {
    const inputRef = useRef(null)
    const [ inputValue , setInputValue ] = useState('')
    useImperativeHandle(ref,()=>{
       const handleRefs = {
           onFocus(){              /* 声明方法用于聚焦input框 */
              inputRef.current.focus()
           },
           onChangeValue(value){   /* 声明方法用于改变input的值 */
               setInputValue(value)
           }
       }
       return handleRefs
    },[])
    return <div>
        <input placeholder="请输入内容"  ref={inputRef}  value={inputValue} />
    </div>
}

const ForwarSon = forwardRef(Son)
// 父组件
class Index extends React.Component{
    cur = null
    handerClick(){
       const { onFocus , onChangeValue } =this.cur
       onFocus() // 让子组件的输入框获取焦点
       onChangeValue('let us learn React!') // 让子组件input
    }
    render(){
        return <div style={{ marginTop:'50px' }} >
            <ForwarSon ref={cur => (this.cur = cur)} />
            <button onClick={this.handerClick.bind(this)} >操控子组件</button>
        </div>
    }
}。
```

<a name="Tscnz"></a>

### 函数组件缓存数据

在函数组件中，每次 render 都会重新赋值函数内部的变量，使用 useState 可以记录数据，但是每次变化都会引起 render，对于不需要改变时重新渲染，但是又要记录数据的可以存储在 useRef 中。
<a name="siCLg"></a>

## ref 原理

<a name="vvAuH"></a>

### ref 首次处理

ref 处理方法有 commitDetachRef 和 commitArrachRef，分别在 commit 的 mutation 和 layout 阶段。

- mution 阶段，此时 dom 还没更新，并在 ref 进行初始化为 null

```javascript
function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === "function") {
      /* function 和 字符串获取方式。 */
      currentRef(null);
    } else {
      /* Ref对象获取方式 */
      currentRef.current = null;
    }
  }
}
```

- layout 阶段，在真实 dom 渲染后，此时能获取到 dom 阶段，并更新 Ref

```javascript
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent: //元素节点 获取元素
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        // 类组件直接使用实例
        instanceToUse = instance;
    }
    if (typeof ref === "function") {
      ref(instanceToUse); //* function 和 字符串获取方式。 */
    } else {
      ref.current = instanceToUse; /* ref对象方式 */
    }
  }
}
```

<a name="gVpuX"></a>

### ref 跟新

- commitDetachRef 调用时机

```javascript
function commitMutationEffects() {
  if (effectTag & Ref) {
    const current = nextEffect.alternate;
    if (current !== null) {
      commitDetachRef(current);
    }
  }
}
```

- commitAttachRef 调用时机

```javascript
function commitLayoutEffects() {
  if (effectTag & Ref) {
    commitAttachRef(nextEffect);
  }
}
```

所以当打上 tag 标签才会更新

- ref 标签

```javascript
function markRef(current: Fiber | null, workInProgress: Fiber) {
  const ref = workInProgress.ref;
  if (
    // 在 fiber 初始化的时候，第一次 ref 处理的时候，是一定要标记 Ref 的。
    (current === null && ref !== null) ||
    // fiber 更新的时候，但是 ref 对象的指向变了。
    (current !== null && current.ref !== ref)
  ) {
    workInProgress.effectTag |= Ref;
  }
}
```

<a name="QcSjJ"></a>

### ref 卸载

```javascript
function safelyDetachRef(current) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref === "function") {
      // 函数式 ｜ 字符串
      ref(null);
    } else {
      ref.current = null; // ref 对象
    }
  }
}
```

<a name="qULM4"></a>

## 提供者 context

<a name="luot2"></a>

### createContext

```javascript
const ThemeContext = React.createContext(null); //
const ThemeProvider = ThemeContext.Provider; //提供者
const ThemeConsumer = ThemeContext.Consumer; // 订阅消费者
```

<a name="XWNCo"></a>

### 提供者

```javascript
const ThemeProvider = ThemeContext.Provider; //提供者
export default function ProviderDemo() {
  const [contextValue, setContextValue] = React.useState({
    color: "#ccc",
    background: "pink",
  });
  return (
    <div>
      <ThemeProvider value={contextValue}>
        <Son />
      </ThemeProvider>
    </div>
  );
}
```

<a name="Vcs5x"></a>

### 消费者

<a name="tdDB6"></a>

#### 类组件之 contextType 方式

```javascript
const ThemeContext = React.createContext(null);
// 类组件 - contextType 方式
class ConsumerDemo extends React.Component {
  render() {
    const { color, background } = this.context;
    return <div style={{ color, background }}>消费者</div>;
  }
}
ConsumerDemo.contextType = ThemeContext;

const Son = () => <ConsumerDemo />;
```

<a name="Kn3jK"></a>

#### 函数组件之 useContext 方式

```javascript
const ThemeContext = React.createContext(null);
// 函数组件 - useContext方式
function ConsumerDemo() {
  const contextValue = React.useContext(ThemeContext); /*  */
  const { color, background } = contextValue;
  return <div style={{ color, background }}>消费者</div>;
}
const Son = () => <ConsumerDemo />;
```

<a name="yYaSX"></a>

#### 订阅者之 Consumer 方式

```javascript
const ThemeConsumer = ThemeContext.Consumer; // 订阅消费者

function ConsumerDemo(props) {
  const { color, background } = props;
  return <div style={{ color, background }}>消费者</div>;
}
const Son = () => (
  <ThemeConsumer>
    {/* 将 context 内容转化成 props  */}
    {(contextValue) => <ConsumerDemo {...contextValue} />}
  </ThemeConsumer>
);
```

<a name="XLPmG"></a>

# 模块化 CSS

<a name="ci4Kq"></a>

## CSS Modules

加载后会添加一段 hash 乱码，避免样式名重复
<a name="gXlis"></a>

### 基本使用

- css-loader 配置

```javascript
{
    test: /\.css$/,/* 对于 css 文件的处理 */
    use:[
       'css-loader?modules' /* 配置css-loader ,加一个 modules */
    ]
}
```

- css 文件

```javascript
.text{
    color: blue;
}
```

- js 文件

```javascript
import style from "./style.module.css";
export default () => (
  <div>
    <div className={style.text}>验证 css modules </div>
  </div>
);
```

<a name="pCbNO"></a>

### 自定义命名规则

```javascript
{
     test: /\.css$/,/* 对于 css 文件的处理 */
     use:[
        {
            loader: 'css-loader',
            options:{
              modules: {
                localIdentName: "[path][name]__[local]--[hash:base64:5]", /* 命名规则  [path][name]__[local] 开发环境 - 便于调试   */
              },
            }
        },
     ],
}
```

<a name="WVYaM"></a>

### 全局变量

```javascript
.text{
    color: blue;
}
:global(.text_bg) {
    background-color: pink;
}
```

```javascript
// 显式的局部作用域语法:local(.text)，等同于.text。
.text{
    color: blue;
}
/* 等价于 */
:local(.text_bg) {
    background-color: pink;
}
```

<a name="tt7L2"></a>

## CSS IN JS

<a name="bRwTL"></a>

### 基本使用

```javascript
import React from "react";
import Style from "./style";

export default function Index() {
  return (
    <div style={Style.boxStyle}>
      <span style={Style.textStyle}>hi , i am CSS IN JS!</span>
    </div>
  );
}
```

```javascript
/* 容器的背景颜色 */
const boxStyle = {
  backgroundColor: "blue",
};
/* 字体颜色 */
const textStyle = {
  color: "orange",
};

export default {
  boxStyle,
  textStyle,
};
```

<a name="y6ZsD"></a>

### style-components 库使用

```javascript
import styled from "styled-components";
/* 给button标签添加样式，形成 Button React 组件 */
const Button = styled.button`
  background: #6a8bad;
  color: #fff;
  min-width: 96px;
  height: 36px;
  border: none;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-left: 20px !important;
`;
export default function Index() {
  return (
    <div>
      <Button>按钮</Button>
    </div>
  );
}
```

<a name="g9bkt"></a>

# 高阶组件

高阶函数就是一个将函数作为参数并且返回值也是函数的函数。高阶组件是以组件作为参数，返回组件的函数。返回的组件把传进去的组件进行功能强化。
<a name="I6iIL"></a>

## 高阶组件类型

<a name="zdxmo"></a>

### 属性代理

属性代理，就是用组件包裹一层代理组件，在代理组件上，可以做一些，对源组件的强化操作。这里注意属性代理返回的是一个新组件，被包裹的原始组件，将在新的组件里被挂载。<br />优点：

- 使用于函数组件和类组件
- 可以将业务相关的代码隔绝
- 可以多层 HOC 封装，不限制 HOC 的先后顺序，加强结果会进行累加。

缺点：

- 难以获取源组件内部属性，需要通过 ref 获取实例
- 无法直接继承静态属性
- 本质上是产生了一个新组件，所以需要配合 forwardRef 来转发 ref
  <a name="rswjm"></a>

### 反向继承

属性代理，是将 HOC 的内容加强进入源组件，而反向继承时 HOC 通过 extends 继承原组件，然后在内部进行定制处理，包装后的组件继承了原始组件本身，所以此时无须再去挂载业务组件。<br />优点：

- 方便获取源组件内部的，state、props、生命周期，通过 this 可以获取源组件实例
- es6 继承可以良好继承静态属性。所以无须对静态属性和方法进行额外的处理

缺点：

- 函数组件无法使用
- 和被包装的组件耦合度高，需要知道被包装的原始组件的内部状态，具体做了些什么
- HOC 会因为继承的顺序发生覆盖关系
  <a name="HRb63"></a>

## 高阶组件作用

- **强化 props**
- **渲染劫持**
  - 通过 super.render()获取 render()渲染后的内容，可以通过 React.CloneElement 等方法修改渲染结果
- **动态加载**

```javascript
export default function dynamicHoc(loadRouter) {
  return class Content extends React.Component {
    state = { Component: null };
    componentDidMount() {
      if (this.state.Component) return;
      loadRouter()
        .then((module) => module.default) // 动态加载 component 组件
        .then((Component) => this.setState({ Component }));
    }
    render() {
      const { Component } = this.state;
      return Component ? <Component {...this.props} /> : <Loading />;
    }
  };
}

const Index = AsyncRouter(() => import("../pages/index"));
```

- **事件监听**

```javascript
function ClickHoc(Component) {
  return function Wrap(props) {
    const dom = useRef(null);
    useEffect(() => {
      const handerClick = () => console.log("发生点击事件");
      dom.current.addEventListener("click", handerClick);
      return () => dom.current.removeEventListener("click", handerClick);
    }, []);
    return (
      <div ref={dom}>
        <Component {...props} />
      </div>
    );
  };
}

@ClickHoc
class Index extends React.Component {
  render() {
    return (
      <div className="index">
        <p>hello，world</p>
        <button>组件内部点击</button>
      </div>
    );
  }
}
export default () => {
  return (
    <div className="box">
      <Index />
      <button>组件外部点击</button>
    </div>
  );
};
```

<a name="fJ82O"></a>

## 注意事项

<a name="JBuKq"></a>

### 谨慎修改原型链

如：如果直接修改原型链上的 componentDidMount 生命周期函数，等下个 HOC 也是直接操作原型链的化就会将之前的覆盖点。（原来的效果是对 componentDidMount 的 HOC 都在累加在 componentDidMount 方法执行）
<a name="rg6wj"></a>

### 不要在函数组件内部或类组件 render 函数中使用 HOC

```javascript
function Index() {
  const WrapHome = HOC(Home);
  return <WrapHome />;
}

class Index extends React.Component {
  render() {
    const WrapHome = HOC(Home);
    return <WrapHome />;
  }
}
```

这么写的话每一次类组件触发 render 或者函数组件执行都会产生一个新的 WrapHome，react diff 会判定两次不是同一个组件，那么就会卸载老组件，重新挂载新组件，老组件内部的真实 DOM 节点，都不会合理的复用，从而造成了性能的浪费，而且原始组件会被初始化多次。
<a name="XO8tR"></a>

### 多个 HOC 嵌套顺序问题

多个 HOC 嵌套，应该留意一下 HOC 的顺序，还要分析出要各个 HOC 之间是否有依赖关系。
<a name="X46uz"></a>

### 继承静态属性

上述讲到在属性代理 HOC 本质上返回了一个新的 component ，那么如果给原来的 component 绑定一些静态属性方法，如果不处理，新的 component 上就会丢失这些静态属性方法。

- **手动继承**

手动将原始组件的静态方法 copy 到 HOC 组件上来，但前提是必须准确知道应该拷贝哪些方法。

```javascript
function HOC(Component) {
  class WrappedComponent extends React.Component {
    /*...*/
  }
  // 必须准确知道应该拷贝哪些方法
  WrappedComponent.staticMethod = Component.staticMethod;
  return WrappedComponent;
}
```

**引入第三方库**<br />hoist-non-react-statics，自动拷贝所有的静态方法

```javascript
import hoistNonReactStatic from "hoist-non-react-statics";
function HOC(Component) {
  class WrappedComponent extends React.Component {
    /*...*/
  }
  hoistNonReactStatic(WrappedComponent, Component);
  return WrappedComponent;
}
```

<a name="HlspT"></a>

# 渲染控制

渲染基本执行：<br />类组件 render、函数组件执行 renderWithHooks<br />渲染过程：<br />通过 render 生成 Reeac.Element，在 commit 阶段转化成真是 dom 挂在<br />渲染执行原因：<br />通过 diff 算法，判断组件是否需要更新，执行 render，所以优化渲染控制就从减少不必要的 render 执行开始
<a name="GylPP"></a>

## 控制 render 的方法

<a name="dhCd4"></a>

### 缓存 React.element 对象

这是一种减少因为父组件执行 render 而造成子组件进行不必要的渲染
<a name="BxuqF"></a>

#### 类组件

- 将子组件保存在实例 this 中
- 将子组件写成函数返回，在每次 render 过程中，通过自己的判断决定是否更新子组件

```javascript
export default class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numberA: 0,
      numberB: 0,
    };
    this.component = <Children number={this.state.numberA} />;
  }
  controllComponentRender = () => {
    /* 通过此函数判断 */
    const { props } = this.component;
    if (props.number !== this.state.numberA) {
      /* 只有 numberA 变化的时候，重新创建 element 对象  */
      return (this.component = React.cloneElement(this.component, {
        number: this.state.numberA,
      }));
    }
    return this.component;
  };
  render() {
    return (
      <div>
        {this.controllComponentRender()}
        <button
          onClick={() => this.setState({ numberA: this.state.numberA + 1 })}
        >
          改变numberA
        </button>
        <button
          onClick={() => this.setState({ numberB: this.state.numberB + 1 })}
        >
          改变numberB
        </button>
      </div>
    );
  }
}
```

<a name="tVxon"></a>

#### 函数组件

使用 useMemo

- 第一个参数是组件函数的返回值，第二个参数是进行重新渲染的依赖项
- 原理：将 useMemo 执行的返回值记录在 fiber 中，当 devps 的值发生变化才会重新执行 create，保存最新的值。

```javascript
const cacheSomething = useMemo(create, deps);
```

<a name="HhIrO"></a>

## 自身优化渲染

<a name="FIVPT"></a>

### 类组件

1、使用 PureComponent 继承创建类组件，默认会浅比较 state 和 props，进行判断是否渲染。<br />**原理：**

- 使用 PureComponent 继承的会加上 isPureReactComponent 属性
- 在 updateClassInstance 过程中执行 checkShouldComponentUpdate 方法

```javascript
function checkShouldComponentUpdate() {
  if (typeof instance.shouldComponentUpdate === "function") {
    return instance.shouldComponentUpdate(
      newProps,
      newState,
      nextContext
    ); /* shouldComponentUpdate 逻辑 */
  }
  if (ctor.prototype && ctor.prototype.isPureReactComponent) {
    return (
      !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
    );
  }
}
```

- 通过 shallowEqual 对 props 和 state 进行浅对比

**注意：**

- 对于使用 PureComponent 的子组件，不要将箭头函数传给子组件，因为每次 render()箭头函数对于子组件的 props 都是新的函数，会发生重新渲染。
- PureComponent 的父组件是函数组件的情况，将函数组件传入子组件的函数最好经过 useCallback 或者 useMemo 处理，因为函数组件每次渲染，变量都会重新定义，对于 PureComponent 组件都是新函数参数。

2、shouldComponentUpdate<br />在组件内部使用 shouldComponentUpdate，取得新的 props 和 state 进行自行判断是否执行重新渲染

```javascript
    shouldComponentUpdate(newProp,newState,newContext){
        if(newProp.propsNumA !== this.props.propsNumA || newState.stateNumA !== this.state.stateNumA ){
            return true /* 只有当 props 中 propsNumA 和 state 中 stateNumA 变化时，更新组件  */
        }
        return false
    }
```

<a name="RcrIc"></a>

### 函数组件

```javascript
React.memo(Component, compare);
```

**使用：**<br />第一个参数 Component 原始组件本身，第二个参数 compare 是一个函数， 返回 true 组件不渲染 ， 返回 false 组件重新渲染，当二个参数 compare 不存在时，会用浅比较原则处理 props；<br />**原理：**

- 被 memo 包裹的组件，element 会被打成 REACT_MEMO_TYPE 类型的 element 标签，在 element 变成 fiber 的时候， fiber 会被标记成 MemoComponent 的类型。
- MemoComponent 类型的 fiber 有单独的更新处理逻辑 updateMemoComponent

```javascript
function updateMemoComponent() {
  if (updateExpirationTime < renderExpirationTime) {
    let compare = Component.compare;
    compare = compare !== null ? compare : shallowEqual; //如果 memo 有第二个参数，则用二个参数判定，没有则浅比较props是否相等。
    if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
      return bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderExpirationTime
      ); //已经完成工作停止向下调和节点。
    }
  }
  // 返回将要更新组件,memo包装的组件对应的fiber，继续向下调和更新。
}
```

![](https://cdn.nlark.com/yuque/0/2022/webp/1350314/1642058042708-c804d3c5-cd66-4904-b677-288150b52b5d.webp#clientId=uee2bacbd-05d6-4&crop=0&crop=0&crop=1&crop=1&from=paste&id=ue2ca6ddc&margin=%5Bobject%20Object%5D&originHeight=1590&originWidth=2336&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u849e8521-8ff7-40a1-97ca-89824976f79&title=)
<a name="Dx2X5"></a>

# 渲染调优

<a name="dS3oi"></a>

## 异步渲染 suspense

```javascript
// 子组件
function UserInfo() {
  // 获取用户数据信息，然后再渲染组件。
  const user = getUserInfo();
  return <h1>{user.name}</h1>;
}
// 父组件
export default function Index() {
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <UserInfo />
    </Suspense>
  );
}
```

**原理：**

1. 内部使用 try{}catch{}方式捕捉异常，通常是 Promise
2. 抛出 Promise 后会中断渲染，使用 fallback 代替渲染内容
3. 执行到 promise.then 后获取到数据再继续经行渲染

![](https://cdn.nlark.com/yuque/0/2022/webp/1350314/1642121209426-1af818d0-d3a8-4c1a-ac69-5237ffaf29f4.webp#clientId=ubde56c77-7585-4&crop=0&crop=0&crop=1&crop=1&from=paste&id=u8d93520c&margin=%5Bobject%20Object%5D&originHeight=926&originWidth=1094&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=udcd38768-02cb-4f3a-8bff-adfd2427680&title=)
<a name="MGtiS"></a>

## 动态加载 React.lazy

```javascript
const LazyComponent = React.lazy(() => import("./text"));
export default function Index() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

**原理：**

```javascript
function lazy(ctor) {
  return {
    $$typeof: REACT_LAZY_TYPE,
    _payload: {
      _status: -1, //初始化状态
      _result: ctor,
    },
    _init: function (payload) {
      if (payload._status === -1) {
        /* 第一次执行会走这里  */
        const ctor = payload._result;
        const thenable = ctor();
        payload._status = Pending;
        payload._result = thenable;
        thenable.then((moduleObject) => {
          const defaultExport = moduleObject.default;
          resolved._status = Resolved; // 1 成功状态
          resolved._result = defaultExport; /* defaultExport 为我们动态加载的组件本身  */
        });
      }
      if (payload._status === Resolved) {
        // 成功状态
        return payload._result;
      } else {
        //第一次会抛出Promise异常给Suspense
        throw payload._result;
      }
    },
  };
}
```

- 第一次渲染首先会执行 init 方法，里面会执行 lazy 的第一个函数，得到一个 Promise，绑定 Promise.then 成功回调，回调里得到将要渲染组件 defaultExport ，这里要注意的是，如上面的函数当第二个 if 判断的时候，因为此时状态不是 Resolved ，所以会走 else ，抛出异常 Promise，抛出异常会让当前渲染终止。

- 这个异常 Promise 会被 Suspense 捕获到，Suspense 会处理 Promise ，Promise 执行成功回调得到 defaultExport（将想要渲染组件），然后 Susponse 发起第二次渲染，第二次 init 方法已经是 Resolved 成功状态，那么直接返回 result 也就是真正渲染的组件。这时候就可以正常渲染组件了。

![](https://cdn.nlark.com/yuque/0/2022/webp/1350314/1642121483275-5703997c-00db-4dab-9753-c84f42db71b0.webp#clientId=ubde56c77-7585-4&crop=0&crop=0&crop=1&crop=1&from=paste&id=uf753d366&margin=%5Bobject%20Object%5D&originHeight=964&originWidth=1254&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=uff26d824-0727-459c-b9aa-ebfba75d463&title=)
<a name="smgKT"></a>

# 事件原理

<a name="defjU"></a>

## 结论

1. 给元素绑定的事件，不是真正的事件处理函数。
2. 在冒泡/捕获阶段绑定的事件，也不是在冒泡/捕获阶段执行的。
3. 甚至在事件处理函数中拿到的事件源 e ，也不是真正的事件源 e 。
   <a name="NKMVc"></a>

## 事件合成

- 在元素上挂着的 onClick 等事件都不会直接绑定在元素上。
- React 通过自身的事件插件机制将事件处理元素 props 上绑定的事件

```javascript
// registrationNameModules
const registrationNameModules = {
    onBlur: SimpleEventPlugin,
    onClick: SimpleEventPlugin,
    onClickCapture: SimpleEventPlugin,
    onChange: ChangeEventPlugin,
    onChangeCapture: ChangeEventPlugin,
    onMouseEnter: EnterLeaveEventPlugin,
    onMouseLeave: EnterLeaveEventPlugin,
    ...
}

// registrationNameDependencies
{
    onBlur: ['blur'],
    onClick: ['click'],
    onClickCapture: ['click'],
    onChange: ['blur', 'change', 'click', 'focus', 'input', 'keydown', 'keyup', 'selectionchange'],
    onMouseEnter: ['mouseout', 'mouseover'],
    onMouseLeave: ['mouseout', 'mouseover'],
    ...
}
```

<a name="cyWzv"></a>

## 事件绑定

- props 属性上的事件都会存在在 fiber 上的 memoizedProps 属性上
- 注册事件监听器，绑定在 document 上

```javascript
function diffProperties(){
    /* 判断当前的 propKey 是不是 React合成事件 */
    if(registrationNameModules.hasOwnProperty(propKey)){
         /* 这里多个函数简化了，如果是合成事件， 传入成事件名称 onClick ，向document注册事件  */
         legacyListenToEvent(registrationName, document）;
    }
}

function legacyListenToEvent(registrationName，mountAt){
   const dependencies = registrationNameDependencies[registrationName]; // 根据 onClick 获取  onClick 依赖的事件数组 [ 'click' ]。
    for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    //  addEventListener 绑定事件监听器
    ...
  }
}
```

<a name="jXykr"></a>

## 事件触发

- 只要是 React 事件触发，首先执行的就是 dispatchEvent

```javascript
const listener = dispatchEvent.bind(null, "click", eventSystemFlags, document);
/* TODO: 重要, 这里进行真正的事件绑定。*/
document.addEventListener("click", listener, false);
```

- 在 dispatchEvent 中通过 dom 元素找到对应的 fiber 对象，然后执行批量更新
  - 在 fiber 中的 memoizedProps 找到事件处理，经过处理插件 SimpleEventPlugin 合成新的事件源 e
  - 通过这个 fiber 向上遍历，遇到 onxxxCapture 就 unshift 进去事件队列，遇到 onxxx 就 push 到数组后面，从而形成冒泡和捕捉队列
  - 直到遍历到顶端 app，形成执行队列，再依次执行队列内函数
- 如何停止冒泡

```javascript
function runEventsInBatch() {
  const dispatchListeners = event._dispatchListeners;
  if (Array.isArray(dispatchListeners)) {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        /* 判断是否已经阻止事件冒泡 */
        break;
      }
      dispatchListeners[i](event); /* 执行真正的处理函数 及handleClick1... */
    }
  }
}
```

<a name="DNtEv"></a>

# 路由

<a name="w7l2i"></a>

## 组件封装关系

![](https://cdn.nlark.com/yuque/0/2022/webp/1350314/1642640186071-a9312852-ebbc-4760-b214-fe0f4624d083.webp#clientId=u0971716f-d2e6-4&crop=0&crop=0&crop=1&crop=1&from=paste&id=ufa2e7583&margin=%5Bobject%20Object%5D&originHeight=860&originWidth=944&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=uc63f93b5-ce3d-427c-9142-78d4099fa1e&title=)
<a name="e6Inv"></a>

## 组件原理和作用

<a name="WSsSK"></a>

### Router

![](https://cdn.nlark.com/yuque/0/2022/webp/1350314/1642640388293-60b3f7ee-4d34-4abf-9ff1-eb75ec7c0105.webp#clientId=u0971716f-d2e6-4&crop=0&crop=0&crop=1&crop=1&from=paste&id=u2fde2ad4&margin=%5Bobject%20Object%5D&originHeight=1164&originWidth=978&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=uf1b4908e-d53e-4378-ad73-aae7e92d787&title=)

```javascript
// 简易版（history模式）
import React, {
  useCallback,
  useState,
  useEffect,
  createContext,
  useMemo,
} from "react";
import { createBrowserHistory as createHistory } from "history";

export const RouterContext = createContext();
export let rootHistory = null;

export default function Router(props) {
  /* 缓存history属性 */
  const history = useMemo(() => {
    rootHistory = createHistory();
    return rootHistory;
  }, []);
  const [location, setLocation] = useState(history.location);
  useEffect(() => {
    /* 监听location变化，通知更新 */
    const unlisten = history.listen((location) => {
      setLocation(location);
    });
    return function () {
      unlisten && unlisten();
    };
  }, []);
  return (
    <RouterContext.Provider
      value={{
        location,
        history,
        match: {
          path: "/",
          url: "/",
          params: {},
          isExact: location.pathname === "/",
        },
      }}
    >
      {props.children}
    </RouterContext.Provider>
  );
}
```

- 通过 history 插件创建 hashHistory 或 browserHistory
- 通过监听 location 变化更新 state
- 提供 RouterContext，包含 history、location、mthc（匹配方式）给后代组件使用
  <a name="WIVQl"></a>

### Route

```javascript
import React, { useContext } from "react";
import { matchPath } from "react-router";
import { RouterContext } from "./Router";

function Route(props) {
  const context = useContext(RouterContext);
  /* 获取location对象 */
  const location = props.location || context.location;

  /* 是否匹配当前路由，如果父级有switch，就会传入computedMatch来精确匹配渲染此路由 */
  const match = props.computedMatch
    ? props.computedMatch
    : props.path
    ? matchPath(location.pathname, props)
    : context.match;

  /* 这个props用于传递给路由组件 */
  const newRouterProps = { ...context, location, match };

  let { children, component, render } = props;
  if (Array.isArray(children) && children.length === 0) children = null;
  let renderChildren = null;
  if (newRouterProps.match) {
    if (children) {
      /* 当Router 是 props children 或者 render props 形式。*/
      renderChildren =
        typeof children === "function" ? children(newRouterProps) : children;
    } else if (component) {
      /*  Route有component属性 */
      renderChildren = React.createElement(component, newRouterProps);
    } else if (render) {
      /*  Route有render属性 */
      renderChildren = render(newRouterProps);
    }
  }
  /* 逐层传递上下文 */
  return (
    <RouterContext.Provider value={newRouterProps}>
      {renderChildren}
    </RouterContext.Provider>
  );
}
export default Route;
```

- 它的工作主要就是一个： 匹配路由，路由匹配，渲染组件
- 通过 RouterContext 获取 Router 传递的路由信息
- 整合新的 RouterProps 传递子组件
- 根据子组件的类型使用不同的 props 更新方式
- 为了让 Route 的子组件访问到当前 Route 的信息，所以要选择通过 Provider 逐层传递的特点，再一次传递当前 Route 的信息，这样也能够让嵌套路由更简单的实现
  <a name="fza45"></a>

### Switch

```javascript
import React, { useContext } from "react";
import { matchPath } from "react-router";

import { RouterContext } from "../component/Router";

export default function Switch(props) {
  const context = useContext(RouterContext);
  const location = props.location || context.location;
  let children, match;

  /* 遍历children Route 找到匹配的那一个 */
  React.Children.forEach(props.children, (child) => {
    if (!match && React.isValidElement(child)) {
      /* 路由匹配并为React.element元素的时候 */
      const path = child.props.path; //获取Route上的path
      children = child; /* 匹配的children */
      match = path
        ? matchPath(location.pathname, { ...child.props })
        : context.match; /* 计算是否匹配 */
    }
  });

  /* 克隆一份Children，混入 computedMatch 并渲染。 */
  return match
    ? React.cloneElement(children, { location, computedMatch: match })
    : null;
}
```

- Switch 也要订阅来自 context 的变化，然后对 children 元素，进行唯一性的路由匹配
- 通过 React.Children.forEach 遍历子 Route，然后通过 matchPath 进行匹配，如果匹配到组件，将克隆组件，混入 computedMatch，location 等信息
  <a name="xCm60"></a>

## hookApi

<a name="sthTV"></a>

### useHistory

```javascript
import { useContext } from "react";
import { RouterContext } from "../component/Router";
/* 用useContext获取上下文中的history对象 */
export default function useHistory() {
  return useContext(RouterContext).history;
}
```

<a name="ruDst"></a>

### useLocation

```javascript
import { useContext } from "react";
import { RouterContext } from "../component/Router";
/* 用useContext获取上下文中的location对象 */
export default function useLocation() {
  return useContext(RouterContext).location;
}
```

<a name="kLnC0"></a>

### useListen

```javascript
import { useEffect } from "react";
import { rootHistory } from "../component/Router";

/* 监听路由改变 */
function useListen(cb) {
  useEffect(() => {
    if (!rootHistory) return () => {};
    /* 绑定路由事件监听器 */
    const unlisten = rootHistory.listen((location) => {
      cb && cb(location);
    });
    return function () {
      unlisten && unlisten();
    };
  }, []);
}
export default useListen;
```

<a name="MdL9z"></a>

### withRouter

```javascript
import React , { useContext } from 'react'
import hoistStatics from 'hoist-non-react-statics'

import { RouterContext  } from '../component/Router'

export default function withRouter(Component){
    const WrapComponent = (props) =>{
        const { wrappedComponentRef, ...remainingProps } = props
        const context = useContext(RouterContext)
        return  <Component {...remainingProps}
            ref={wrappedComponentRef}
            {...context}
                />
    }
    return hoistStatics(WrapComponent,Component)
```

- 用在非路由组件上
- 在高阶组件的包装组件中，用 useContext 获取路由状态，并传递给原始组件
- 通过 hoist-non-react-statics 继承原始组件的静态属性
  <a name="usRX2"></a>

## 路由更新流程图

![](https://cdn.nlark.com/yuque/0/2022/webp/1350314/1642642245833-a688102b-493f-449f-9e18-196c1896951c.webp#clientId=u0971716f-d2e6-4&crop=0&crop=0&crop=1&crop=1&from=paste&id=u92a04d83&margin=%5Bobject%20Object%5D&originHeight=1346&originWidth=2396&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u728cd8e0-93aa-498f-b60c-ea73aeefeda&title=)
