import ReactDOM from "react-dom/client";
import timelineItems from "./timelineItems";
import Timeline from "./components/Timeline";
import assignLanes from "./assignLanes";

function App(): JSX.Element {
  const lanes = assignLanes(timelineItems);
  const url = new URL("./img/timelime_logo.png", import.meta.url);
  return (
    <div>
      <img
        src={url.toString()}
        alt="Time Lime Logo"
        style={{
          height: "150px",
          width: "auto",
          display: "block",
          margin: "0 auto 20px auto",
          marginTop: "30px",
        }}
      />

      <Timeline items={lanes} timelineStartDate={timelineItems[0].start} />
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
