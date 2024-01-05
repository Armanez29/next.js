"use client";

import useInterval from "../lib/useInterval";
import { useStore } from "../lib/store";

const useClock = () => {
  return useStore((store) => ({
    lastUpdate: store.lastUpdate,
    light: store.light,
  }));
};

const formatTime = (time: number) => {
  // cut off except hh:mm:ss
  return new Date(time).toJSON().slice(11, 19);
};

const Clock = () => {
  const { lastUpdate, light } = useClock();

  const tick = useStore((store) => store.tick);

  // Tick the time every second
  useInterval(() => {
    tick(Date.now(), true);
  }, 1000);
  return (
    <div className={light ? "light" : ""}>
      {formatTime(lastUpdate)}
      <style jsx>{`
        div {
          padding: 15px;
          display: inline-block;
          color: #82fa58;
          font: 50px menlo, monaco, monospace;
          background-color: #000;
        }

        .light {
          background-color: #999;
        }
      `}</style>
    </div>
  );
};

export default Clock;
