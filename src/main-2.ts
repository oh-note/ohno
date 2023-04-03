import "./style.css";

function makeFloat() {
  const editable = p.cloneNode(true) as HTMLParagraphElement;
  const rect = p.getBoundingClientRect();
  const targetStyles = window.getComputedStyle(p);
  const target = p;
  // editable.classList.add("p");
  editable.setAttribute("contenteditable", "true");
  editable.style.position = "absolute";

  editable.style.top =
    target.offsetTop -
    parseFloat(targetStyles.marginTop) +
    // target.offsetHeight +
    "px";
  editable.style.left = target.offsetLeft + "px";
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
  p.style.zIndex = "1000";
  p.style.opacity = "0.5";
  p.style.pointerEvents = "none";
  editable.style.backgroundColor = targetStyles.backgroundColor;
  editable.style.color = targetStyles.color;
  editable.style.padding = targetStyles.padding;
  editable.style.margin = targetStyles.margin;
  editable.style.boxShadow = targetStyles.boxShadow;
  editable.innerHTML = "Lorem ipsum <b>dolor <i>sit <code>amet</code></i></b>, consectetur adipiscing elit, sed do eiusmod <code>tempor <b><i><code>incididunt</code></i></b></code> .";
  // editable.style.pointerEvents = "none";
  editable.style.userSelect = "none";
  // user-select: none;
  // editable.style.font = targetStyles.font;
  // editable.style.fontStyle = targetStyles.fontStyle;
  // editable.style.fontSize = targetStyles.fontSize;
  document.body.appendChild(editable);
}

const p = document.createElement("p");
const bt = document.createElement("button");

p.classList.add("p");
p.innerHTML =
  "Lorem ipsum <b>dolor <i>sit <code>amet</code></i></b>, consectetur adipiscing elit, sed do eiusmod <code>tempor <b><i><code>incididunt</code></i></b></code> ut labore et dolore magna aliqua.";

// p.contentEditable = "true";
document.body.appendChild(p);
document.body.appendChild(p.cloneNode(true));
document.body.appendChild(bt);
// document.body.appendChild();
bt.addEventListener("click", makeFloat);
bt.innerHTML = "Add float";
makeFloat();

function keydown(e: KeyboardEvent) {
  console.log(e);
}

p.addEventListener("keydown", keydown);
p.addEventListener("keypress", keydown);
p.addEventListener("keyup", keydown);

// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
