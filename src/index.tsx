import ReactDOM from "react-dom/client";
import timelineItems from "./timelineItems";
import Timeline from "./components/Timeline";
import assignLanes from "./assignLanes";

function App(): JSX.Element {
  const lanes = assignLanes(timelineItems);
  return (
    <div>
      <h2>Good luck with your assignment! {"\u2728"}</h2>
      <Timeline items={lanes} timelineStartDate={timelineItems[0].start} />
      <div>
        {lanes.map((lane) => (
          <li key={lane[0].id}>
            {lane.map((item) => (
              <div key={item.id}>
                {item.name} {item.start} {item.end}
              </div>
            ))}
          </li>
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
