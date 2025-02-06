'use client';

import React, { useEffect, useRef } from "react";
import "@/Styles/Home.css";

type Props = {};

const FeatureList = (props: Props) => {
  const features = {
    completed: ["Feature 1", "Feature 2"],
    currentlyBuilding: ["Feature 3"],
    future: ["Feature 4", "Feature 5"]
  };

  const currentlyBuildingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentlyBuildingRef.current) {
      currentlyBuildingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="flex flex-col h-[10rem] overflow-scroll py-[1rem] scroll-container">
      {Object.entries(features).map(([category, featureList], categoryIndex) => (
        <div
          key={categoryIndex}
          ref={categoryIndex === 1 ? currentlyBuildingRef : null}
          className={`${categoryIndex === 1 ? "text-2xl font-italic" : ""} mb-4`}
        >
          <div className="underline">{category}</div>
          {featureList.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex flex-col items-center mt-[0.4rem]">
              <div className="text-center">{feature}</div>
              <div>|</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default FeatureList;