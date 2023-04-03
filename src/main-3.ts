import "./style.css";
import katex from "katex";

const cursor = document.createElement("div");
cursor.classList.add("cursor");
console.log(cursor);
function makeFloat() {
  const editable = p.cloneNode(true) as HTMLParagraphElement;
  editable.setAttribute("contenteditable", "true");

  editable.innerHTML = p.innerHTML;

  function makePosition() {
    const targetStyles = window.getComputedStyle(p);
    const target = p;
    editable.style.position = "absolute";
    editable.style.top =
      target.offsetTop - parseFloat(targetStyles.marginTop) + "px";
    editable.style.left = target.offsetLeft - target.offsetWidth + "px";
    editable.style.width =
      target.offsetWidth -
      parseFloat(targetStyles.paddingLeft) -
      parseFloat(targetStyles.paddingRight) +
      "px";
    editable.style.height =
      target.offsetHeight -
      parseFloat(targetStyles.paddingBottom) -
      parseFloat(targetStyles.paddingTop) +
      "px";
    p.style.zIndex = "10001";
    p.style.opacity = "1";
    // p.style.pointerEvents = "none";
    editable.style.backgroundColor = targetStyles.backgroundColor;
    editable.style.color = targetStyles.color;
    editable.style.padding = targetStyles.padding;
    editable.style.margin = targetStyles.margin;
    editable.style.boxShadow = targetStyles.boxShadow;
    // editable.style.pointerEvents = "none";
    editable.style.opacity = "0";
    editable.style.zIndex = "1000";
    // editable.style.userSelect = "none";
  }
  // editable.classList.add("p");
  document.addEventListener("selectionchange", () => {
    // 监听 selectionchange 事件
    cursor.remove();
    const range = document.getSelection()?.getRangeAt(0);
    const prange = document.createRange();
    console.log(range);
    prange.setStart(p.firstChild as Node, range!.startOffset);
    prange.setEnd(p.firstChild as Node, range!.endOffset);
    prange.insertNode(cursor);
  });
  // user-select: none;
  // editable.style.font = targetStyles.font;
  // editable.style.fontStyle = targetStyles.fontStyle;
  // editable.style.fontSize = targetStyles.fontSize;
  document.body.appendChild(editable);
  makePosition();

  editable.addEventListener("keydown", keydown);
  editable.addEventListener("keypress", keydown);
  editable.addEventListener("keyup", keydown);
  editable.addEventListener("input", () => {
    // debugger;
    p.innerHTML = editable.innerHTML;
    const range = document.getSelection()?.getRangeAt(0);
    const prange = document.createRange();
    console.log(range);
    prange.setStart(p.firstChild as Node, range!.startOffset);
    prange.setEnd(p.firstChild as Node, range!.endOffset);
    prange.insertNode(cursor);
  });

  window.addEventListener("resize", () => setTimeout(makePosition, 500));

  // setInterval(() => { // 使用定时器检测位置变化
  //   let currentPosition = targetElement.getBoundingClientRect(); // 获取当前位置

  //   if (initialPosition.top !== currentPosition.top || initialPosition.left !== currentPosition.left) { // 比较初始位置和当前位置
  //     console.log('DOM element position has changed'); // 位置发生变化，执行相应操作
  //     initialPosition = currentPosition; // 更新初始位置
  //   }
  // }, 100); // 每 100 毫秒检测一次位置变化
}

const p = document.createElement("p");
const bt = document.createElement("button");

p.classList.add("p");

// p.contentEditable = "true";

// document.body.appendChild();
bt.addEventListener("click", makeFloat);
bt.innerHTML = "Add float";

function keydown(e: KeyboardEvent) {
  // console.log(e);
}

const formula = "\\int_{a}^{b} f(x) dx"; // 要插入的公式
// { displayMode: true }
const renderedFormula = katex.renderToString(formula, { output: "mathml" });
p.innerHTML =
  "Lorem ipsum <b>dolor <i>sit <code>amet</code></i></b>, consectetur adipiscing elit, sed do eiusmod <code>tempor <b><i><code>incididunt</code></i></b></code> ut labore et dolore magna aliqua." +
  renderedFormula;
p.innerHTML = p.textContent as string;
const pc = p.cloneNode() as HTMLParagraphElement;
const pa = p.cloneNode() as HTMLParagraphElement;
pc.innerHTML = p.innerHTML;
pa.innerHTML = p.innerHTML;

document.body.appendChild(pa);
document.body.appendChild(p);

document.body.appendChild(pc);
makeFloat();

// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
