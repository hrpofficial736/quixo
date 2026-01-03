import "./style.css";

async function addHeader() {
  const header = document.querySelector<HTMLDivElement>("#header");

  if (!header) {
    throw new Error("#header not found");
  }

  const res = await fetch("/src/components/header.html");
  header.innerHTML = await res.text();
}

document.addEventListener("DOMContentLoaded", async () => {
  await addHeader();
});
