// 지도 핀. 카카오 오버레이는 React 밖 DOM이라 직접 만든다.
// 이름은 외부(카카오) 데이터이므로 innerHTML 대신 textContent로만 넣는다 (스크립트 삽입 방지).

// 이름 말풍선 핀: 입점 체육관(주황) 또는 선택된 미입점 장소(검정)
export function pill(name: string, kind: "partner" | "place", selected = false): HTMLElement {
  const wrap = document.createElement("button");
  wrap.type = "button";
  wrap.className = "flex flex-col items-center";
  const label = document.createElement("span");
  const tail = document.createElement("span");
  if (kind === "partner") {
    label.className = `max-w-40 truncate rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow-lg ring-2 ${
      selected ? "ring-ink" : "ring-white"
    }`;
    tail.className = "-mt-1 h-2 w-2 rotate-45 bg-brand";
  } else {
    label.className =
      "max-w-40 truncate rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white shadow-lg ring-2 ring-white";
    tail.className = "-mt-1 h-2 w-2 rotate-45 bg-ink";
  }
  label.textContent = name;
  wrap.append(label, tail);
  return wrap;
}

// 미입점 장소: 작은 점 (수십 개가 겹쳐도 지도가 덜 지저분하도록)
export function dot(): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", "체육관");
  el.className = "block h-4 w-4 rounded-full bg-ink/75 shadow ring-2 ring-white";
  return el;
}

export function myDot(): HTMLElement {
  const el = document.createElement("span");
  el.className = "block h-4 w-4 rounded-full bg-blue-500 ring-4 ring-blue-500/25";
  return el;
}
